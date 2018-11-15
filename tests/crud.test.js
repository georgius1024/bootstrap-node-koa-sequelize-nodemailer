/**
 * Created by georgius on 14.08.2018.
 */
const Crud = require('../classes/crud')
const assert = require('chai').assert
const pick = require('lodash.pick')

class FakeModel {
  constructor (maxLen = 100) {
    this.maxLen = maxLen
    this.queryOptions = {}
    this.saved = 0
    this.fields = {}
  }

  findByPk(id, queryOptions) {
    this.queryOptions = queryOptions
    if (id === 999) {
      return this
    }
    if (id !== 555) {
      return {
        id: id,
        text: '#' + (Number(id) + 1),
        col1: '#1#1#' + id + 10
      }
    }
  }

  findAll(queryOptions) {
    this.queryOptions = queryOptions

    const offset = queryOptions.offset || 0
    const limit = queryOptions.limit || this.maxLen
    const data = []
    for(let i = offset; i < offset + limit; i++) {
      data.push({
        id: i + 1,
        text: '#' + i
      })
    }
    return data
  }
  findAndCountAll(queryOptions) {
    this.queryOptions = queryOptions

    const offset = queryOptions.offset || 0
    const limit = queryOptions.limit || this.maxLen
    const data = {
      rows: [],
      count: this.maxLen
    }
    for(let i = offset; i < offset + limit; i++) {
      data.rows.push({
        id: i + 1,
        text: '#' + (Number(i) + 1),
        col1: '#1#1#' + i + 10
      })
    }
    return data
  }
  build(fields, queryOptions) {
    this.queryOptions = queryOptions
    this.fields = fields
    return this
  }
  save() {
    if (this.fields.throw) {
      throw new Error('Save error')
    }
    if (!this.fields.validable) {
      let error = new Error('Validation error')
      error.errors = [{
        message: 'validation fake error',
        validatorKey: 'fake',
        path: 'validable'
      }]
      throw error
    }

    this.saved += 1
    return this
  }
  update(fields, queryOptions) {
    this.queryOptions = queryOptions
    this.fields = fields
    if (this.fields.throw) {
      throw new Error('Update error')
    }
    if (!this.fields.validable) {
      let error = new Error('Validation error')
      error.errors = [{
        message: 'validation fake error',
        validatorKey: 'fake',
        path: 'validable'
      }]
      throw error
    }
    this.saved += 1
    return this
  }
  destroy() {
    this.saved += 1
    return this
  }
}

const attributes = ['id', 'text']
const format = (row => {
  return pick(row, attributes)
})

describe('crud class', async () => {
  let crud
  it('Creates with model', async function() {
    crud = new Crud(new FakeModel())
    assert.isOk(crud)
  })

  it('Does not creates without model', async function() {
    const fn = () => crud = new Crud()
    assert.throws(fn)
  })

  it('Can show existing record', async () => {
    const o1 = await crud.show(1, {x: 'y'})
    assert.isOk(o1)
    assert.equal(o1.id, 1)
    assert.isOk(o1.col1)
    assert.notOk(crud.model.queryOptions.x, 'y')
    const o2 = await crud.show(100, { attributes })
    assert.isOk(o2)
    assert.equal(o2.id, 100)
    assert.isOk(o2.col1)
    assert.deepEqual(crud.model.queryOptions, { attributes: [ 'id', 'text' ] })

    const o3 = await crud.show(1000, { format })
    assert.isOk(o3)
    assert.equal(o3.id, 1000)
    assert.notOk(o3.col1)

  })

  it('Can not show not existing record', async () => {
    let errorCnt = 0
    try {
      const o1 = await crud.show(555)
      assert.isNotOk(o1)
    } catch (error) {
      errorCnt ++
    }
    assert.isOk(errorCnt)
  })

  it('Can store new record', async () => {
    const options = {
      before: (fields) => {
        fields.name = 'New Name'
      },
      after: (instance) => {
        instance['рога'] = 'нет'
      }
    }
    const fields = {
      id: 'new'
    }
    // JUST EXCEPTION
    let errorCnt = 0
    try {
      const fields = {throw: true}
      await crud.create(fields, options)
    } catch (error) {
      errorCnt++
    }
    assert.equal(errorCnt, 1)

    // NOT VALIDABLE
    errorCnt = 0
    try {
      const fields = {validable: false}
      await crud.create(fields, options)
    } catch (error) {
      errorCnt++
    }
    assert.equal(errorCnt, 1)
    // VALIDABLE
    fields.validable = true
    const o1 = await crud.create(fields, options)
    assert.isOk(o1)
    assert.equal(o1.fields.name, 'New Name')
    assert.equal(o1.fields.id, 'new')
    assert.equal(o1['рога'], 'нет')
    assert.equal(crud.model.saved, 1)

    crud.model.saved = 0
    options.format = format
    const o3 = await crud.create(fields, options)
    assert.deepEqual(o3, {})
    assert.equal(crud.model.saved, 1)


  })

  it('Can update existing record', async () => {
    const options = {
      before: (instance, fields) => {
        fields.name = fields.name.toUpperCase()
      },
      after: (instance) => {
        instance['рога'] = 'нет'
      }
    }
    // JUST EXCEPTION
    let errorCnt = 0
    try {
      const fields = {name: 'n', throw: true}
      await crud.update(999, fields, options)
    } catch (error) {
      errorCnt++
    }
    assert.equal(errorCnt, 1)

    // NOT VALIDABLE
    errorCnt = 0
    try {
      const fields = {name: 'n', validable: false}
      await crud.update(999, fields, options)
    } catch (error) {
      errorCnt++
    }
    assert.equal(errorCnt, 1)

    // VALIDABLE
    const fields2 = {name: 'new name', validable: true}
    const o1 = await crud.update(999, fields2, options)

    assert.isOk(o1)
    assert.deepEqual(o1.fields, { name: 'NEW NAME', validable: true })
    assert.equal(o1['рога'], 'нет')
    assert.equal(crud.model.saved, 2)

    options.format = format
    const o2 = await crud.update(999, fields2, options)
    assert.deepEqual(o2, {})
  })
  it('Can not update not existing record', async () => {
    let errorCnt = 0
    try {
      const o1 = await crud.update(555)
      assert.isNotOk(o1)
    } catch (error) {
      errorCnt ++
    }
    assert.isOk(errorCnt)
    assert.equal(crud.model.saved, 3)
  })

  it('Can destroy existing record', async () => {
    const options = {
      before: () => {},
      after: () => {}
    }

    let errorCnt = 0

    try {
      await crud.destroy(999, options)
    } catch (error) {
      errorCnt ++
    }
    assert.equal(errorCnt, 0)
    assert.equal(crud.model.saved, 4)
  })

  it('Can not destroy not existing record', async () => {
    let errorCnt = 0
    try {
      const o1 = await crud.destroy(555)
      assert.isNotOk(o1)
    } catch (error) {
      errorCnt ++
    }
    assert.equal(errorCnt, 1)
    assert.equal(crud.model.saved, 4)

  })

})
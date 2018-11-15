/**
 * Created by georgius on 14.08.2018.
 */
const Browse = require('../classes/browse')
const assert = require('chai').assert
const pick = require('lodash.pick')

class FakeModel {
  constructor (maxLen = 100) {
    this.maxLen = maxLen
    this.queryOptions = {}
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
}

const attributes = ['id', 'text']
const formatRow = (row => {
  return pick(row, attributes)
})

describe('browse class', async () => {
  let browse
  it('Creates with model', async function() {
    browse = new Browse(new FakeModel())
    assert.isOk(browse)
  })

  it('Does not creates without model', async function() {
    const fn = () => browse = new Browse()
    assert.throws(fn)
  })

  it('Can fetch whole table', async function() {
    const options = {
      attributes,
      format: formatRow
    }
    const {meta, data} = await browse.pagination(options)

    assert.equal(meta.from, 0)
    assert.equal(meta.to, 99)
    assert.equal(data.length, 100)
    assert.equal(data[0].id, 1)
    assert.equal(data[99].id, 100)
    assert.isNotOk(data[0].col1)

  })

  it('Can fetch first page', async function() {
    const options = {
      attributes,
      format: formatRow,
      limit: 10,
      page: 0
    }
    const {meta, data} = await browse.pagination(options)
    assert.equal(meta.from, 0)
    assert.equal(meta.to, 9)
    assert.equal(data.length, 10)
    assert.equal(data[0].id, 1)
    assert.equal(data[9].id, 10)
    assert.isNotOk(data[0].col1)
  })

  it('Can fetch second page', async function() {
    const options = {
      attributes,
      format: formatRow,
      limit: 10,
      page: 1
    }
    const {meta, data} = await browse.pagination(options)
    // console.log(meta, data)
    assert.equal(meta.from, 10)
    assert.equal(meta.to, 19)
    assert.equal(data.length, 10)
    assert.equal(data[0].id, 11)
    assert.equal(data[9].id, 20)
    assert.isNotOk(data[0].col1)
  })

  it('Can fix incorrect page', async function() {
    const options = {
      attributes,
      format: formatRow,
      limit: 10,
      page: 1000
    }
    const {meta, data} = await browse.pagination(options)
    assert.equal(meta.from, 0)
    assert.equal(meta.to, 9)
    assert.equal(data.length, 10)
    assert.equal(data[0].id, 1)
    assert.equal(data[9].id, 10)
    assert.isNotOk(data[0].col1)
  })

  it('Can locate record #33', async function() {
    const options = {
      attributes,
      format: formatRow,
      locate: 33,
      limit: 10,
      page: 10
    }
    const {meta, data} = await browse.pagination(options)
    // console.log(meta, data)
    assert.equal(meta.pageNo, 3)
    assert.equal(meta.from, 30)
    assert.equal(meta.to, 39)
    assert.equal(data.length, 10)
    assert.equal(data[0].id, 31)
    assert.equal(data[9].id, 40)
  })

  it('Can deal with sort', async function() {
    const options = {
      attributes,
      format: formatRow,
      order: ['id', 'desc'],
      limit: 10,
      page: 4
    }
    await browse.pagination(options)
    assert.deepEqual(browse.model.queryOptions.order, ['id', 'desc'])
  })

  it('Can highlight search with color', async function() {
    const options = {
      attributes,
      format: formatRow,
      search: '33',
      searchColumns: ['text'],
      highlight: {color: 'red'},
      limit: 10,
      page: 3
    }
    const {data} = await browse.pagination(options)
    assert.equal(data[2].text, '#<span style="color:red">33</span>')
    //console.log(meta, data, browse.model.queryOptions)
  })

  it('Can highlight search with class', async function() {
    const options = {
      attributes,
      format: formatRow,
      search: '33',
      searchColumns: ['text'],
      highlight: {class: 'red'},
      limit: 10,
      page: 3
    }
    const {data} = await browse.pagination(options)
    assert.equal(data[2].text, '#<span class="red">33</span>')
    //console.log(meta, data, browse.model.queryOptions)
  })

  it('Browse.table ignores pagination', async () => {
    const options = {
      attributes,
      format: formatRow,
      limit: 10,
      page: 3
    }
    const {meta, data} = await browse.table(options)

    assert.equal(meta.from, 0)
    assert.equal(meta.to, 99)
    assert.equal(data.length, 100)
    assert.equal(data[0].id, 1)
    assert.equal(data[99].id, 100)
    assert.isNotOk(data[0].col1)

  })

})
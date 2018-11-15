/**
 * Created by georgius on 24.07.18.
 */
const pick = require('lodash.pick')
const optionsAvail = ['attributes', 'fields', 'raw', 'silent', 'validate', 'hooks', 'transaction', 'include', 'paranoid']
class Crud {
  constructor(model) {
    if (!model) {
      throw new Error('Model is required')
    }
    this.model = model
  }

  async show (id, options = {}) {
    const queryOptions = pick(options, optionsAvail)
    const instance = await this.model.findById(id, queryOptions)
    if (!instance) {
      return Crud.notFoundError()
    } else {
      if (options.format) {
        return options.format(instance)
      } else {
        return instance
      }
    }
  }

  // creates record
  // fields values for insert: {name: 'Special name', field1: 'val1' ... fieldN: 'valN'}
  // options: see options for create http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-create
  // f.e.: { fields: ['name', 'field1', ... 'fieldN'] }
  // options.before(fields, queryOptions) - before  create
  // options.after(instance) - after create
  // options.format(instance) - formats output
  // returns instance (formatted)
  async create (fields, options = {}) {
    const queryOptions = pick(options, optionsAvail)
    if (options.before) {
      await options.before(fields, queryOptions)
    }
    let instance
    try {
      instance = await this.model
        .build(fields, queryOptions)
        .save()
    } catch (error) {
      if (Array.isArray(error.errors) && error.errors.length) {
        return Crud.validationError(error)
      } else {
        throw (error)
      }
    }
    if (options.after) {
      await options.after(instance)
    }
    if (options.format) {
      return options.format(instance)
    } else {
      return instance
    }
  }

  // updates record
  // id: primary key value for model
  // fields values for update: {name: 'Special name', field1: 'val1' ... fieldN: 'valN'}
  // options: see options for update http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-update
  // f.e.: { fields: ['name', 'field1', ... 'fieldN'] }
  // options.before(instance, fields, queryOptions) - before update
  // options.after(instance) - after update
  // options.format(instance) - formats output
  // returns instance (formatted)
  async update (id, fields, options = {}) {
    const queryOptions = pick(options, optionsAvail)
    const instance = await this.model.findById(id, queryOptions)
    if (!instance) {
      return Crud.notFoundError()
    } else {
      const queryOptions = pick(options, optionsAvail)
      if (options.before) {
        await options.before(instance, fields, queryOptions)
      }
      try {
        await instance.update(fields, queryOptions)
      } catch (error) {
        if (Array.isArray(error.errors) && error.errors.length) {
          return Crud.validationError(error)
        } else {
          throw (error)
        }
      }
      if (options.after) {
        await options.after(instance)
      }
      if (options.format) {
        return options.format(instance)
      } else {
        return instance
      }
    }
  }

  // deletes record
  // id: primary key value for model
  // options: see options for destroy http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-destroy
  // options.before(instance, queryOptions) - before delete
  // options.after(instance) - after delete

  async destroy(id, options = {}) {
    const instance = await this.model.findById(id)
    if (!instance) {
      return Crud.notFoundError()
    } else {
      if (options.before) {
        await options.before(instance)
      }
      await instance.destroy()
      if (options.after) {
        await options.after(instance)
      }
    }
  }
  // Internal - executes when record not found
  static notFoundError() {
    const error = new Error('Not found')
    error.name = 'notFoundError'
    throw error
  }

  // Internal - executes when validation fails
  static validationError(initialError) {
    let errors = initialError.errors.map(error => {
      return {
        message: error.message,
        validation: error.validatorKey,
        field: error.path
      }
    })

    const error = new Error('Validation failed')
    error.errors = errors
    error.name = 'validationError'
    throw error
  }
}

module.exports = Crud
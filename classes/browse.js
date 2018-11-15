/**
 * Created by georgius on 25.07.18.
 */
const pick = require('lodash.pick')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

class Browse {
  constructor (model) {
    if (!model) {
      throw new Error('Model is required')
    }
    this.model = model
  }

  /*
   options: {
   //// ОПЦИИ ЗАПРОСА ////
   order: ['id', 'desc'], // см http://docs.sequelizejs.com/manual/tutorial/querying.html#ordering
   attributes: ['id', 'name', 'title'], // см http://docs.sequelizejs.com/manual/tutorial/querying.html#attributes
   limit: 10, // http://docs.sequelizejs.com/manual/tutorial/querying.html#pagination-limiting
   include:[{model: AnotherModel1}, {model: AnotherModel2}] // http://docs.sequelizejs.com/manual/tutorial/models-usage.html#eager-loading
   page: 0, // 0-based
   //// ПОИСК ТЕКСТА ////
   search: 'aba',
   searchColumns: ['name', 'title'],
   highlight: {class: 'red'}  // Подсветка найденных
   или
   highlight: {color: '#ffddcc'}
   //// ПОИСК ЗАПИСИ ////
   locate: 101 // id-to-locate
   //// ПОСТОБРАБОТКА ////
   format: row => {
   row.name = row.name.toUpper()
   }
   }
  */

  async pagination (options) {
    const queryOptions = pick(options, ['attributes', 'paranoid', 'transaction', 'raw', 'having', 'order', 'include', 'where'])

    // Поиск
    if (options.search && options.searchColumns) {
      if (!queryOptions.where) {
        queryOptions.where = {}
      }
      queryOptions.where[Op.or] = options.searchColumns.map(column => {
        return {
          [column]: {
            [Op.like]: '%' + options.search + '%'
          }
        }
      })
    }
    // Поиск страницы, где нужная запись
    if (options.locate && options.limit) {
      const rawData = await this.model.findAll(queryOptions)
      let offset = -1
      rawData.forEach((row, index) => {
        if (Number(row.id) === Number(options.locate)) {
          offset = index
        }
      })
      if (offset >= 0) {
        options.page = Math.floor(offset / options.limit)
      }
    }

    // Пагинация
    if (options.limit) {
      queryOptions.offset = options.page * options.limit || 0
      queryOptions.limit = options.limit
    }
    let rawData = await this.model.findAndCountAll(queryOptions)
    if (queryOptions.offset > rawData.count) {
      queryOptions.offset = 0
      rawData = await this.model.findAndCountAll(queryOptions)
    }
    const meta = {
      total: rawData.count
    }
    if (options.limit) {
      meta.rowsPerPage = queryOptions.limit
      meta.pageNo = Math.floor(queryOptions.offset / queryOptions.limit)
      meta.pages = Math.ceil(rawData.count / queryOptions.limit)
      meta.from = Math.min(rawData.count - 1, queryOptions.offset)
      meta.to = Math.min(rawData.count, queryOptions.offset + queryOptions.limit) - 1
    } else {
      meta.from = Math.min(rawData.count - 1, 0)
      meta.to = rawData.count - 1
    }
    let data = rawData.rows
    if (options.search && options.highlight) {
      data = data.map(row => {
        options.searchColumns.forEach(column => {
          if (options.highlight.class) {
            row[column] = Browse.highlightClass(row[column], options.search, options.highlight.class)
          }
          else if (options.highlight.color) {
            row[column] = Browse.highlightColor(row[column], options.search, options.highlight.color)
          }
        })
        return row
      })
    }
    if (options.format) {
      data = data.map(options.format)
    }
    return {data, meta}
  }

  async table (options) {
    delete options.limit
    delete options.page
    delete options.locate
    return await this.pagination(options)
  }

  static highlightClass (text, search, hlClass) {
    return String(text || '').replace(new RegExp(search, 'ig'), `<span class="${hlClass}">$&</span>`)
  }

  static highlightColor (text, search, hlColor) {
    return String(text || '').replace(new RegExp(search, 'ig'), `<span style="color:${hlColor}">$&</span>`)
  }

}

module.exports = Browse
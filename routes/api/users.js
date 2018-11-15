/**
 * Created by georgius on 23.07.18.
 */

const Router = require('koa-router')
const _ = require('lodash')
const uuidv1 = require('uuid/v1')
const {User, Token} = require('../../models')
const logger = require('../../classes/logger')
const Response = require('../../classes/response')
const Crud = require('../../classes/crud')
const Browse = require('../../classes/browse')

const router = new Router()
const browse = new Browse(User)
const crud = new Crud(User)
const attributes = ['id', 'name', 'email', 'role', 'status']
const formatRow = (row => {
  return _.pick(row, attributes)
})

router.get('/', async (ctx) => {
  const options = {
    attributes,
    order: [[ctx.query.sort_column || 'id', ctx.query.sort_order || 'asc']],
    limit: Number(ctx.query.rows_per_page) || 10,
    page: Number(ctx.query.page_no) || 0,
    search: ctx.query.search,
    searchColumns: ['name', 'email'],
    highlight: {
      color: 'red',
    },
    include: {
      model: Token,
      attributes: [['token', 'RefreshToken']]
    },
    locate: Number(ctx.query.locate)
  }
  try {
    const {data, meta} = await browse.pagination(options)
    return Response.list(ctx, data, meta)
  } catch (error) {
    logger.error(error)
    return Response.error(ctx, error)
  }
})

router.get('/:id', async (ctx) => {
  try {
    const options = {
      attributes,
      include: {
        model: Token,
        attributes: [['token', 'RefreshToken']]
      },
    }
    const instance = await crud.show(ctx.params.id, options)
    return Response.show(ctx, instance)
  } catch (error) {
    logger.error(error)
    if (error.name === 'notFoundError') {
      return Response.notFound(ctx)
    } else {
      return Response.error(ctx, error.message)
    }
  }
})

router.post('/', async (ctx) => {
  try {
    const options = {
      fields: _.union(attributes, ['password']),
      format: formatRow
    }
    const fields = ctx.request.body
    fields.status = 'active'
    fields.verification_code = uuidv1()
    const instance = await crud.create(fields, options)
    return Response.created(ctx, instance, 'Пользователь создан')
  } catch (error) {
    logger.error(error)
    if (error.name === 'validationError') {
      return Response.validation(ctx, error.errors)
    } else {
      return Response.error(ctx, error.message)
    }
  }
})

router.put('/:id', async (ctx) => {
  try {
    const options = {
      fields: attributes,
      format: formatRow
    }
    const fields = ctx.request.body
    if (!fields.password) {
      options.fields = _.union(attributes, ['password'])
    }
    const instance = await crud.update(ctx.params.id, fields, options)
    return Response.updated(ctx, instance, 'Пользователь обновлен')
  } catch (error) {
    logger.error(error)
    if (error.name === 'notFoundError') {
      return Response.notFound(ctx)
    } else if (error.name === 'validationError') {
      return Response.validation(ctx, error.errors)
    } else {
      return Response.error(ctx, error.message)
    }
  }
})

router.delete('/:id', async (ctx) => {
  try {
    const options = {
      before: async(user) => {
        user.email = uuidv1() + '-' + user.email
        await user.save({
          validate: false
        })
      }
    }
    await crud.destroy(ctx.params.id, options)
    return Response.deleted(ctx, 'Пользователь удален')
  } catch (error) {
    logger.error(error)
    if (error.name === 'notFoundError') {
      return Response.notFound(ctx)
    } else {
      return Response.error(ctx, error.message)
    }
  }
})

module.exports = router

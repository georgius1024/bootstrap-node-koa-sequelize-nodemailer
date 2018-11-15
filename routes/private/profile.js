/**
 * Created by georgius on 18.07.2018.
 */

const Router = require('koa-router')
const _ = require('lodash')
const { User } = require('../../models')
const { publicProfile } = require('../../classes/auth')
const logger = require('../../classes/logger')
const Response = require('../../classes/response')

const router = new Router()

router.get('/', async (ctx, next) => {

  const userId = _.get(ctx, 'state.token.user.id', 0)
  const user = await User.findById(userId)
  if (!user) {
    logger.error('user #%d not logged in', userId)
    return Response.unauthorized(ctx)
  } else {
    const userData = publicProfile(user)
    return Response.generic(ctx, userData)
  }
})

router.post('/', async (ctx, next) => {

  const userId = _.get(ctx, 'state.token.user.id', 0)
  const user = await User.findById(userId)
  if (!user) {
    logger.error('user #%d not logged in', userId)
    return Response.unauthorized(ctx)
  } else {
    user.name = ctx.request.body.name || user.name
    user.email = ctx.request.body.email || user.email
    await user.save()
    const userData = publicProfile(user)
    logger.debug('user #%d updated profile', user.id)
    return Response.generic(ctx, userData)
  }
})

module.exports = router

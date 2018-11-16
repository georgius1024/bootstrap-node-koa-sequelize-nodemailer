/**
 * Created by georgius on 18.07.2018.
 */

const Router = require('koa-router')
const _get = require('lodash.get')
const { User } = require('../../models')
const { publicProfile } = require('../../classes/auth')
const logger = require('../../classes/logger')
const Response = require('../../classes/response')

const router = new Router()

router.get('/', async (ctx, next) => {
  const userId = _get(ctx, 'state.token.user.id', 0)
  const user = await User.findByPk(userId)
  if (user) {
    const userData = publicProfile(user)
    return Response.generic(ctx, userData)
  } else {
    return Response.unauthorized(ctx)
  }
})

router.post('/', async (ctx, next) => {
  const userId = _get(ctx, 'state.token.user.id', 0)
  const user = await User.findByPk(userId)
  if (user) {
    user.name = ctx.request.body.name || user.name
    user.email = ctx.request.body.email || user.email
    user.about = ctx.request.body.about || user.about
    await user.save()
    const userData = publicProfile(user)
    logger.debug('user #%d updated profile', user.id)
    return Response.generic(ctx, userData)
  } else {
    return Response.unauthorized(ctx)
  }
})

module.exports = router

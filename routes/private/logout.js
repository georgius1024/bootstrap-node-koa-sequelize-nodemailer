/**
 * Created by georgius on 18.07.2018.
 */

const Router = require('koa-router')
const bcrypt = require('bcrypt')
const _ = require('lodash')
const { User, Token } = require('../../models')
const logger = require('../../classes/logger')
const Response = require('../../classes/response')

const router = new Router()
router.get('/', async (ctx) => {
  const userId = _.get(ctx, 'state.token.user.id', 0)
  const user = await User.findById(userId)
  if (!user) {
    return Response.notFound(ctx)
  } else {
    await Token.destroy({
      where: {
        user_id: user.id
      }
    })
    logger.debug('user #%d logged out', user.id)
    // Frontend должен удалить главный токен сам
    return Response.unauthorized(ctx, '')
  }
})

module.exports = router

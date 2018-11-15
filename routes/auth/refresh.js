/**
 * Created by georgius on 18.07.2018.
 */

const Router = require('koa-router')
const {generateTokens, publicProfile} = require('../../classes/auth')
const logger = require('../../classes/logger')
const {Token, User} = require('../../models')
const Response = require('../../classes/response')

const router = new Router()

router.post('/', async (ctx, next) => {
  const list = await Token.findAll({
    where: {
      token: ctx.request.body.token
    }
  })
  const token = list[0]
  if (token) {
    token.destroy()
    const user = await User.findById(token.user_id)
    if (user) {
      logger.error('user #%d refreshed token', user.id)
      const userData = publicProfile(user)
      const auth = await generateTokens(userData)
      return Response.authorized(ctx, userData, auth, 'Мы ждали Вас, ' + userData.name)
    } else {
      logger.error('Wrong refresh token', token)
      return Response.error(ctx, 'Невозможно обновить токен, залогиньтесь, пожалуйста', 401)
    }
  } else {
    logger.error('Wrong refresh request', ctx.request.body)
    return Response.error(ctx, 'Невозможно обновить токен, перелогиньтесь, пожалуйста', 401)
  }
  logger.info(ctx.request.body.token)
})

module.exports = router

/*
module.exports = (path, parent) => {
  parent.use(path, router.routes(), router.allowedMethods())
}
*/
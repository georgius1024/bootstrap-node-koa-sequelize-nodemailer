/**
 * Created by georgius on 18.07.2018.
 */

const Router = require('koa-router')
const passport = require('koa-passport')
const bcrypt = require('bcrypt')
const { generateTokens, publicProfile } = require('../../classes/auth')
const logger = require('../../classes/logger')
const Response = require('../../classes/response')
const { welcomeMessage } = require('../../classes/mailer')

const router = new Router()

router.post('/', async (ctx, next) => {
  console.log(ctx.request.body)

  return passport.authenticate('local', async (err, user) => {
    if (!user) {
      logger.trace(err)
      return Response.error(ctx, err || 'Требуется логин и пароль', 404)
    } else {
      try {
        if (user.status === 'new') {
          await welcomeMessage(user)
          return Response.error(ctx, 'Пожалуйста, активируйте учетную запись, перейдя по ссылке в письме!')
        }
        const userData = publicProfile(user)
        logger.error('user #%d logged in', user.id)
        const auth = await generateTokens(userData)
        return Response.authorized(ctx, userData, auth, 'Мы ждали Вас, ' + userData.name)
      } catch (e) {
        logger.error(e)
        return Response.error(ctx, e.message)
      }
    }
  })(ctx, next)
})

module.exports = router

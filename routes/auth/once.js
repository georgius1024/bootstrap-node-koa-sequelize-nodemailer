/**
 * Created by georgius on 18.07.2018.
 */

const Router = require('koa-router')
const uuidv1 = require('uuid/v1');
const { generateTokens, publicProfile } = require('../../classes/auth')
const { User } = require('../../models')
const logger = require('../../classes/logger')
const Response = require('../../classes/response')

const router = new Router()

router.get('/:code', async (ctx) => {
  const verificationCode = ctx.params.code
  const user = await User.findOne({
    where: {
      verification_code: verificationCode
    }
  })
  if (!user) {
    return Response.error(ctx, 'Неправильный код авторизации. Вероятно, эта одноразовая ссылка уже была использована', 404)
  } else {
    try {
      user.verification_code = uuidv1()
      if (user.status === 'new') {
        user.status = 'active'
      }
      await user.save()
      const userData = publicProfile(user)
      logger.error('user #%d logged in', user.id)
      const auth = await generateTokens(userData)
      return Response.authorized(ctx, userData, auth, 'Мы ждали Вас, ' + user.name)
    } catch (e) {
      logger.error(e)
      return Response.error(ctx, e.message)
    }
  }
})

module.exports = router

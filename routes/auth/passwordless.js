/**
 * Created by georgius on 18.07.2018.
 */

const Router = require('koa-router')
const _ = require('lodash')
const uuidv1 = require('uuid/v1');
const { generateTokens } = require('../../classes/auth')
const { User } = require('../../models')
const logger = require('../../classes/logger')
const Response = require('../../classes/response')
const { passwordlessLoginMessage } = require('../../classes/mailer')

const router = new Router()

router.post('/:email', async (ctx, next) => {
  const email = ctx.params.email
  const list = await User.findAll({
    where: {
      email: email
    }
  })
  const user = list[0]
  if (!user) {
    return Response.error(ctx, 'Неправильный адрес электронной почты', 404)
  } else {
    try {
      passwordlessLoginMessage(user.dataValues)
      logger.error('user #%d requested link to login', user.id)
      return Response.message(ctx, `Сейчас на Ваш адрес "${user.email}"` +
        ` придет письмо со ссылкой для входа. Если письмо не придет в течении 10 минут, проверьте папку "Спам"`)
    } catch (e) {
      logger.error(e)
      return Response.error(ctx, e.message)
    }
  }
})

module.exports = router
/*
module.exports = (path, parent) => {
  parent.use(path, router.routes(), router.allowedMethods())
}
*/
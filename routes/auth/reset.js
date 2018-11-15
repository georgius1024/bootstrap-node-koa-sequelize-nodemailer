/**
 * Created by georgius on 18.07.2018.
 */

const Router = require('koa-router')
const { User } = require('../../models')
const logger = require('../../classes/logger')
const Response = require('../../classes/response')
const { passwordResetMessage } = require('../../classes/mailer')

const router = new Router()

router.post('/:email', async (ctx, next) => {
  const email = ctx.params.email
  const user = await User.findOne({
    where: {
      email: email
    }
  })
  if (!user) {
    return Response.error(ctx, 'Неправильный адрес электронной почты', 404)
  } else {
    try {
      user.status = 'reset'
      await user.save()
      await passwordResetMessage(user.dataValues)
      logger.error('user #%d forgot password', user.id)
      return Response.message(ctx, `Сейчас на Ваш адрес "${user.email}"` +
        ` придет письмо со ссылкой и инструкциями для смены пароля. Если письмо не придет в течении 10 минут, проверьте папку "Спам"`)
    } catch (e) {
      logger.error(e)
      return Response.error(ctx, e.message)
    }
  }
})

module.exports = router

/**
 * Created by georgius on 18.07.2018.
 */

const Router = require('koa-router')
const _ = require('lodash')
const uuidv1 = require('uuid/v1');
const logger = require('../../classes/logger')
const Response = require('../../classes/response')
const { User } = require('../../models')
const { welcomeMessage } = require('../../classes/mailer')

const router = new Router()

router.post('/', async (ctx, next) => {
  const registration = _.pick(ctx.request.body, ['name', 'email', 'password', 'password_retype'])
  try {
    /*
    if (registration.email) {
      await User.destroy({
        where: {
          email: registration.email
        },
        force: true
      })
    }
    */
    if (registration.password !== registration.password_retype) {
      return Response.customValidation(ctx, 'password_retype', 'Пароль не совпал')
    }
    registration.status = 'new'
    registration.role = 'user'
    registration.verification_code = uuidv1()

    await User
      .build(registration)
      .save()
    logger.info('registration', registration)
    // Уведомление
    await welcomeMessage(registration)
    return Response.message(ctx, `Сейчас на Ваш адрес "${registration.email}"` +
      ` придет письмо со ссылкой для активации. Если письмо не придет в течении 10 минут, проверьте папку "Спам"`)
  } catch (error) {
    console.error(error)
    return Response.validation(ctx, error)
  }
})

module.exports = router
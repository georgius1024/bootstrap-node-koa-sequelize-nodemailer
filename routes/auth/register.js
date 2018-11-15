/**
 * Created by georgius on 18.07.2018.
 */

const Router = require('koa-router')
const _pick = require('lodash.pick')
const uuidv1 = require('uuid/v1');
const logger = require('../../classes/logger')
const Response = require('../../classes/response')
const { User } = require('../../models')
const { welcomeMessage } = require('../../classes/mailer')

const router = new Router()

router.post('/', async (ctx, next) => {
  const registration = _pick(ctx.request.body, ['name', 'email', 'password', 'password_retype'])
  try {
    if (!registration.password) {
      return Response.customValidation(ctx, 'password_retype', 'Пароль пустой')
    }

    if (registration.password !== registration.password_retype) {
      return Response.validation(ctx,
        [{
          error: 'Пароль не совпал',
          field: 'password_retype'
        }],
        'Пароль не совпал')
    }
    if (!registration.password) {
      return Response.validation(ctx,
        [{
          error: 'Пароль пустой',
          field: 'password'
        }],
        'Пароль пустой')
    }
    if (!registration.email) {
      return Response.validation(ctx,
        [{
          error: 'Email пустой',
          field: 'email'
        }],
        'Email пустой')
    }
    if (!registration.name) {
      return Response.validation(ctx,
        [{
          error: 'Имя пустое',
          field: 'name'
        }],
        'Имя пустое')
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
/**
 * Created by georgius on 18.07.2018.
 */

const Router = require('koa-router')
const _ = require('lodash')
const uuidv1 = require('uuid/v1');
const { User } = require('../../models')
const { generateTokens, deleteTokens, publicProfile } = require('../../classes/auth')
const logger = require('../../classes/logger')
const Response = require('../../classes/response')
const { passwordResetMessage } = require('../../classes/mailer')

const router = new Router()

// password
// password_retype
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
      user.status = 'reset'
      await user.save()
      passwordResetMessage(user.dataValues)
      logger.error('user #%d forgot password', user.id)
      return Response.message(ctx, `Сейчас на Ваш адрес "${user.email}"` +
        ` придет письмо со ссылкой и инструкциями для смены пароля. Если письмо не придет в течении 10 минут, проверьте папку "Спам"`)
    } catch (e) {
      logger.error(e)
      return Response.error(ctx, e.message)
    }
  }
})

router.put('/:code', async (ctx, next) => {
  const pass = ctx.request.body.password
  const retype = ctx.request.body.password_retype
  if (pass !== retype) {
    return Response.validation(ctx,
      [{
        error: 'Пароль не совпал',
        field: 'password_retype'
      }],
      'Пароль не совпал')
  }
  if (!pass) {
    return Response.validation(ctx,
      [{
        error: 'Пароль пустой',
        field: 'password'
      }],
      'Пароль пустой')
  }

  const verificationCode = ctx.params.code
  const list = await User.findAll({
    where: {
      verification_code: verificationCode
    }
  })
  const user = list[0]
  if (!user) {
    return Response.error(ctx, 'Неправильный код. Вероятно, эта одноразовая ссылка уже была использована', 404)
  } else {
    console.log(pass)
    try {
      user.status = 'active'
      user.verification_code = uuidv1()
      user.password = pass
      await user.save()
      deleteTokens(user.id)
      const userData = publicProfile(user)
      logger.error('user #%d reset password', user.id)
      const auth = await generateTokens(userData)
      return Response.authorized(ctx, userData, auth, 'Мы ждали Вас, ' + user.name)
    } catch (e) {
      logger.error(e)
      return Response.error(ctx, e.message)
    }
  }
})

module.exports = router

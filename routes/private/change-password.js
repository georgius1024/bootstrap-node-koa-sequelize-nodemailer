/**
 * Created by georgius on 18.07.2018.
 */

const Router = require('koa-router')
const bcrypt = require('bcrypt')
const _get = require('lodash.get')
const { User } = require('../../models')
const { deleteTokens } = require('../../classes/auth')
const logger = require('../../classes/logger')
const Response = require('../../classes/response')

const router = new Router()
// old_password
// password
// password_retype
router.post('/', async (ctx, next) => {
  const userId = _get(ctx, 'state.token.user.id', 0)
  const user = await User.findByPk(userId)
  if (!user) {
    return Response.unauthorized(ctx)
  } else {
    // Проверка старого пароля
    const old = ctx.request.body.old_password
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
    if (!old) {
      return Response.validation(ctx,
        [{
          error: 'Старый пароль пустой',
          field: 'old_password'
        }],
        'Старый пароль пустой')
    }
    const valid = await bcrypt.compare(old, user.password)
    if (!valid) {
      return Response.validation(ctx, [{
          error: 'Неправильный пароль',
          field: 'old_password'
        }],
        'Старый пароль введен неправильно', 422)
    }

    user.status = 'active'
    user.password = pass
    await user.save()
    deleteTokens(user.id)
    logger.error('user #%d changed password', userId)
    return Response.message(ctx, 'Пароль изменен')
  }
})

module.exports = router

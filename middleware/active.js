/**
 * Created by georgius on 20.07.18.
 */
const Response = require('../classes/response')

module.exports = async (ctx, next) => {
  const token = ctx.state['token']
  if (token && token.user && token.user.status === 'active') {
    await next()
  } else {
    return Response.error(ctx, 'Аккаунт не активирован', 400)
  }
}
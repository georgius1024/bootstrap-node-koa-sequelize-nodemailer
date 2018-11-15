/**
 * Created by georgius on 20.07.18.
 */
const jwt = require('koa-jwt')
module.exports = jwt({
  secret: process.env.TOKEN_KEY || 'secret-key-2048',
  debug: process.env.MODE === 'development',
  key: 'token'
})

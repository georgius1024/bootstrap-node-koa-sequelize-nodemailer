/**
 * Created by georgius on 18.07.2018.
 */
require('dotenv').config()
const Koa = require('koa')
const app = new Koa()
const serve = require('koa-static')
const cors = require('@koa/cors')
const koaBody = require('koa-body')
const compress = require('koa-compress')
const passport = require('koa-passport')
const logger = require('./classes/logger')

// Bootstrap application
const routes = require('./routes')

// Error catcher
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500
    ctx.body = {
      'status': 'error',
      'message': err.message
    }
    ctx.app.emit('error', err, ctx)
  }
});

app.on('error', (err) => {
  logger.error(err)
})

// Global middleware
app.use(koaBody({ multipart: true }))
app.use(cors())
app.use(compress())
app.use(passport.initialize())

// Controllers
app.use(routes)

// Static
app.use(serve('public'))

// 404 handler
app.use(async ctx => {
  ctx.throw(404, 'Route not found for ' +  ctx.method + ' ' + ctx.href)
});

const port = process.env.APP_LISTEN_PORT || 3000
const server = app.listen(port);
logger.info('Listening port ' + port)
module.exports = server
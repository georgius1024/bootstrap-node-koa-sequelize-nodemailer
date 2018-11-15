/**
 * Created by georgius on 18.07.2018.
 */
require('dotenv').config()
const Koa = require('koa')
const app = new Koa()
const logger = require('./classes/logger')
const bodyParser = require('koa-bodyparser')
const passport = require('koa-passport')
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
  console.error(err)
  logger.error(err)
})

app.use(bodyParser())
app.use(passport.initialize())

app.use(routes)


// 404 handler
app.use(async ctx => {
  ctx.throw(404, 'Route not found for ' +  ctx.method + ' ' + ctx.href)
});

const port = process.env.PORT || 3000
app.listen(port);
logger.info('Listening port ' + port)

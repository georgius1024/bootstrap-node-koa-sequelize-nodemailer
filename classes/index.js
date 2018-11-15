/**
 * Created by georgius on 23.07.18.
 */
const fs = require('fs')
const path = require('path')
const basename = path.basename(__filename)

module.exports = (path, app) => {

  var parent = new Router()
  require('./controllers/login')('/auth', auth)
  require('./controllers/refresh')('/auth', auth)
  app.use(auth.routes())

  const controllers = fs
    .readdirSync(__dirname)
    .filter(file => {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
    })
    .map(file => {
      return require((path.join(__dirname, file)))
    })

  controllers.forEach(c => {
    parent.use(path, c.routes(), c.allowedMethods())
  })
}

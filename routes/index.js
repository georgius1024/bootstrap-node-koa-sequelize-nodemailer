/**
 * Created by georgius on 23.07.18.
 */

const Router = require('koa-router')

const root = new Router()

const AuthGuard = require('../middleware/auth')
const AdminGuard = require('../middleware/admin')


// Auth
const auth = new Router()
useFile(auth, '/once', './auth/once')
useFile(auth, '/login', './auth/login')
useFile(auth, '/refresh', './auth/refresh')
useFile(auth, '/register', './auth/register')
useFile(auth, '/passwordless', './auth/passwordless')
useFile(auth, '/reset', './auth/reset')
root.use('/auth', auth.routes())

// Profile
const profile = new Router()
profile.use(AuthGuard)
useFile(profile, '/profile', './private/profile')
useFile(profile, '/change-password', './private/change-password')
useFile(profile, '/logout', './private/logout')
root.use('/private', profile.routes())

// Api
const api = new Router()
api.use(AuthGuard)
api.use(AdminGuard)
useFile(api, '/users', './api/users')
root.use('/api', api.routes())


/*
// Demo
const apiDemo = new Router()
useFile(apiDemo, '/users', './api/users')
root.use('/api-demo', apiDemo.routes())
*/

module.exports = root.routes()

function useFile(parent, path, fileName) {
  const router = require(fileName)
  parent.use(path, router.routes(), router.allowedMethods())
}
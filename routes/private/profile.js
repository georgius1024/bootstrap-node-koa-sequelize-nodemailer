/**
 * Created by georgius on 18.07.2018.
 */
"use strict"
const Router = require('koa-router')
const _get = require('lodash.get')
const { User } = require('../../models')
const { publicProfile } = require('../../classes/auth')
const logger = require('../../classes/logger')
const Response = require('../../classes/response')
const path = require('path')
const fs = require('fs')
const router = new Router()

router.get('/', async (ctx, next) => {
  const userId = _get(ctx, 'state.token.user.id', 0)
  const user = await User.findByPk(userId)
  if (user) {
    const userData = publicProfile(user)
    return Response.generic(ctx, userData)
  } else {
    return Response.unauthorized(ctx)
  }
})
function moveUploadedFile(src, type, dest, name) {
  function getExt(type) {
    switch(type) {
      case 'image/jpeg':
        return 'jpg'
      case 'image/gif':
        return 'gif'
      case 'image/png':
        return 'png'
      case 'image/svg':
        return 'svg'
      case 'image/webp':
        return 'webp'
    }
  }
  let fileName = String(name).toLowerCase()
  const ext = getExt(type)
  if (ext) {
    fileName += '.' + ext
  } else {
    fs.unlinkSync(src)
    return
  }
  const destFile = path.join(dest, fileName)
  const reader = fs.createReadStream(src)
  const writer = fs.createWriteStream(destFile)
  reader.pipe(writer)
  reader.on('end', () => fs.unlinkSync(src))
  return fileName
}
router.post('/', async (ctx, next) => {
  const userId = _get(ctx, 'state.token.user.id', 0)
  const user = await User.findByPk(userId)
  if (user) {
    user.name = ctx.request.body.name || user.name
    user.email = ctx.request.body.email || user.email
    user.about = ctx.request.body.about || user.about
    // TODO тестировать загрузку аватарок
    if (ctx.request.files && ctx.request.files.avatar && ctx.request.files.avatar.name && ctx.request.files.avatar.size) {
      // Убрать старый аватар
      if (user.avatar) {
        const avatarFile = path.join('./public/uploads/avatars/', user.avatar)
        if (fs.existsSync(avatarFile)) {
          fs.unlinkSync(avatarFile)
        }
      }
      // Создать новый аватар
      user.avatar = moveUploadedFile(ctx.request.files.avatar.path, ctx.request.files.avatar.type, './public/uploads/avatars/', user.id)
    }
    await user.save()
    const userData = publicProfile(user)
    logger.debug('user #%d updated profile', user.id)
    return Response.generic(ctx, userData)
  } else {
    return Response.unauthorized(ctx)
  }
})

module.exports = router

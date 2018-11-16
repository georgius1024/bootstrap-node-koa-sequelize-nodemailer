/**
 * Created by georgius on 15.11.18.
 */
'use strict'
const chai = require('chai')
let chaiHttp = require('chai-http')
const bcrypt = require('bcrypt')
const uuidv1 = require('uuid/v1')
const { deleteTokens } = require('../classes/auth')
const { User } = require('../models')
const server = require('../index.js')

chai.use(chaiHttp)
const assert = chai.assert

const fakeEmail = 'fff848585858@5959689.com'
const fakePassword = 'fff848585858'
const fakeUser = 'User-fff848585858'
const fakeVerificationCode = uuidv1()
const newFakePassword = 'fff848585858'.split('').reverse().join('')

describe('change password', async () => {
  let requester, user, accessToken, refreshToken
  const old_password = fakePassword, password = newFakePassword, password_retype = newFakePassword

  before(async () => {
    requester = chai.request(server).keepOpen()
    const existing = await User.findOne({
      where: {
        email: fakeEmail
      }
    })
    if (existing) {
      existing.destroy({force: true})
    }

    // Создаем пользователя для проверки входа
    const registration = {
      name: fakeUser,
      email: fakeEmail,
      password: fakePassword,
      role: 'user',
      status: 'active',
      verification_code: fakeVerificationCode
    }
    user = await User
    .build(registration)
    .save()

    // Login user
    const response = await requester
    .post('/auth/login')
    .type('form')
    .send({
      email: fakeEmail,
      password: fakePassword
    })
    assert.equal(response.status, 200)
    accessToken = response.body.auth.accessToken
    refreshToken = response.body.auth.refreshToken
  })
  it('User can not change password without old', async () => {
    const response = await requester
    .post('/private/change-password')
    .type('form')
    .send({
      password,
      password_retype,
    })
    .set('Authorization', 'Bearer ' + accessToken)

    assert.equal(response.status, 422)
    assert.isObject(response.body)
    assert.equal(response.body.status, 'error')
    assert.equal(response.body.message, 'Старый пароль пустой')

  })

  it('User can not change password with wrong old', async () => {
    const response = await requester
    .post('/private/change-password')
    .type('form')
    .send({
      old_password: 'wrong',
      password,
      password_retype,
    })
    .set('Authorization', 'Bearer ' + accessToken)

    assert.equal(response.status, 422)
    assert.isObject(response.body)
    assert.equal(response.body.status, 'error')
    assert.equal(response.body.message, 'Старый пароль введен неправильно')

  })

  it('User can not change password without new', async () => {
    const response = await requester
    .post('/private/change-password')
    .type('form')
    .send({
      old_password
    })
    .set('Authorization', 'Bearer ' + accessToken)

    assert.equal(response.status, 422)
    assert.isObject(response.body)
    assert.equal(response.body.status, 'error')
    assert.equal(response.body.message, 'Пароль пустой')

  })

  it('User can not change password with wrong retype', async () => {
    const response = await requester
    .post('/private/change-password')
    .type('form')
    .send({
      old_password,
      password,
      password_retype: 'wrong',
    })
    .set('Authorization', 'Bearer ' + accessToken)

    assert.equal(response.status, 422)
    assert.isObject(response.body)
    assert.equal(response.body.status, 'error')
    assert.equal(response.body.message, 'Пароль не совпал')

  })

  it('User can change password with old, new and retype', async () => {
    const response = await requester
    .post('/private/change-password')
    .type('form')
    .send({
      old_password,
      password,
      password_retype,
    })
    .set('Authorization', 'Bearer ' + accessToken)

    assert.equal(response.status, 200)
    assert.isObject(response.body)
    assert.equal(response.body.status, 'success')
    assert.equal(response.body.message, 'Пароль изменен')
    const updated = await User.findByPk(user.id)
    const valid = await bcrypt.compare(newFakePassword, updated.password)
    assert.isOk(valid)



  })

  it('User can change password without old password when in reset state', async () => {
    user.status = 'reset'
    await user.save()
    const response = await requester
    .post('/private/change-password')
    .type('form')
    .send({
      password,
      password_retype,
    })
    .set('Authorization', 'Bearer ' + accessToken)

    assert.equal(response.status, 200)
    assert.isObject(response.body)
    assert.equal(response.body.status, 'success')
    assert.equal(response.body.message, 'Пароль изменен')
    const updated = await User.findByPk(user.id)
    const valid = await bcrypt.compare(newFakePassword, updated.password)
    assert.isOk(valid)
  })



  after(async () => {
    requester.close()
    if (user) {
      deleteTokens(user.id)
      user.destroy({force: true})
    }
  })

})


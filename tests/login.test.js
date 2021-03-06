/**
 * Created by georgius on 11.08.18.
 */
'use strict'
const chai = require('chai')
let chaiHttp = require('chai-http')
const bcrypt = require('bcrypt')
const uuidv1 = require('uuid/v1')

const { User, Token } = require('../models')
const { deleteTokens } = require('../classes/auth')
const server = require('../index.js')


chai.use(chaiHttp)
const assert = chai.assert

const fakeEmail = 'fff848585858@5959689.com'
const fakePassword = 'fff848585858'
const fakeUser = 'User-fff848585858'
const fakeVerificationCode = uuidv1()

describe('login', async () => {
  let requester, user
  before(async () => {
    requester = chai.request(server).keepOpen()
    const existing = await User.findOne({
      where: {
        email: fakeEmail
      }
    })
    if (existing) {
      existing.destroy({ force: true })
    }

    // Создаем пользователя для проверки входа
    const registration = {
      name: fakeUser,
      email: fakeEmail,
      password: fakePassword,
      role: 'user',
      status: 'new',
      verification_code: fakeVerificationCode
    }
    user = await User
    .build(registration)
    .save()
  })
  it('Can not login traditional way with wrong login', async () => {
    const response = await requester
    .post('/auth/login')
    .type('form')
    .send({
      email: 'wrong-email'
    })
    assert.equal(response.status, 404)
  })
  it('Can not login traditional way with wrong password', async () => {
    const response = await requester
    .post('/auth/login')
    .type('form')
    .send({
      email: fakeEmail,
      password: 'wrong'
    })
    assert.equal(response.status, 404)
  })

  it('Can not login traditional when status is new', async () => {
    user.status = 'new'
    await user.save()
    const response = await requester
    .post('/auth/login')
    .type('form')
    .send({
      email: fakeEmail,
      password: fakePassword
    })
    assert.equal(response.status, 500)
  })

  it('Can login traditional way with correct login and password', async () => {
    user.status = 'active'
    await user.save()
    const response = await requester
    .post('/auth/login')
    .type('form')
    .send({
      email: fakeEmail,
      password: fakePassword
    })
    assert.equal(response.status, 200)
    assert.isObject(response.body)
    assert.equal(response.body.status, 'success')
    assert.include(response.body.message, fakeUser)
    assert.equal(response.body.data.id, user.id)
    assert.isObject(response.body.auth)
    assert.isOk(response.body.auth.accessToken)
    assert.isOk(response.body.auth.refreshToken)
    // Проверка на создание токена
    const token = await Token.findOne({
      where: {
        token: response.body.auth.refreshToken
      },
      raw: true
    })
    assert.equal(token.user_id, user.id)
  })

  after(async () => {
    requester.close()
    if (user) {
      deleteTokens(user.id)
      user.destroy({ force: true })
    }
  })

})


/**
 * Created by georgius on 15.11.18.
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
const wrongToken = 'wrong-token'

describe('refresh', async () => {
  let requester, user, accessToken, refreshToken
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

  it('Can not refresh with invalid token', async () => {
    const response = await requester
    .post('/auth/refresh')
    .type('form')
    .send({
      token: wrongToken
    })
    assert.equal(response.status, 401)
    assert.equal(response.body.message, 'Невозможно обновить токен, перелогиньтесь, пожалуйста')
  })

  it('Can not refresh with invalid user', async () => {
    const wrongUser = 2e9
    await deleteTokens(wrongUser)
    await Token.create({
      user_id: wrongUser,
      token: wrongToken
    })

    const response = await requester
    .post('/auth/refresh')
    .type('form')
    .send({
      token: 'wrong-token'
    })

    assert.equal(response.status, 401)
    assert.equal(response.body.message, 'Невозможно обновить токен, залогиньтесь, пожалуйста')
    await deleteTokens(wrongUser)

  })

  it('Can refresh with valid token', async () => {
    const response = await requester
    .post('/auth/refresh')
    .type('form')
    .send({
      token: refreshToken
    })

    assert.equal(response.status, 200)
    assert.isObject(response.body)
    assert.isObject(response.body.auth)
    assert.equal(response.body.status, 'success')

    // Новые токены
    assert.notEqual(accessToken, response.body.auth.accessToken)
    assert.notEqual(refreshToken, response.body.auth.refreshToken)

    // Проверка на отсутствие старого токена
    const oldToken = await Token.findOne({
      where: {
        token: refreshToken
      },
      raw: true
    })
    assert.isNotOk(oldToken)
    // Проверка на наличие нового токена
    const newToken = await Token.findOne({
      where: {
        token: response.body.auth.refreshToken
      },
      raw: true
    })
    assert.isOk(newToken)
  })

  after(async () => {
    requester.close()
    if (user) {
      deleteTokens(user.id)
      user.destroy({ force: true })
    }
  })

})


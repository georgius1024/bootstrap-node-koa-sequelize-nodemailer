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

describe('logout', async () => {
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

    // Создаем пользователя
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

  it('Can not logout when not logged in', async () => {
    const response = await requester
    .get('/private/logout')
    assert.equal(response.status, 401)
  })

  it('Can logout when logged in', async () => {
    const response = await requester
    .get('/private/logout')
    .set('Authorization', 'Bearer ' + accessToken)
    assert.equal(response.status, 203)
    assert.isObject(response.body)
    assert.equal(response.body.status, 'success')
    assert.include(response.body.message, fakeUser)

    // Проверка на отсутствие токена
    const token = await Token.findOne({
      where: {
        token: refreshToken
      },
      raw: true
    })
    assert.isNotOk(token)
  })

  after(async () => {
    requester.close()
    if (user) {
      deleteTokens(user.id)
      user.destroy({ force: true })
    }
  })

})


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
const newFakeUser = fakeUser.split('').reverse().join('')

describe('change password', async () => {
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

  it('User can obtain his profile', async () => {
    const response = await requester
    .get('/private/profile')
    .set('Authorization', 'Bearer ' + accessToken)
    assert.equal(response.status, 200)
    assert.isObject(response.body)
    assert.equal(response.body.status, 'success')
    assert.deepEqual(response.body.data, {
      id: user.id,
      name: fakeUser,
      email: fakeEmail,
      role: 'user',
      status: 'active'
    })
  })

  it('User can not obtain other profile', async () => {
    const response = await requester
    .get('/private/profile')
    assert.equal(response.status, 401)
  })


  it('User can update his profile', async () => {
    const response = await requester
    .post('/private/profile')
    .type('form')
    .send({
      email: fakeEmail,
      name: newFakeUser
    })
    .set('Authorization', 'Bearer ' + accessToken)
    assert.equal(response.status, 200)
    assert.isObject(response.body)
    assert.equal(response.body.status, 'success')
    assert.deepEqual(response.body.data, {
      id: user.id,
      name: newFakeUser,
      email: fakeEmail,
      role: 'user',
      status: 'active'
    })
  })

  it('User can not set not unique e-mail', async () => {
    const another = await User.findOne({
      where: {
        status: 'active'
      },
      raw: true
    })
    const response = await requester
    .post('/private/profile')
    .type('form')
    .send({
      email: another.email,
    })
    .set('Authorization', 'Bearer ' + accessToken)
    assert.equal(response.status, 500)
    assert.isObject(response.body)
    assert.equal(response.body.status, 'error')
  })


  after(async () => {
    requester.close()
    if (user) {
      deleteTokens(user.id)
      user.destroy({ force: true })
    }
  })

})


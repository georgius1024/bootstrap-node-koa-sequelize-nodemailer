/**
 * Created by georgius on 15.11.18.
 */
'use strict'
const chai = require('chai')
let chaiHttp = require('chai-http')
const uuidv1 = require('uuid/v1')
const { User } = require('../models')
const { Mailer } = require('../classes/mailer')
const server = require('../index.js')

chai.use(chaiHttp)
const assert = chai.assert

const fakeEmail = 'fff848585858@5959689.com'
const fakePassword = 'fff848585858'
const fakeUser = 'User-fff848585858'
const fakeVerificationCode = uuidv1()

describe('reset', async () => {
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
      status: 'active',
      verification_code: fakeVerificationCode
    }
    user = await User
    .build(registration)
    .save()
  })

  it('Can not request reset link for in valid user', async () => {
    const response = await requester
    .post('/auth/reset/wrong-email')
    assert.equal(response.status, 404)
  })

  it('Can request reset link for valid user', async () => {
    const response = await requester
    .post('/auth/reset/' + fakeEmail)
    assert.equal(response.status, 200)
    assert.isObject(response.body)
    assert.equal(response.body.status, 'success')
    assert.include(response.body.message, fakeEmail)
    assert.isOk(Mailer.lastMessage)
    assert.include(Mailer.lastMessage.html, user.verification_code)

    const updated = await User.findByPk(user.id)
    assert.equal(updated.status, 'reset')

  })

  after(async () => {
    requester.close()
    if (user) {
      user.destroy({ force: true })
    }
  })

})


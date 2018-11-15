/**
 * Created by georgius on 11.08.18.
 */
'use strict'
const chai = require('chai')
let chaiHttp = require('chai-http')
const bcrypt = require('bcrypt')

const { User } = require('../models')
const { Mailer } = require('../classes/mailer')

const server = require('../index.js')

chai.use(chaiHttp)
const assert = chai.assert

const fakeEmail = 'fff848585858@5959689.com'
const fakePassword = 'fff848585858'
const fakeUser = 'User-fff848585858'

describe('registration', async () => {
  let requester
  const email = fakeEmail, password = fakePassword, password_retype = fakePassword, name = fakeUser
  before(async () => {
    requester = chai.request(server).keepOpen()

    // Clear previously created fake user if it exists
    const user = await User.findOne({
      where: {
        email: fakeEmail
      }
    })
    if (user) {
      user.destroy({ force: true })
    }
  })
  it ('Can not register user without name', async () => {
    const response = await requester
    .post('/auth/register')
    .type('form')
    .send({
      email,
      password,
      password_retype,
    })
    assert.equal(response.status, 422)
  })
  it ('Can not register user without password', async () => {
    const response = await requester
    .post('/auth/register')
    .type('form')
    .send({
      email,
      password_retype,
      name
    })
    assert.equal(response.status, 422)
  })
  it ('Can not register user without email', async () => {
    const response = await requester
    .post('/auth/register')
    .type('form')
    .send({
      password,
      password_retype,
      name
    })
    assert.equal(response.status, 422)
  })

  it ('Can not register user without retype', async () => {
    const response = await requester
    .post('/auth/register')
    .type('form')
    .send({
      email,
      password,
      name
    })
    assert.equal(response.status, 422)
  })

  it('Can register new user', async () => {
    const response = await requester
    .post('/auth/register')
    .type('form')
    .send({
      email,
      password,
      password_retype,
      name,
    })

    assert.equal(response.status, 200)
    assert.isObject(response.body)
    assert.equal(response.body.status, 'success')
    assert.include(response.body.message, fakeEmail)

    const user = await User.findOne({
      where: {
        email: fakeEmail
      },
      raw: true
    })

    assert.isOk(user)
    assert.equal(user.name, fakeUser)
    assert.equal(user.email, fakeEmail)
    assert.equal(user.email, fakeEmail)
    const valid = await bcrypt.compare(fakePassword, user.password)
    assert.isOk(valid)
    assert.equal(user.role, 'user')
    assert.equal(user.status, 'new')
    assert.isOk(user.verification_code)

    assert.isOk(Mailer.lastMessage)
    assert.include(Mailer.lastMessage.html, user.verification_code)
  })

  after(async () => {
    requester.close()

    // Clear previously created fake user if it exists
    const user = await User.findOne({
      where: {
        email: fakeEmail
      }
    })
    if (user) {
      user.destroy({ force: true })
    }
  })

})


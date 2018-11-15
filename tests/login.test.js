/**
 * Created by georgius on 11.08.18.
 */
'use strict'
const chai = require('chai')
let chaiHttp = require('chai-http')
chai.use(chaiHttp)
// const app = require('../index.js')
const app = 'http://localhost:3800'
const requester = chai.request(app).keepOpen()

const assert = chai.assert
const should = chai.should()

const uuidv1 = require('uuid/v1')

const { User, Token } = require('../models')
const fakeEmail = 'fff848585858@5959689.com'
const fakePassword = 'fff848585858'
const fakeVerification = uuidv1()

let accessToken, refreshToken
describe('Login', () => {

  let user
  it('Can create new user', async () => {
    // Clear previously created fake user if it exists
    user = await User.findOne({
      where: {
        email: fakeEmail
      }
    })
    if (user) {
      user.destroy({ force: true })
    }
    const registration = {
      name: 'fake-user',
      email: fakeEmail,
      password: fakePassword,
      role: 'user',
      status: 'new',
      verification_code: fakeVerification
    }
    user = await User
      .build(registration)
      .save()
    assert.isOk(user)
  })
  /*
  it('Traditional login', async function() {
    const login = await requester
      .post('/auth/login')
      .type('form')
      .send({
        email: fakeEmail,
        password: fakePassword
      })
    login.should.have.status(200)
    login.body.status.should.be.eql('success')
    login.body.data.should.be.a('object')
    assert.isOk(login.body.data)
    login.body.data.id.should.be.eql(1)
  })
  */
  it('Can not login while is inactive', async () => {
    const response = await requester
      .post('/auth/login')
      .type('form')
      .send({
        email: fakeEmail,
        password: fakePassword
      })
    console.log('--------------------', response.status)
    response.should.have.status(500)
    response.body.status.should.be.eql('error')
  })

  it('Passwordless login', async () => {
    user = await User.findOne({
      where: {
        email: fakeEmail
      }
    })
    assert.isOk(user)

    const login = await requester.get('/auth/once/' + fakeVerification)
    login.should.have.status(200)
    login.body.status.should.be.eql('success')
    login.body.data.should.be.a('object')
    assert.isOk(login.body.data)
    login.body.data.id.should.be.eql(user.id)

    user = await User.findById(user.id)
    assert.isOk(user)

    assert.equal(user.status, 'active')
    assert.notEqual(user.verification_code, fakeVerification)

  })


  it('Can login while is activated', async () => {
    user = await User.findOne({
      where: {
        email: fakeEmail
      }
    })
    assert.isOk(user)

    const login = await requester
      .post('/auth/login')
      .type('form')
      .send({
        email: fakeEmail,
        password: fakePassword
      })
    login.should.have.status(200)
    login.body.status.should.be.eql('success')
    login.body.data.should.be.a('object')
    assert.isOk(login.body.data)
    login.body.data.id.should.be.eql(user.id)
    accessToken = login.body.auth.accessToken
    refreshToken = login.body.auth.refreshToken

  })

  it('Can not login with wrong pasword', async () => {
    user = await User.findOne({
      where: {
        email: fakeEmail
      }
    })
    assert.isOk(user)

    const login = await requester
    .post('/auth/login')
    .type('form')
    .send({
      email: fakeEmail,
      password: ''
    })
    login.should.have.status(404)
    login.body.status.should.be.eql('error')
  })

  it('Access token grants access to restricted area', async () => {

    user = await User.findOne({
      where: {
        email: fakeEmail
      }
    })
    assert.isOk(user)

    const profile = await requester
      .get('/private/profile')
      .set('Authorization', 'Bearer ' + accessToken)
    profile.should.have.status(200)
    profile.body.status.should.be.eql('success')
    profile.body.data.should.be.a('object')
    assert.isOk(profile.body.data)
    profile.body.data.id.should.be.eql(user.id)
  })

  it('Wring access token does not grants access to restricted area', async () => {
    const profile = await requester
    .get('/private/profile')
    .set('Authorization', 'Bearer 11111')
    profile.should.have.status(401)
    profile.body.status.should.be.eql('error')
  })

  it('User access token not grant to admin area', async () => {
    user = await User.findOne({
      where: {
        email: fakeEmail
      }
    })
    assert.isOk(user)

    const response = await requester
      .get('/api/users/' + user.id)
      .set('Authorization', 'Bearer ' + accessToken)
    response.should.have.status(403)
    assert.isOk(response.body.message)
    response.body.status.should.be.eql('error')
  })
  it('User can refresh tokens', async () => {
    const token = await Token.findOne({
      where: {
        token: refreshToken
      }
    })
    assert.isOk(token)
    user = await User.findOne({
      where: {
        email: fakeEmail
      }
    })
    assert.isOk(user)

    assert.equal(user.id, token.user_id)

    const response = await requester
      .post('/auth/refresh')
      .type('form')
      .send({
        token: refreshToken
      })
    // console.log(response.body)
    assert.isOk(response.body.data)
    response.should.have.status(200)
    response.body.status.should.be.eql('success')
    response.body.data.should.be.a('object')
    response.body.data.id.should.be.eql(user.id)

    const oldToken = await Token.findOne({
      where: {
        token: refreshToken
      }
    })
    assert.isNotOk(oldToken)

    accessToken = response.body.auth.accessToken
    refreshToken = response.body.auth.refreshToken

    const newToken = await Token.findOne({
      where: {
        token: refreshToken
      }
    })
    assert.isOk(newToken)

  })
  it ('User can logout', async () => {
    const profile = await requester
      .get('/private/logout')
      .set('Authorization', 'Bearer ' + accessToken)
    profile.should.have.status(401)
    profile.body.status.should.be.eql('error')
    // assert.isOk(profile.body.message)

    const newToken = await Token.findOne({
      where: {
        token: refreshToken
      }
    })
    assert.isNotOk(newToken)
  })
  it ('User model rehashes changed password ',async () => {
    user = await User.findOne({
      where: {
        email: fakeEmail
      }
    })
    assert.isOk(user)

    const bcrypt = require('bcrypt');
    const fake = 'fake-password11'
    user.password = fake
    assert.equal(user.password, fake)
    await user.save()
    user = await User.findOne({
      where: {
        email: fakeEmail
      }
    })
    assert.isOk(user)

    assert.notEqual(user.password, fake)
    const valid = await bcrypt.compare(fake, user.password)
    assert.isOk(valid)

  })
  requester.close()
})

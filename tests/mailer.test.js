/**
 * Created by georgius on 11.08.18.
 */
'use strict'
const chai = require('chai')
const { User } = require('../models')
const {
  Mailer,
  welcomeMessage,
  passwordlessLoginMessage,
  passwordResetMessage
} = require('../classes/mailer')

const assert = chai.assert
chai.should()

describe('Mailer class', async function () {
  this.slow(200)

  let user

  before(async () => {
    user = await User.findOne({
      where: {
        status: 'active'
      }
    })
  })

  it('can send welcome message', async () => {
    Mailer.lastMessage = null
    await welcomeMessage(user.dataValues)
    assert.isOk(Mailer.lastMessage)
  })
  it('can send login message', async () => {
    Mailer.lastMessage = null
    await passwordlessLoginMessage(user.dataValues)
    assert.isOk(Mailer.lastMessage)
  })
  it('can send reset message', async () => {
    Mailer.lastMessage = null
    await passwordResetMessage(user.dataValues)
    assert.isOk(Mailer.lastMessage)
  })

})

/**
 * Created by georgius on 11.08.18.
 */
"use strict"
const assert = require('chai').assert
const {
  User,
  Token
} = require('../models')

describe('Models working', async () => {
  it('user model', async function() {
    const user = await User.findOne()
    assert.isOk(user)
  })
  it('token model', async function() {
    const tokens = await Token.findAll()
    assert.isOk(tokens)
  })
})

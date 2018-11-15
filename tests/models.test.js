/**
 * Created by georgius on 11.08.18.
 */
const assert = require('chai').assert
const { User, Token } = require('../models')
it('Models working', async function() {
  const user = await User.findOne()
  assert.isOk(user)
  const tokens = await Token.findAll()
  assert.isOk(tokens)
})
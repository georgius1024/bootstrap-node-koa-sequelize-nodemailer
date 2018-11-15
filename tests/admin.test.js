'use strict'
require('chai').should()
const admin = require('../middleware/admin')
describe('admin middleware', async () => {
  it('Allow admin access', async () => {
    const ctx = {
      state: {
        token: {
          user: {
            role: 'admin'
          }
        }
      }
    }
    let calls = 0
    const x = await admin(ctx, () => {
      calls += 1
    }) || 'bbb'
    x.should.be.equal('bbb')
    calls.should.be.equal(1)
  })
  it('Disallow not-admin access', async () => {
    const ctx = {
      state: {
        token: {
          user: {
            role: 'user'
          }
        }
      }
    }
    let calls = 0
    const x = await admin(ctx, () => {
      calls += 1
    }) || 'bbb'
    x.should.be.equal('bbb')
    calls.should.be.equal(0)
    ctx.status.should.be.equal(403)
  })
})
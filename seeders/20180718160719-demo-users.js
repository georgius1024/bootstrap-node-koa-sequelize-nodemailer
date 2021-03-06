'use strict';
const faker = require('faker')
const bcrypt = require('bcrypt')
const uuidv1 = require('uuid/v1');

const userPassword = '123'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = []
    users.push({
      name: 'Administrator',
      email: 'user@host.com',
      password: await bcrypt.hash(userPassword, 10),
      role: 'admin',
      status: 'active',
      verification_code: uuidv1(),
      created_at: faker.date.past(),
      updated_at: faker.date.recent()
    })
    for(let i = 0; i < 100; i++) {
      users.push({
        name: faker.name.findName(),
        email: faker.internet.email(),
        password: await bcrypt.hash(userPassword, 10),
        role: 'user',
        status: 'active',
        verification_code: uuidv1(),
        created_at: faker.date.past(),
        updated_at: faker.date.recent()
      })
    }
    return queryInterface.bulkInsert('users', users)
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users', null, {});
  }
};

'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'users',
      'about',
      {
        type: Sequelize.TEXT,
        after: 'verification_code'
      }

    )
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'users',
      'about'
    )
  }
};

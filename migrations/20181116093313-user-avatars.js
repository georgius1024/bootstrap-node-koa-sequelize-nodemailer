'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'users',
      'avatar',
      {
        type: Sequelize.TEXT,
        after: 'about'
      }

    )
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'users',
      'avatar'
    )
  }
};

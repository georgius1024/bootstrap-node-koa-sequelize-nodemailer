'use strict';
module.exports = (sequelize, DataTypes) => {
  var Token = sequelize.define('Token', {
    user_id: DataTypes.INTEGER,
    token: DataTypes.STRING
  }, {
    tableName: 'tokens',
    underscored: true,
  });
  Token.associate = function(models) {
    Token.belongsTo(models.User)
  };
  return Token;
};
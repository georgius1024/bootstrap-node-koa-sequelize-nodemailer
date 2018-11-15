'use strict';
const bcrypt = require('bcrypt');

const hashPasswordHook = async (instance, options) => {
  if (instance.changed('password')) {
    instance.set('password', await bcrypt.hash(instance.get('password'), 10))
  }
};

module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define('User', {
    name: {
      type:  DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
      validate: {
        notEmpty: {
          msg: "Нет имени"
        }
      }
    },
    email: {
      type:  DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
      unique: {
        msg: 'Этот e-mail уже использован. Если это Ваш e-mail, то вместо новой регистрации попробуйте восстановление пароля',
        fields: ['email']
      },
      validate: {
        notEmpty: {
          msg: 'Нет E-mail'
        },
        isEmail: {
          msg: "Неправильный e-mail"
        }
      }
    },
    password: {
      type:  DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
      validate: {
        len: {
          args: [6, 80],
          msg: 'Нужен пароль длиной от 6 знаков'
        }
      }
    },
    role: {
      type:  DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
      validate: {
        isIn: {
          args: [['admin', 'user', 'disabled']],
          msg: 'Неправильная роль'
        }
      }
    },
    status: {
      type:  DataTypes.STRING,
      defaultValue: 'new',
      allowNull: false,
      validate: {
        isIn: [['new', 'active', 'reset']]
      }
    },
    verification_code: {
      type:  DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    paranoid: true,
    hooks: {
      'beforeCreate': hashPasswordHook,
      'beforeUpdate': hashPasswordHook
    },

  });
  User.associate = function(models) {
    User.hasMany(models.Token)
    // associations can be defined here
  }

  return User;
};
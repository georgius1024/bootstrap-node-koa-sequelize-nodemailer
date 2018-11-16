/**
 * Created by georgius on 19.07.18.
 */
const passport = require('koa-passport')
const bcrypt = require('bcrypt')
const LocalStrategy = require('passport-local').Strategy
const ms = require('ms')
const jwt = require('jsonwebtoken');
const { promisify } = require('es6-promisify');
const uuidv1 = require('uuid/v1');
const _pick = require('lodash.pick')
const {Sequelize, User, Token} = require('../models')

const signAsync = promisify(jwt.sign, jwt);

const accessTokenTtl = ms(process.env.ACCESS_TOKEN_TTL || '1 day')
const refreshTokenTtl = ms(process.env.REFRESH_TOKEN_TTL || '180 days')
const secret = process.env.APP_KEY || 'secret'


const generateTokens = async (user, opts = {}) => {
  try {
    const accessTokenId = uuidv1();
    const refreshTokenId = uuidv1();

    const accessTokenPayload = Object.assign({}, { user }, { jti: accessTokenId });
    const refreshTokenPayload = Object.assign({}, { jti: refreshTokenId });

    const refreshTokenOpts = Object.assign({}, {
      expiresIn: refreshTokenTtl
    }, opts);
    const accessTokenOpts = Object.assign({}, {
      expiresIn: accessTokenTtl
    }, opts);

    const refreshToken = await signAsync(refreshTokenPayload, secret, refreshTokenOpts);
    const accessToken = await signAsync(accessTokenPayload, secret, accessTokenOpts);
    await Token.create({
      user_id: user.id,
      token: refreshToken
    })
    return Promise.resolve({
      accessToken,
      refreshToken
    });

  } catch(e) {
    return Promise.reject(e)
  }
}

const publicProfile = (user) => {
  return _pick(user, ['id', 'name', 'email', 'about', 'role', 'status'])
}

const deleteTokens = async (id) => {
  Token.destroy({
    where: {
      user_id: id
    },
  })
}

const options = {
  usernameField: 'email',
  session: false
}

passport.use(new LocalStrategy(options,
  async (username, password, done) => {
    const user = await User.findOne({
      where: {
        email: username
      }
    })
    if (user) {
      const valid = await bcrypt.compare(password, user.password)
      if (valid) {
        done(null, user.dataValues)
      } else {
        done('Неправильно введен пароль')
      }
    } else {
      done('Неправильно введен email')
    }
  })
)

module.exports = {
  generateTokens,
  deleteTokens,
  publicProfile
}
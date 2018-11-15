/**
 * Created by georgius on 23.07.18.
 */
const Email = require('email-templates')
const nodemailer = require('nodemailer')
const path = require('path')

const smtpConfig = {
  driver: 'smtp',
  pool: true,
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT || 25,
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized:false
  },
  maxConnections: 5,
  maxMessages: 10,
  rateDelta: 1000 * 60,
  rateLimit: 10
}

const Mailer = new Email({
  message: {
    from: process.env.MAIL_USERNAME
  },
  juice: true,
  juiceResources: {
    preserveImportant: true,
    webResources: {
      relativeTo: path.resolve('assets')
    }
  },
  send: process.env.NODE_ENV !== 'test',
  preview: process.env.NODE_ENV === 'development',
  transport: nodemailer.createTransport(smtpConfig)
})

const sendMail = (recipient, template, locals, from = '') => {
  return Mailer
    .send({
      template,
      message: {
        to: recipient,
        from: from || process.env.MAIL_FROM_NAME
      },
      locals
    })
    .then(res => {
      Mailer.lastMessage = res.originalMessage
    })
    .catch(error => {
      throw error
    })

}

function welcomeMessage(recipient) {
  const locals = Object.assign({}, recipient)
  locals.action = {
    url: process.env.FRONTEND_ACTIVATION + '?code=' + locals.verification_code,
    name: 'Завершить регистрацию'
  }
  return sendMail(locals.email, 'welcome', locals)
}

function passwordlessLoginMessage(recipient) {
  const locals = Object.assign({}, recipient)
  locals.action = {
    url: process.env.FRONTEND_ACTIVATION + '?code=' + locals.verification_code,
    name: 'Войти на сайт'
  }
  return sendMail(locals.email, 'passwordless', locals)
}

function passwordResetMessage(recipient) {
  const locals = Object.assign({}, recipient)
  locals.action = {
    url: process.env.FRONTEND_PASSWORD_RESET + '?code=' + locals.verification_code,
    name: 'Сменить пароль'
  }
  return sendMail(locals.email, 'reset', locals)
}

module.exports = {
  Mailer,
  sendMail,
  welcomeMessage,
  passwordlessLoginMessage,
  passwordResetMessage
}

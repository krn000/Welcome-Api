'use strict'
var nodemailer = require('nodemailer')
var smtpTransport = require('nodemailer-smtp-transport')
var emailConfig = require('config').get('email')

var send = async (to, message, transporter, config) => {
    var payload = {
        from: message.from || config.from,
        to: to,
        subject: message.subject,
        html: message.body
    }

    return new Promise((resolve) => {
        transporter.sendMail(payload, function (err) {
            return resolve(!err)
        })
    })
}

var getTransport = function (config) {
    return nodemailer.createTransport(smtpTransport({
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
            user: config.auth.user,
            pass: config.auth.password
        }
    }))
}

var configuredTrasport = getTransport(emailConfig)

var mailer = module.exports

mailer.config = function (config) {
    var transport = getTransport(config || emailConfig)

    return {
        send: async (message, to) => {
            return send(to, message, transport, config || emailConfig)
        }
    }
}

mailer.send = async (message, to) => {
    return send(to, message, configuredTrasport, emailConfig)
}

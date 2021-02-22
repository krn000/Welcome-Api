'use strict'
var nodemailer = require('nodemailer')
var sgTransport = require('nodemailer-sendgrid-transport')
var logger = require('@open-age/logger')('sendgrid')

const userToEmail = user => {
    if (!user.profile) {
        return user.email
    }

    const name = `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim()

    if (!name) {
        return user.email
    }
    return `${name}<${user.email}>`
}

var send = async (to, message, transporter, config) => {
    var log = logger.start('send')
    if (!to) {
        log.error('missing email')
        return Promise.resolve(false)
    }

    // if (emailConfig.disabled) {
    //     log.info('email disabled')
    //     return Promise.resolve(false)
    // }

    var payload = {
        from: userToEmail(message.from),
        to: userToEmail(to),
        subject: message.subject,
        html: message.body
    }

    if (message.attachments.length) {
        payload.attachments = message.attachments
    }

    return new Promise((resolve) => {
        transporter.sendMail(payload, function (err) {
            return resolve(!err)
        })
    })
}

var getTransport = function (config) {
    return nodemailer.createTransport(sgTransport({
        // host: 'smtp.gmail.com',
        // port: 465,
        auth: {
            // user: config.auth.user,
            // pass: config.auth.password
            api_user: config.auth.user,
            api_key: config.auth.pass
        }
    }))
}

exports.config = function (config) {
    var transport = getTransport(config || emailConfig)

    return {
        send: async (message, to) => {
            return send(to, message, transport, config || emailConfig)
        }
    }
}

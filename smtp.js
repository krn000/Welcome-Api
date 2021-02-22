'use strict'
var nodemailer = require('nodemailer')
var smtpTransport = require('nodemailer-smtp-transport')
var emailConfig = require('config').get('email')
var logger = require('@open-age/logger')('smtp')
var async = require('async')
var validator = require('validator')
var uuid = require('uuid')

var queue = async.queue(function (params, callback) {
    var log = logger.start('queueTask')
    log.debug('sending', params.id)

    params.transporter.sendMail(params.payload, function (err) {
        if (err) {
            log.error('error while sending email', {
                id: params.id,
                payload: params.payload,
                error: err
            })
        } else {
            log.info('sent email', params.id)
        }
        setTimeout(function () {
            callback()
        }, 1000)
    })
}, 1)

queue.drain = function () {
    console.log('all items have been processed')
}

var send = function (to, email, transporter, config) {
    var log = logger.start('send')
    if (!to) {
        log.info('no email configured', email)
        return Promise.resolve(false)
    }

    if (!validator.isEmail(to)) {
        log.error('email not sent. Reason - invalid email: ' + to, email)
        return Promise.resolve(false)
    }

    if (emailConfig.disabled) {
        log.info('email disabled', email)
        return Promise.resolve(false)
    }

    var payload = {
        from: email.from || config.from,
        to: to.email || to,
        subject: email.subject,
        html: email.body
    }
    return new Promise((resolve) => {
        transporter.sendMail(payload, function (err) {
            if (err) {
                log.error('error while sending email', {
                    payload: payload,
                    error: err
                })
                resolve(false)
            } else {
                log.debug('sent email')
                resolve(true)
            }
        })
    })
}

var getTransport = function (config) {
    return nodemailer.createTransport(smtpTransport({
        host: config.host,
        port: config.port,
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

mailer.send = function (to, email, cb) {
    send(to, email, configuredTrasport, emailConfig, cb)
}

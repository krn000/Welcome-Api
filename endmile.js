'use strict'
var nodemailer = require('nodemailer')
var emailConfig = require('config').get('email')
var logger = require('@open-age/logger')('endmile')

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

const send = async (message, to, config) => {
    var log = logger.start('send')
    if (!to) {
        log.error('missing email')
        return
    }

    if (emailConfig.disabled) {
        log.info('email disabled')
        return
    }

    var payload = {
        // from: userToEmail(message.from),
        from: 'support@payu.in',
        to: userToEmail(to),
        subject: message.subject,
        html: message.body
    }

    if (message.attachments.length) {
        payload.attachments = message.attachments.map((attachment) => {
            const file = {
                filename: attachment.filename,
                contentType: attachment.contentType || attachment.mimeType
            }

            if (attachment.url) {
                file.path = request(attachment.url)
            } else if (attachment.content && attachment.content.data && attachment.content.data.length) {
                file.content = new Buffer(attachment.content.data)
            }

            return file
        })
    }

    const transporter = nodemailer.createTransport(config)

    return new Promise((resolve) => {
        transporter.sendMail(payload, function (err, info) {
            if (err) {
                log.error('error while sending email', {
                    payload: payload,
                    error: err
                })
                resolve(false)
            } else {
                log.info('sent email - ' + info)
                resolve(true)
            }
        })
    })
}

exports.config = function (config) {
    return {
        send: async (message, to) => {
            return send(message, to, config)
        }
    }
}

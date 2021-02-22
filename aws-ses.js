'use strict'
var nodemailer = require('nodemailer')
var emailConfig = require('config').get('email')
var logger = require('@open-age/logger')('aws-ses')
var request = require('request')

const aws = require('aws-sdk')

const appRoot = require('app-root-path')
const uuid = require('uuid/v1')
const path = require('path')
const fs = require('fs')
const fileStore = require('config').get('file-store')

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

const download = (url, name) => {
    const fileName = `${uuid()}-${name}`

    const dest = path.join(appRoot.path, `${fileStore.dir}/${fileName}`)

    const file = fs.createWriteStream(dest)
    const sendReq = request.get(url)

    return new Promise((resolve, reject) => {
        sendReq.on('response', (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Response status was ${response.statusCode}`))
            }

            sendReq.pipe(file)
        })

        file.on('finish', () => file.close(() => resolve(dest)))

        sendReq.on('error', (err) => {
            fs.unlink(dest)
            return reject(err)
        })

        file.on('error', (err) => {
            fs.unlink(dest)
            return reject(err)
        })
    })
}

const cleanup = (payload) => {
    if (!payload.attachments || !payload.attachments.length) {
        return
    }

    for (const attachment of payload.attachments) {
        if (attachment.path) {
            fs.unlink(attachment.path)
        }
    }
}

const send = async (message, to, config) => {
    var log = logger.start('send')
    if (!to) {
        log.error('missing email')
        return Promise.resolve(false)
    }

    if (emailConfig.disabled) {
        log.info('email disabled')
        return Promise.resolve(false)
    }

    var payload = {
        from: userToEmail(message.from),
        to: userToEmail(to),
        subject: message.subject,
        html: message.body
    }

    if (message.attachments.length) {
        payload.attachments = []

        for (const attachment of message.attachments) {
            const file = {
                filename: attachment.filename,
                contentType: attachment.contentType || attachment.mimeType
            }

            if (attachment.url) {
                file.path = await download(attachment.url, attachment.filename)
            } else if (attachment.content && attachment.content.data && attachment.content.data.length) {
                file.content = new Buffer(attachment.content.data)
            }

            payload.attachments.push(file)
        }
    }

    // configure AWS SDK
    aws.config.update(config)

    // create Nodemailer SES transporter
    const transporter = nodemailer.createTransport({
        SES: new aws.SES({
            apiVersion: '2010-12-01'
        })
    })

    return new Promise((resolve) => {
        transporter.sendMail(payload, function (err) {
            if (err) {
                log.error('error while sending email', {
                    payload: payload,
                    error: err
                })
                cleanup(payload)
                resolve(false)
            } else {
                log.info('sent email')
                cleanup(payload)
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

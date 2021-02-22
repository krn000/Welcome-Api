'use strict'
const admin = require('firebase-admin')
const logger = require('@open-age/logger')('providers/firebase')

var send = async (message, device, config) => {
    const log = logger.start('push')

    if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(config) })
    }

    message.meta.subject = message.subject
    message.meta.title = message.subject
    message.meta.body = message.body

    message.meta.from = {
        role: {
            id: message.from.role.id
        },
        profile: {
            firstName: '',
            lastName: '',
            pic: {
                url: '',
                thumbnail: ''
            }
        }
    }

    if (message.from.profile) {
        message.meta.from.profile = {
            firstName: message.from.profile.firstName,
            lastName: message.from.profile.lastName
        }
        if (message.from.profile.pic) {
            message.meta.from.profile.pic = {
                url: message.from.profile.pic.url,
                thumbnail: message.from.profile.pic.thumbnail
            }
        }
    }

    const pushMessage = {
        notification: {
            title: message.subject || 'New Message',
            body: message.body
        },
        data: {
            meta: JSON.stringify(message.meta)
        }
    }

    return admin.messaging().sendToDevice([device.id], pushMessage)
        .then((response) => {
            log.debug(response)
            return true
        })
        .catch((error) => {
            log.error(error)
            return false
        })
}

var publish = async (message, topic, config) => {
    const log = logger.start('push')

    if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(config) })
    }

    message.meta.subject = message.subject
    message.meta.title = message.subject
    message.meta.body = message.body

    message.meta.from = {
        role: {
            id: message.from.role.id
        },
        profile: {
            firstName: '',
            lastName: '',
            pic: {
                url: '',
                thumbnail: ''
            }
        }
    }

    if (message.from.profile) {
        message.meta.from.profile = {
            firstName: message.from.profile.firstName,
            lastName: message.from.profile.lastName
        }
        if (message.from.profile.pic) {
            message.meta.from.profile.pic = {
                url: message.from.profile.pic.url,
                thumbnail: message.from.profile.pic.thumbnail
            }
        }
    }

    const pushMessage = {
        notification: {
            title: message.subject || 'New Message',
            body: message.body
        },
        data: {
            meta: JSON.stringify(message.meta)
        },
        topic: topic
    }

    log.debug(`publishing message to ${topic}`)
    try {
        const response = await admin.messaging().send(pushMessage)
        log.debug(response)
        return true
    } catch (err) {
        log.error(err)
        return false
    }
}

exports.config = function (config) {
    return {
        send: async (message, device) => {
            return send(message, device, config)
        },
        publish: async (message, to) => {
            if (to && to.topic) {
                return publish(message, to.topic, config)
            }
        }
    }
}

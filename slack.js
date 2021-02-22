'use strict'
// const logger = require('@open-age/logger')('channels.slack')
// var defaultConfig = require('config').get('providers.slack')
var Slack = require('slack')

const send = async (message, config) => {
    var channel = message.channel || config.channel
    if (!channel) {
        return
    }

    const slackEntity = await new Slack({ token: config.token })
    const data = await slackEntity.chat.postMessage({
        token: config.token,
        channel: channel,
        text: message.subject
    })
    return {
        id: data.ts,
        timeStamp: data.ts
    }
}

const search = async (query, config) => {
    let messages = []

    var channel = query.channel || config.channel
    if (!channel) {
        return messages
    }

    var opts = {
        token: config.token,
        count: 100,
        // inclusive: true,
        channel: channel
    }

    if (query.from) {
        opts.oldest = query.from
    }
    if (query.till) {
        opts.latest = query.till
    }

    console.log(`token: ${config.token}, channel: ${channel}, oldest: ${opts.oldest}, latest: ${opts.oldest}`)

    const slackEntity = await new Slack({ token: config.token })

    const data = await slackEntity.channels.history(opts)

    console.log(`messages: ${data.messages.length} no(s)`)

    for (const message of data.messages) {
        if (message.username === config.user.code) {
            continue
        }

        if (!message.client_msg_id) {
            continue
        }

        const userData = await slackEntity.users.info({
            token: config.token,
            user: message.user
        })

        if (!userData.user) {
            continue
        }
        const user = {
            email: userData.user.profile.email,
            profile: {
                firstName: userData.user.profile.real_name,
                lastName: ''
            }
        }

        messages.push({
            id: message.ts,
            timeStamp: message.ts,
            subject: message.text,
            from: user
        })
    }

    messages = messages.sort((a, b) => {
        return parseFloat(a.timeStamp) - parseFloat(b.timeStamp)
    })

    return messages
}
exports.config = function (providerConfig) {
    return {
        send: async (message, channelConfig) => {
            return send(message, {
                channel: channelConfig.channel || providerConfig.channel,
                token: channelConfig.token || providerConfig.token,
                user: channelConfig.user || providerConfig.user
            })
        },
        publish: async (message, channelConfig) => {
            return send(message, {
                channel: channelConfig.channel || providerConfig.channel,
                token: channelConfig.token || providerConfig.token,
                user: channelConfig.user || providerConfig.user
            })
        },
        search: async (query, channelConfig) => {
            return search(query, {
                channel: channelConfig.channel || providerConfig.channel,
                token: channelConfig.token || providerConfig.token,
                user: channelConfig.user || providerConfig.user
            })
        }
    }
}

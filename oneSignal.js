'use strict'
var Client = require('node-rest-client').Client
var client = new Client()

var _ = require('underscore')
var defaultConfig = require('config').get('oneSignal')

var notifier = module.exports

var argsBuilder = function (config) {
    var args = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Basic ' + config.Authorization
        },
        path: { app_id: config.app_id, limit: 300, offset: 0 },
        data: {
            app_id: config.app_id,
            data: {},
            headings: {},
            contents: {},
            include_player_ids: [],
            android_group: config.android_group || ''
        }
    }
    return args
}

notifier.config = function (config) {
    return {
        push: function (deviceIds, subject, body, data, callback) {
            send(config, deviceIds, subject, body, data, callback)
        }
    }
}

var deviceIds = []
var getUsers = function (args, callback) {
    return client.get('https://onesignal.com/api/v1/players?app_id=${app_id}&limit=${limit}&offset=${offset}', args, function (data, response) {
        if (deviceIds.length < data.total_count) {
            var devices = _.pluck(data.players, 'id')
            _.each(devices, function (device) {
                deviceIds.push(device)
            })
            args.path.offset = args.path.offset + 300
            return getUsers(args, callback)
        }
        return callback(null, deviceIds)
    })
}

var getDevices = function (config, subject, body, data, callback) {
    getUsers(argsBuilder(config), function (err, devices) {
        send(config, devices, subject, body, data, callback)
    })
}

// model = {subject, message, data}
exports.push = function (deviceIds, subject, body, data, callback) {
    if (deviceIds.toLowerCase() === 'all') {
        return getDevices(defaultConfig, subject, body, item, callback)
    }
    send(defaultConfig, deviceIds, subject, body, data, callback)
}

var send = async (config, deviceIds, subject, body, data) => {
    var args = argsBuilder(config)

    if (data) {
        args.data.data = data
    }

    args.data.headings.en = subject
    args.data.contents.en = body

    if (typeof deviceIds === Array || Object) {
        _(deviceIds).each(function (id) {
            args.data.include_player_ids.push(id)
        })
    } else {
        args.data.include_player_ids.push(deviceIds)
    }

    if (config.testDeviceId) {
        args.data.include_player_ids.push(defaultConfig.testDeviceId)
    }

    client.post(config.url, args, function (data, response) {
        if (callback) {
            callback()
        }
    })
}

exports.getDevices = getDevices

exports.config = function (config) {
    return {
        send: async (message, to) => {
            return send(message, to, config)
        }
    }
}

'use strict'
var mongoose = require('mongoose')
var dbConfig = require('config').get('dbServer')

module.exports.configure = function (logger) {
    const log = logger.start('settings/database:configure')
    mongoose.Promise = global.Promise

    const connect = function () {
        const config = JSON.parse(JSON.stringify(dbConfig))

        if (config.options) {
            config.options.promiseLibrary = global.Promise
        }

        log.info('connecting to', dbConfig)
        mongoose.connect(config.host, config.options)
    }

    connect()

    const db = mongoose.connection

    db.on('connected', function () {
        log.info('DB Connected')
    })

    db.on('error', function (err) {
        log.error('connection error: ' + err)
    })

    db.on('disconnected', function () {
        log.info('connecting again')
        connect()
    })

    global.db = require('../models')
    return global.db
}

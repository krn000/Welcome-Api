'use strict'
var express = require('express')
var path = require('path')
const cors = require('cors')
const timeout = require('connect-timeout') // express v4

var bodyParser = require('body-parser')
var appRoot = require('app-root-path')

module.exports.configure = function (app, logger) {
    logger.start('settings/express:configure')

    app.use(timeout(120000))
    app.use((req, res, next) => {
        if (!req.timedout) next()
    })

    app.use(cors())
    app.use((err, req, res, next) => {
        if (err) {
            res.writeHead(500)
            res.end()
            return
        }
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE')
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
        next()
    })

    app.use(bodyParser.json({ limit: '50mb' }))

    app.use(bodyParser.urlencoded({
        limit: '50mb',
        extended: true
    }))

    app.use(express.static(path.join(appRoot.path, 'public')))
    app.set('view engine', 'ejs')
    app.use(bodyParser({ limit: '50mb', keepExtensions: true }))
}

'use strict'
global.Promise = require('bluebird')
var express = require('express')
var logger = require('@open-age/logger')('app')
var http = require('http')
var path = require('path')
var webServer = require('config').get('webServer')

require('./helpers/string')

var app = express()
require('./settings/database').configure(logger)
require('./settings/queue').configure()
require('./settings/express').configure(app, logger)
require('./settings/routes').configure(app)
require('./settings/scheduler').configure(app)

var server = http.createServer(app)
var port = process.env.PORT || webServer.port || 3000
logger.info('environment: ' + process.env.NODE_ENV)

logger.info('starting server')
server.listen(port, function () {
    logger.info('listening on port:' + port)
})

module.exports = app

'use strict'

const contextBuilder = require('../helpers/context-builder')
const apiRoutes = require('@open-age/express-api')
const fs = require('fs')

const specs = require('../specs')

var multipart = require('connect-multiparty')

module.exports.configure = (app, logger) => {
    logger.start('settings:routes:configure')

    const specsHandler = function (req, res) {
        fs.readFile('./public/specs.html', function (err, data) {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.contentType('text/html')
            res.send(data)
        })
    }

    app.get('/', specsHandler)

    app.get('/specs', specsHandler)

    app.get('/api/specs', function (req, res) {
        res.contentType('application/json')
        res.send(specs.get())
    })

    var api = apiRoutes(app, { context: { builder: contextBuilder.create } })

    api.model('tenants')
        .register([{
            action: 'GET',
            method: 'search',
            permissions: 'system.admin'
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            permissions: 'tenant.admin'
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            permissions: 'tenant.admin'
        }])

    api.model('providers')
        .register([{
            action: 'GET',
            method: 'search',
            permissions: ['tenant.guest', 'tenant.user']
        }, {
            action: 'POST',
            method: 'create',
            permissions: 'tenant.admin'
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            permissions: ['tenant.guest', 'tenant.user']
        }, {
            action: 'PUT',
            method: 'update',
            url: '/my',
            permissions: 'tenant.admin'
        }])

    api.model('organizations')
        .register([{
            action: 'GET',
            method: 'search',
            permissions: 'tenant.admin'
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            permissions: 'organization.admin'
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            permissions: 'organization.admin'
        }])

    api.model('channels').register('REST', { permissions: ['tenant.admin', 'organization.admin'] })

    api.model('users').register('REST', { permissions: 'tenant.user' })
        .register([{
            action: 'POST',
            method: 'mute',
            url: '/:id/mute',
            permissions: 'tenant.user'
        }, {
            action: 'POST',
            method: 'unmute',
            url: '/:id/unmute',
            permissions: 'tenant.user'
        }, {
            action: 'POST',
            method: 'subscribe',
            url: '/subscriptions/:key',
            permissions: 'tenant.user'
        }, {
            action: 'DELETE',
            method: 'unsubscribe',
            url: '/subscriptions/:key',
            permissions: 'tenant.user'
        }])

    api.model('conversations').register('REST', { permissions: 'tenant.user' })
        .register([{
            action: 'GET',
            method: 'getDirectConversationByRoleId',
            url: '/getDirectConversationByRoleId/:id',
            permissions: 'tenant.user'
        }, {
            action: 'POST',
            method: 'addParticipant',
            url: '/:id/participants',
            permissions: 'tenant.user'
        }, {
            action: 'DELETE',
            method: 'removeParticipant',
            url: '/:id/participants/:roleId',
            permissions: 'tenant.user'
        }])

    api.model('diagnostics').register('REST')
    api.model('messages').register('REST', { permissions: 'tenant.user' })
        .register([{
            action: 'POST',
            method: 'send',
            url: '/send',
            permissions: 'tenant.user'
        }, {
            action: 'POST',
            method: 'changeStatus',
            url: '/multiple',
            permissions: 'tenant.user'
        }, {
            action: 'POST',
            method: 'create',
            url: '/byCaptcha',
            permissions: 'tenant.guest',
            filter: [(req, res, next) => {
                if (!req.headers['x-google-captcha']) {
                    res.accessDenied('CAPTCHA_INVALID')
                } else {
                    next()
                }
            }]
        }])

    api.model({ root: 'emails', controller: 'messages' })
        .register([{
            action: 'POST',
            method: 'send',
            url: '/send',
            filter: [(req, res, next) => {
                req.body.type = 'email'
                next()
            }]
        }])

    api.model({ root: 'sms', controller: 'messages' })
        .register([{
            action: 'POST',
            method: 'send',
            url: '/send',
            permissions: ['tenant.admin', 'organization.admin'],
            filter: [(req, res, next) => {
                req.body.type = 'sms'
                next()
            }]
        }])

    api.model({ root: 'push', controller: 'messages' })
        .register([{
            action: 'POST',
            method: 'send',
            url: '/send',
            permissions: ['tenant.user'],
            filter: [(req, res, next) => {
                req.body.type = 'push'
                next()
            }]
        }])

    api.model('jobs').register('REST', { permissions: ['tenant.admin', 'organization.admin'] })
        .register([{
            action: 'POST',
            method: 'run',
            url: '/:code/run',
            permissions: ['tenant.admin', 'organization.admin']
        }])

    api.model('docs').register([{
        action: 'POST',
        method: 'createPreview',
        url: '/:code/preview',
        permissions: 'tenant.user'
    }, {
        action: 'GET',
        method: 'getByDataId',
        url: '/:code/:dataId.pdf',
        permissions: 'tenant.user'
    }, {
        action: 'POST',
        method: 'getByModel',
        url: '/:code.pdf',
        permissions: 'tenant.user'
    }, {
        action: 'POST',
        method: 'getDocxByModel',
        url: '/:code.doc',
        permissions: 'tenant.user'
    }])

    api.model('templates')
        .register('REST', { permissions: ['tenant.admin', 'organization.admin'] })
        .register([{
            action: 'POST',
            method: 'createWithFile',
            url: '/files',
            permissions: 'tenant.user',
            filter: [multipart()]
        }, {
            action: 'POST',
            method: 'cloneWithData',
            url: '/:code/clone',
            permissions: 'tenant.user'
        }])

    api.model('summaries').register('REST', { permissions: ['tenant.user'] })
}

'use strict'
const sessionService = require('../services/sessions')
const mapper = require('../mappers/session')

exports.create = async (req) => {
    let session = await sessionService.create(req.body, req.context)
    return mapper.toModel(session)
}

exports.update = async (req) => {
    let log = req.context.logger.start('api:sessions:update')

    return sessionService.update(req.body, req.params.id, req.context).then((session) => {
        log.end()
        return 'session successfully active'
    })
}

exports.get = async (req) => {
    let session = await sessionService.get(req.params.id, req.context)
    return mapper.toModel(session)
}

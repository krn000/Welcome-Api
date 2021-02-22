'use strict'

const db = require('../models')

const offline = require('@open-age/offline-processor')

const set = (model, entity, context) => {
    if (model.status) {
        entity.status = model.status
    }

    if (model.message) {
        entity.error = {
            message: model.message
        }
    }

    if (model.error) {
        entity.error = model.error
    }

    if (model.progress) {
        entity.progress = model.progress
    }
}

exports.create = async (model, context) => {
    const log = context.logger.start('create')

    var task = new db.task({
        data: model.data,
        entity: model.entity,
        progress: model.progress || 0,
        date: model.date || new Date(),
        status: model.status || 'new',
        organization: context.organization,
        tenant: context.tenant
    })

    await task.save()

    await offline.queue('task', 'run', task, req.context)

    log.end()

    return task
}

exports.get = async (query, context) => {
    context.logger.debug('services/tasks:get')

    if (!query) {
        return null
    }

    if (typeof query === 'string' && query.isObjectId()) {
        return db.task.findById(query)
    }
    if (query.id) {
        return db.task.findById(query.id)
    }

    return null
}

exports.search = async (query, page, context) => {
    const log = logger.start('query')

    const where = {
        organization: context.organization,
        tenant: context.tenant
    }

    if (!query.status) {
        where.status = 'new'
    } else if (query.status !== 'any') {
        where.status = req.query.status
    }

    if (req.query.from) {
        where.date = {
            $gte: req.query.from
        }
    }

    log.end()

    if (!page || !page.limit) {
        return {
            items: await db.task.find(where).sort({ timestamp: 1 })
        }
    }

    return {
        items: await db.task.find(where).sort({ timestamp: 1 }).limit(page.limit).skip(page.skip),
        count: await db.task.count(where)
    }
}

exports.update = async (id, model, context) => {
    const log = logger.start('update')

    const entity = await db.task.findById(id)
    set(model, entity, context)
    return entity.save()
}

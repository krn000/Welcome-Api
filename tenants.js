'use strict'
var db = require('../models')

const set = async (model, entity, context) => {
    if (model.name) {
        entity.name = model.name
    }

    if (model.logo) {
        entity.logo = {
            url: model.logo.url,
            thumbnail: model.thumbnail.url
        }
    }

    if (model.status) {
        entity.status = model.status
    }

    if (model.config) {
        entity.config = model.config
    }

    if (model.owner) {
        const user = await db.user.findOrCreate({
            email: model.owner.email
        }, {
            email: model.owner.email,
            name: model.owner.name,
            tenant: entity
        })

        entity.owner = user.result
    }

    if (!model.notifications) {
        return
    }

    entity.notifications = entity.notifications || {
        enabled: true,
        subscriptions: {}
    }

    if (model.notifications.enabled !== undefined) {
        entity.notifications.enabled = model.notifications.enabled
    }

    if (model.notifications.subscriptions) {
        const keys = Object.keys(model.notifications.subscriptions)
        for (let index = 0; index < keys.length; index++) {
            entity.notifications.subscriptions[keys[index]] = model.notifications.subscriptions[keys[index]]
        }
    }
}

exports.update = async (id, model, context) => {
    if (id === 'me' || id === 'my') {
        id = context.tenant.id
    }
    const tenant = await db.tenant.findById(id).populate('owner')
    await set(model, tenant, context)
    return tenant.save()
}

exports.create = async (model, context) => {
    const log = context.logger.start('services/tenants:create')

    let tenant = await exports.get(model, context)

    if (!tenant) {
        tenant = new db.tenant({
            code: model.code.toLowerCase(),
            status: 'active'
        }).save()
    }

    await set(model, tenant, context)
    log.end()
    return tenant
}

exports.get = async (query, context) => {
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.tenant.findById(query).populate('owner')
        } else {
            if (query === 'me' || query === 'my') {
                return db.tenant.findById(context.tenant.id).populate('owner')
            }
            return db.tenant.findOne({ code: query.toLowerCase() }).populate('owner')
        }
    }

    if (query.id) {
        if (query.id === 'me' || query.id === 'my') {
            return db.tenant.findById(context.tenant.id).populate('owner')
        }
        return db.tenant.findById(query.id).populate('owner')
    }

    if (query.code) {
        return db.tenant.findOne({ code: query.code.toLowerCase() }).populate('owner')
    }

    return null
}

exports.getOrCreate = async (model, context) => {
    const log = context.logger.start('services/tenants:clone')

    let tenant = await exports.get(model, context)

    if (!tenant) {
        tenant = new db.tenant({
            name: model.name,
            code: model.code.toLowerCase(),
            status: 'active'
        }).save()
    }

    log.end()
    return tenant
}

exports.search = async (query, page, context) => {
    const where = {
    }
    if (!page || !page.limit) {
        return {
            items: await db.tenant.find(where)
        }
    }
    return {
        items: await db.tenant.find(where).limit(page.limit).skip(page.skip),
        count: await db.tenant.count(where)
    }
}

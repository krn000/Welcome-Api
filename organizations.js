'use strict'
const db = require('../models')

const set = async (model, entity, context) => {
    if (model.name) {
        entity.name = model.name
    }

    if (model.shortName) {
        entity.shortName = model.shortName
    }

    if (model.logo) {
        entity.logo = {
            url: model.logo.url,
            thumbnail: model.logo.thumbnail
        }
    }

    if (model.config) {
        entity.config = model.config
    }
    if (model.status) {
        entity.status = model.status
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

exports.create = async (model, context) => {
    const organization = new db.organization({
        code: model.code.toLowerCase(),
        status: 'active',
        tenant: context.tenant
    })
    await set(model, organization, context)
    await organization.save()
    return organization
}

exports.update = async (id, model, context) => {
    if (id === 'me' || id === 'my') {
        id = context.organization.id
    }

    const entity = await db.organization.findById(id)

    await set(model, entity, context)

    return entity.save()
}

exports.get = async (query, context) => {
    context.logger.start('services/organizations:get')
    let entity
    const where = {
        tenant: context.tenant
    }
    if (typeof query === 'string') {
        if (query === 'me' || query === 'my') {
            return context.organization
        }
        if (query.isObjectId()) {
            return db.organization.findById(query)
        }
        where.code = query
        return db.organization.findOne(where)
    } else if (query.id) {
        if (query.id === 'me' || query.id === 'my') {
            return context.organization
        }
        return db.organization.findById(query.id)
    } else if (query.code) {
        where.code = query.code
        return db.organization.findOne(where)
    }

    return null
}

exports.getByCode = async (code, context) => {
    return db.organization.findOne({
        code: code.toLowerCase(),
        tenant: context.tenant
    })
}

exports.search = async (query, page, context) => {
    const where = {
        tenant: context.tenant
    }
    if (!page || !page.limit) {
        return {
            items: await db.organization.find(where)
        }
    }
    return {
        items: await db.organization.find(where).limit(page.limit).skip(page.skip),
        count: await db.organization.count(where)
    }
}

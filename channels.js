'use strict'
const db = require('../models')

const deactivateByMode = async (mode, context) => {
    const activeChannels = await db.channel.find({
        tenant: context.tenant,
        organization: context.tenant,
        category: mode,
        status: 'enabled'
    }).populate('provider')

    if (!activeChannels || !activeChannels.length) {
        return
    }
    for (const activeChannel of activeChannels) {
        activeChannel.status = 'disabled'
        await activeChannel.save()
    }
}

const set = async (model, entity, context) => {
    if (model.status !== entity.status) {
        if (model.status === 'enabled') {
            await deactivateByMode(entity.category, context)
        }

        entity.status = model.status
    }

    // TODO Validate config against provider

    if (model.config) {
        entity.config = model.config
    }
}

exports.create = async (model, context) => {
    const provider = await db.provider.findOne({
        code: model.provider.code
    })

    if (!provider) {
        throw new Error(`invalid provider '${model.provider.code}'`)
    }

    let entity = await db.channel.findOne({
        tenant: context.tenant,
        organization: context.organization,
        provider: provider,
        category: provider.category
    })

    if (!entity) {
        entity = new db.channel({
            tenant: context.tenant,
            organization: context.organization,
            provider: provider,
            category: provider.category
        })
    }

    await set(model, entity, context)
    await entity.save()
    return entity
}

exports.update = async (id, model, context) => {
    const entity = await exports.get(id, context)

    await set(model, entity, context)

    await entity.save()

    return entity
}

const getByMode = async (mode, context) => {
    let channel
    if (context.organization) {
        channel = await db.channel.findOne({
            organization: context.organization,
            category: mode,
            status: 'enabled'
        }).populate({
            path: 'provider'
        }).populate('tenant organization')
    }

    if (!channel) {
        channel = await db.channel.findOne({
            tenant: context.tenant,
            organization: { $exists: false },
            category: mode,
            status: 'enabled'
        }).populate({
            path: 'provider'
        }).populate('tenant')
    }

    if (channel) {
        if (channel.provider.code === 'slack') {
            channel.config.user = channel.config.user || {}
            channel.config.user.code = channel.config.user.code || 'sendit_slack'
        }
    }

    return channel
}

exports.search = async (query, page, context) => {
    const log = context.logger.start('query')

    const where = {
        organization: context.organization,
        tenant: context.tenant
    }

    // if (!query.status) {
    //     where.status = 'active'
    // } else if (query.status !== 'any') {
    //     where.status = req.query.status
    // } else {
    //     where.status = query.status
    // }

    if (query.category) {
        where.category = query.category
    }

    log.end()

    return {
        items: await db.channel.find(where).populate({
            path: 'provider'
        }).populate('tenant organization')
    }
}

exports.get = async (query, context) => {
    context.logger.debug('services/channel:get')

    if (!query) {
        return
    }

    if (query._bsontype === 'ObjectID') {
        query = {
            id: query.toString()
        }
    }

    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.channel.findById(query).populate('provider tenant organization')
        } else {
            return db.channel.findOne({
                tenant: context.tenant,
                organization: context.tenant
            }).populate({
                path: 'provider',
                match: { code: query }
            }).populate('tenant organization')
        }
    }
    if (query.id) {
        return db.channel.findById(query.id).populate({
            path: 'provider',
            match: { category: category }
        }).populate('tenant organization')
    }

    if (query.code) {
        return db.channel.findOne({
            tenant: context.tenant,
            organization: context.tenant
        }).populate({
            path: 'provider',
            match: { code: query.code }
        }).populate('tenant organization')
    }

    return null
}

exports.getByMode = getByMode

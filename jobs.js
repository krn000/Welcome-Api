const db = require('../models')
const templates = require('./templates')
const messages = require('./messages')

const dataSources = require('../helpers/data-sources')

const populate = 'template tenant organization user'

const extract = (item, field) => {
    let value = item
    field.split('.').forEach(part => {
        value = value[part]
    })
    return value
}

const set = async (model, entity, context) => {
    if (model.name) {
        entity.name = model.name
    }
    if (model.status) {
        entity.status = model.status
    }

    if (model.processor) {
        entity.processor = model.processor
    }

    if (model.config) {
        entity.config = {}
        if (model.config.to) {
            entity.config.to = model.config.to
        }

        if (model.config.modes) {
            entity.config.modes = model.config.modes
        }

        if (model.config.entity) {
            entity.config.entity = model.config.entity
        }
    }

    if (model.dataSource) {
        entity.dataSource = model.dataSource
    }

    if (model.schedule) {
        entity.schedule.hour = model.schedule.hour
        entity.schedule.minute = model.schedule.minute
    }

    if (model.periodicity) {
        entity.periodicity.type = model.periodicity.type
        entity.periodicity.period = model.periodicity.period
        entity.periodicity.start = model.periodicity.start
        entity.periodicity.end = model.periodicity.end
    }

    if (model.template && model.template.code) {
        entity.template = await templates.getByCode(model.template.code, context)
    }
}

exports.create = async (model, context) => {
    const where = {
        code: model.code.toLowerCase(),
        organization: context.organization,
        tenant: context.tenant
    }

    let entity = await db.job.findOne(where).populate(populate)

    if (!entity) {
        entity = new db.job({
            code: model.code.toLowerCase(),
            user: context.user,
            organization: context.organization,
            tenant: context.tenant
        })
    }

    await set(model, entity, context)
    return entity.save()
}

exports.update = async (id, model, context) => {
    const entity = await db.job.findById(id).populate(populate)
    await set(model, entity, context)
    return await entity.save()
}

exports.run = async (job, context) => {
    context.logger.info(`running job '${job.code}'`)

    const items = await dataSources.fetch({ dataSource: job.dataSource }, context)

    const length = items.length
    let index = 0

    const entityConfig = job.config.entity || job.template.config.entity

    const toConfig = job.config.to || job.template.config.to

    for (const item of items) {
        let conversation

        if (entityConfig) {
            conversation = {
                entity: {
                    id: extract(item, entityConfig.field),
                    type: entityConfig.type
                }
            }
        }

        let to = toConfig

        if (toConfig && toConfig.field) {
            to = extract(item, toConfig.field)
        }

        if (!Array.isArray(to)) {
            to = [to]
        }
        await messages.create({
            template: job.template,
            modes: job.config.modes,
            conversation: conversation,
            to: to,
            data: item
        }, context)

        context.setProgress(index++, length)
    }
    return job
}

exports.get = async (query, context) => {
    const where = {
        organization: context.organization,
        tenant: context.tenant
    }

    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.job.findById(query).populate(populate)
        } else {
            where.code = query.toLowerCase()
            return db.job.findOne(where).populate(populate)
        }
    }

    if (query.id) {
        return db.job.findById(query.id).populate(populate)
    }

    if (query.code) {
        where.code = query.code.toLowerCase()
        return db.job.findOne(where).populate(populate)
    }

    return null
}

exports.search = async (query, page, context) => {
    const where = {
        organization: context.organization,
        tenant: context.tenant
    }

    if (!query.status) {
        where.status = 'active'
    } else if (query.status !== 'any') {
        where.status = req.query.status
    }

    if (query.periodicity_type) {
        where['periodicity.type'] = query.periodicity_type
    }

    if (!page || !page.limit) {
        return {
            items: await db.job.find(where).sort({ timestamp: 1 }).populate(populate)
        }
    }

    return {
        items: await db.job.find(where).sort({ timestamp: 1 }).limit(page.limit).skip(page.skip).populate(populate),
        count: await db.job.count(where)
    }
}

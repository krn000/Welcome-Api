
const db = require('../models')

const set = (model, entity, context) => {
    if (model.name) {
        entity.name = model.name
    }

    if (model.url) {
        entity.url = model.url
    }

    if (model.description) {
        entity.description = model.description
    }

    if (model.category) {
        entity.category = model.category
    }

    if (model.discoverable !== undefined) {
        entity.discoverable = model.discoverable
    }

    if (model.picUrl) {
        entity.picUrl = model.picUrl
    }

    if (model.parameters) {
        entity.parameters = []
        for (let index = 0; index < model.parameters.length; index++) {
            const parameter = model.parameters[index]
            entity.parameters.push({
                name: parameter.name,
                title: parameter.title,
                type: parameter.type,
                description: parameter.description,
                validators: parameter.validators || [],
                options: parameter.options || []
            })
        }
    }
}

exports.create = async (model, context) => {
    let entity = await db.provider.findOne({ code: model.code.toLowerCase() })

    if (!entity) {
        entity = new db.provider({ code: model.code.toLowerCase() })
    }

    set(model, entity, context)
    return entity.save()
}

exports.update = async (id, model, context) => {
    const entity = await db.provider.findById(id)
    set(model, entity, context)
    return entity.save()
}

exports.search = async (query, page, context) => {
    const log = context.logger.start('query')

    const where = {
        // organization: context.organization,
        // tenant: context.tenant
    }

    if (query.category) {
        where.category = query.category
    }

    log.end()

    return {
        items: await db.provider.find(where)
    }
}

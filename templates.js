'use strict'

const mammoth = require('mammoth')

const entities = require('../models').template
const db = require('../models')

const documents = require('./documents')
const templateImage = require('./template-image')

const getByCode = async (code, context) => {
    let template = null
    if (context.organization) {
        template = await entities.findOne({
            organization: context.organization,
            code: code,
            status: 'active'
        })
    }

    if (!template) {
        template = await entities.findOne({
            tenant: context.tenant,
            organization: { $exists: false },
            code: code,
            status: 'active'
        })
    }

    // if (!template) {
    //     throw new Error('TEMPLATE_IS_INVALID')
    // }

    return template
}

const set = async (model, entity, context) => {
    if (model.name) {
        entity.name = model.name
    }
    if (model.status) {
        entity.status = model.status
    }

    if (model.subject) {
        entity.subject = model.subject
    }

    if (model.body) {
        entity.body = model.body
        // entity.thumbnail = await templateImage.templateThumbnail(model.body, context)
    }

    if (model.config) {
        entity.config = entity.config || {}

        if (model.config.page) {
            entity.config.page = model.config.page
        }

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

    if (model.logo) {
        entity.logo = model.logo
    }

    if (model.dp) {
        entity.dp = model.dp
    }

    if (model.isHidden !== undefined) {
        entity.isHidden = model.isHidden
    }

    if (model.actions) {
        entity.category = model.category
    }

    if (model.attachment && model.attachment.code) {
        entity.attachment = await getByCode(attachment.code, context)
    }

    if (model.actions) {
        entity.actions = model.actions
    }

    if (model.dataSource) {
        entity.dataSource = model.dataSource
    }

    const isPublic = !!(model.isPublic === 'true' || model.isPublic === true)

    if (isPublic) {
        entity.isPublic = isPublic
    }
}

exports.create = async (model, context) => {
    let entity = await getByCode(model.code, context)
    if (!entity) {
        entity = new db.template({
            code: model.code.toLowerCase(),
            organization: context.organization,
            tenant: context.tenant
        })
    }

    await set(model, entity, context)

    return await entity.save()
}

exports.update = async (id, model, context) => {
    let entity = await exports.get(id, context)
    if (!entity) {
        entity = new db.template({
            code: model.code,
            organization: context.organization,
            tenant: context.tenant
        })
    }

    if (context.organization && !entity.organization) {
        throw new Error('TEMPLATE_IS_READONLY')
    }
    await set(model, entity, context)
    return entity.save()
}

exports.get = async (query, context) => {
    if (!query) {
        return
    }

    if (query._bsontype === 'ObjectID') {
        query = {
            id: query.toString()
        }
    }

    let template = null

    if (typeof query === 'string') {
        if (query.isObjectId()) {
            template = await db.template.findById(query).populate('attachment')
        } else {
            template = await getByCode(query, context)
        }
    }

    if (query.id) {
        template = await db.template.findById(query).populate('attachment')
    }

    if (query.code) {
        template = await getByCode(query.code, context)
    }

    if (!template) {
        context.logger.error(`template with code ${query.code} not found`)
        throw new Error('TEMPLATE_IS_INVALID')
    }

    return template
}

exports.search = async (query, page, context) => {
    let where = {
        tenant: context.tenant
    }

    if (query.level === 'organization') {
        where.organization = context.organization
    } else if (query.level === 'library') {
        where.organization = { $exists: true }
        where.isPublic = true
    } else if (query.level === 'tenant') {
        where.organization = { $exists: false }
    } else {
        where = {
            tenant: context.tenant,
            isPublic: true
        }
    }

    return {
        items: await entities.find(where).populate('attachment tenant organization')
    }
}

exports.getByCode = getByCode

const fileToHtml = (filePath, context) => {
    return new Promise((resolve, reject) => {
        mammoth.convertToHtml({ path: filePath }).then((result) => {
            console.log(result.messages)
            return resolve(result.value)
        }).catch((err) => {
            return reject(err)
        })
    })
}

exports.createWithFile = async (file, query, context) => {
    const body = await fileToHtml(file.path, context)

    const model = Object.assign({ body: body }, query)

    return exports.create(model, context)
}

exports.cloneWithData = async (templateCode, body, context) => { // clone template with Data
    const model = {
        code: body.code
    }

    const template = await getByCode(templateCode, context)

    const doc = await documents.getDocByTemplate(body.data, template, context)
    model.subject = doc.name
    model.body = doc.content

    model.config = body.config || template.config || {}

    return exports.create(model, context)
}

exports.remove = async (id, context) => {
    await db.template.remove({ id: id })
    return true
}

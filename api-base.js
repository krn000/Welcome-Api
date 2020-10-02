'use strict'
const pager = require('../helpers/paging')

const inflate = (flattened) => {
    let model = {}

    Object.getOwnPropertyNames(flattened).forEach(key => {
        const value = flattened[key]

        if (!value) {
            return
        }

        let parts = key.split('-')
        let index = 0
        let obj = model

        for (const part of parts) {
            if (index === parts.length - 1) {
                obj[part] = value
            } else {
                obj[part] = obj[part] || {}
            }

            obj = obj[part]
            index++
        }
    })

    return model
}

module.exports = (serviceName, mapperName) => {
    let name = serviceName
    mapperName = mapperName || name
    const entityMapper = require('../mappers')[mapperName]
    const entityService = require(`../services/${name}`)

    if (!entityService) {
        throw new Error(`services.${name} does not exist`)
    }

    if (!entityMapper) {
        throw new Error(`mappers.${mapperName} does not exist`)
    }

    return {
        get: async (req) => {
            if (!entityService.get) {
                throw new Error(`METHOD_NOT_SUPPORTED`)
            }
            let entity = await entityService.get(req.params.id, req.context)

            if (!entity) {
                throw new Error(`RESOURCE_NOT_FOUND`)
            }
            return entityMapper.toModel(entity, req.context)
        },
        search: async (req) => {
            if (!entityService.search) {
                throw new Error(`METHOD_NOT_SUPPORTED`)
            }
            let page = pager.extract(req)

            let query = inflate(req.query)
            req.context.logger.silly(query)
            const entities = await entityService.search(query, page, req.context)

            let pagedItems = {
                items: entities.items.map(i => {
                    return (entityMapper.toSummary || entityMapper.toModel)(i, req.context)
                }),
                total: entities.count || entities.items.length
            }

            if (page) {
                pagedItems.skip = page.skip
                pagedItems.limit = page.limit
                pagedItems.pageNo = page.pageNo
            }

            return pagedItems
        },
        update: async (req) => {
            if (!entityService.update) {
                throw new Error(`METHOD_NOT_SUPPORTED`)
            }
            const entity = await entityService.update(req.params.id, req.body, req.context)
            return entityMapper.toModel(entity, req.context)
        },

        create: async (req) => {
            if (!entityService.create) {
                throw new Error(`METHOD_NOT_SUPPORTED`)
            }
            const entity = await entityService.create(req.body, req.context)
            return entityMapper.toModel(entity, req.context)
        },
        bulk: async (req) => {
            let added = 0
            let updated = 0
            for (const item of req.body.items) {
                let entity = await entityService.get(item, req.context)
                if (entity) {
                    await entityService.update(entity.id, item, req.context)
                    updated = updated + 1
                } else {
                    await entityService.create(item, req.context)
                    added = added + 1
                }
            }

            let message = `added: ${added}, updated: ${updated} item(s)`
            req.context.logger.debug(message)
            return message
        },
        delete: async (req) => {
            if (!entityService.remove) {
                throw new Error(`METHOD_NOT_SUPPORTED`)
            }
            let count = await entityService.remove(req.params.id, req.context)

            count = count || 1

            return `${count} item(s) removed`
        }
    }
}

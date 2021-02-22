'use strict'
const pager = require('../helpers/paging')

const inflate = (flattened) => {
    const model = {}

    Object.getOwnPropertyNames(flattened).forEach(key => {
        const value = flattened[key]

        if (!value) {
            return
        }

        const parts = key.split('-')
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
    const name = serviceName
    mapperName = mapperName || name
    const entityService = require('../services')[name]
    const entityMapper = require('../mappers')[mapperName]

    if (!entityService) {
        throw new Error(`services.${name} does not exist`)
    }

    if (!entityMapper) {
        throw new Error(`mappers.${mapperName} does not exist`)
    }

    return {
        get: async (req) => {
            if (!entityService.get) {
                throw new Error('METHOD_NOT_SUPPORTED')
            }
            const entity = await entityService.get(req.params.id, req.context)

            if (!entity) {
                throw new Error('RESOURCE_NOT_FOUND')
            }
            return entityMapper.toModel(entity, req.context)
        },
        search: async (req) => {
            if (!entityService.search) {
                throw new Error('METHOD_NOT_SUPPORTED')
            }
            const page = pager.extract(req)

            const query = inflate(req.query)
            req.context.logger.silly(query)
            const entities = await entityService.search(query, page, req.context)

            const pagedItems = {
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
                throw new Error('METHOD_NOT_SUPPORTED')
            }
            req.context.logger.silly(JSON.stringify(req.body))
            const entity = await entityService.update(req.params.id, req.body, req.context)
            return entityMapper.toModel(entity, req.context)
        },

        create: async (req) => {
            if (!entityService.create) {
                throw new Error('METHOD_NOT_SUPPORTED')
            }

            req.context.logger.silly(JSON.stringify(req.body))
            const entity = await entityService.create(req.body, req.context)
            return entityMapper.toModel(entity, req.context)
        },
        bulk: async (req) => {
            let added = 0
            let updated = 0
            for (const item of req.body.items) {
                const entity = await entityService.get(item, req.context)
                if (entity) {
                    await entityService.update(entity.id, item, req.context)
                    updated = updated + 1
                } else {
                    await entityService.create(item, req.context)
                    added = added + 1
                }
            }

            const message = `added: ${added}, updated: ${updated} item(s)`
            req.context.logger.debug(message)
            return message
        },
        delete: async (req) => {
            if (!entityService.remove) {
                throw new Error('METHOD_NOT_SUPPORTED')
            }
            let count = await entityService.remove(req.params.id, req.context)

            count = count || 1

            return `${count} item(s) removed`
        }
    }
}

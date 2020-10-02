'use strict'
let mapper = require('../mappers/visitors')
const logger = require('@open-age/logger')('visitors')
const users = require('../services/users')
const visitors = require('../services/visitors')
const paging = require('../helpers/paging')

exports.create = async (req) => {
    let log = req.context.logger.start('api/visitors:create')

    let visitor = await visitors.findOrCreate(req.body, req.context)
    log.end()
    return mapper.toModel(visitor)
}

exports.update = async (req, res) => {
    let log = logger.start('update')
    let model = req.body

    let id
    if (req.params.id !== 'my') {
        id = req.params.id
    }

    try {
        let visitorModel = await visitors.getByIdOrContext(id, req.context)

        logger.info('updating user details')
        await users.update(model, visitorModel.user)

        logger.info('updating visitor details')
        let visitor = await visitors.update(model, visitorModel)

        return res.data(mapper.toModel(visitor))
    } catch (err) {
        log.error(err)
        res.failure(err)
    }
}

exports.search = async (req) => {
    let log = req.context.logger.start('api/visitors:search')
    let query = {}

    if (req.context.organization) {
        query.organization = req.context.organization.id
    }

    if (req.query.name) {
        query.$or = [{
            'searchData.name': {
                $regex: '^' + req.query.name,
                $options: 'i'
            }
        }, {
            'searchData.phone': {
                $regex: '^' + req.query.name,
                $options: 'i'
            }
        }]
    }

    let where = db.visitor.find(query).populate('user organization')

    let pageInput = paging.extract(req)

    let visitorList = await (pageInput ? where.skip(pageInput.skip).limit(pageInput.limit) : where)

    let page = {
        items: mapper.toSearchModel(visitorList)
    }

    if (pageInput) {
        page.total = await where.count()
        page.pageNo = pageInput.pageNo
        page.pageSize = pageInput.limit
    }

    log.end()

    return page
}

exports.get = async (req) => {
    let log = req.context.logger.start('api/visitors:get')

    let visitor = await db.visitor.findById(req.params.id).populate('organization user')

    return mapper.toModel(visitor)
}

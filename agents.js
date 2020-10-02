'use strict'
const mapper = require('../mappers/agent')
const agentService = require('../services/agents')
const users = require('../services/users')
const db = require('../models')
const appointmentService = require('../services/appointments')
const paging = require('../helpers/paging')

exports.create = async (req, res) => {
    let log = req.context.logger.start('api/agents:create')
    let agent = await agentService.create(req.body, req.context)
    log.end()
    return mapper.toModel(agent)
}

exports.search = async (req) => {
    let log = req.context.logger.start('api/agents:search')
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

    let where = db.agent.find(query).populate('user organization')

    let pageInput = paging.extract(req)

    let agentList = await (pageInput ? where.skip(pageInput.skip).limit(pageInput.limit) : where)

    let page = {
        items: mapper.toSearchModel(agentList)
    }

    if (pageInput) {
        page.total = await where.count()
        page.pageNo = pageInput.pageNo
        page.pageSize = pageInput.limit
    }

    log.end()

    return page
}

exports.update = async (req, res) => {
    let log = req.context.logger.start('api/agents:update')
    let query = req.params.id

    if (query === 'my') {
        if (req.context.agent) {
            query = req.context.agent.id
        } else {
            query = {
                user: req.context.user
            }
        }
    }

    let agentModel = await agentService.get(query, req.context)

    log.info('updating user details')
    await users.update(req.body, agentModel.user)

    log.info('updating agent details')
    let agent = await agentService.update(req.body, agentModel)

    return mapper.toModel(agent)
}

exports.get = async (req, res) => {
    let log = req.context.logger.start('api/agents:get')
    let id
    if (req.params.id !== 'my') {
        id = req.params.id
    }

    try {
        let agent = await agentService.getByIdOrContext(id, req.context)

        if (!agent && req.params.id === 'my') {
            agent = await agentService.create({
                user: req.context.user,
                organization: req.context.organization
            }, req.context)
        }

        agent.appointmentCount = await appointmentService.oneDayAppointmentCount({
            agentId: agent.id
        }, req.context)

        return res.data(mapper.toModel(agent))
    } catch (error) {
        log.error(error)
        return res.failure(error)
    }
}

'use strict'

const logger = require('@open-age/logger')('availabilities')
const agents = require('../services/agents')
const availabilities = require('../services/availabilities')

const mapper = require('../mappers/availability')
const appointmentService = require('../services/appointments')

const db = require('../models')

exports.create = async (req, res) => {
    let log = logger.start('create')
    let context = req.context

    try {
        let availability = await availabilities.create(req.body, context)
        return res.data(mapper.toModel(availability))
    } catch (error) {
        log.error(error)
        return res.failure(error)
    }
}

exports.update = async (req, res) => {
    let log = logger.start('api/availabilities:update')
    try {
        let availabilityModel = await availabilities.getById(req.params.id, req.context)

        let upcomingAppointments = await appointmentService.futureAppointments({
            agentId: availabilityModel.agent._doc ? availabilityModel.agent.id : availabilityModel.agent.toString()
        }, req.context)

        if (upcomingAppointments && upcomingAppointments.length) {
            throw new Error(`Your ${upcomingAppointments.length} upcoming appointments are pending, Please take action on appointments before reschedule your availability time`)
        }

        log.info('update availability details of agent', `${req.body}`)
        let availability = await availabilities.update(req.body, availabilityModel, req.context)
        log.end()
        return res.data(mapper.toModel(availability))
    } catch (error) {
        log.end()
        return res.failure(error)
    }
}

exports.getByAgent = async (req, res) => {
    let log = logger.start('api:availabilities:getByAgent')

    let id

    if (req.params.id !== 'my') {
        req.context.agent = await agents.getByIdOrContext(req.params.id, req.context)
    } else {
        req.context.agent = await agents.getOrCreate(id, req.context)
    }

    if (!req.context.agent) {
        throw new Error('agent not found')
    }

    let availability = await availabilities.get({ agentId: req.context.agent.id }, req.context)

    if (!availability) {
        throw new Error('Design your appointment schedule')
    }

    log.end()
    return mapper.toModel(availability)
}

exports.search = async (req) => {
    let log = req.context.logger.start('api/availabilities:search')

    const query = {}

    if (req.query.agentId) {
        query.agent = req.query.agentId
    }

    const availabilities = await db.availability.find(query).populate('type')

    log.end()
    return mapper.toSearchModel(availabilities)
}

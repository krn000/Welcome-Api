'use strict'
let moment = require('moment-timezone')
const logger = require('@open-age/logger')('appointments')
const offline = require('@open-age/offline-processor')

const db = require('../models')
const appointments = require('../services/appointments')
const appointmentTypes = require('../services/appointment-types')
const pager = require('../helpers/paging')
const users = require('../services/users')
const mapper = require('../mappers/appointment')

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

exports.create = async (req, res) => {
    let log = req.context.logger.start('api/appointments:create')

    let agent = await users.get(req.body.agent, req.context)

    if (!agent) {
        throw new Error('agent does not exist')
    } else {
        if (req.body.agent.meta) {
            agent.meta = req.body.agent.meta
            await agent.save()
        }
    }

    req.context.agent = agent

    let query = {
        agent: req.context.agent.id,
        till: {
            $lte: req.body.till
        },
        from: {
            $gte: req.body.from
        },
        status: {
            $in: ['scheduled', 'rescheduled']
        }
    }

    let bookedAppointment = await db.appointment.findOne(query).lean()

    if (bookedAppointment) {
        throw new Error('appointment already booked')
    }

    let visitorsData = req.body.visitors || [{
        user: req.context.user,
        organization: req.context.agent.organization
    }]

    let visitors = []

    for (const item of visitorsData) {
        let visitor = await users.get(item, req.context)
        if (item.meta) {
            visitor.meta = item.meta
            await visitor.save()
        }
        visitors.push(visitor)
    }

    for (const visitor of visitors) {
        let futureAppointmentWithAgent = await appointments.futureAppointments({
            visitorId: visitor.id,
            agentId: agent.id
        }, req.context)

        if (futureAppointmentWithAgent && futureAppointmentWithAgent.length) {
            throw new Error('You can not book more appointments with this doctor.')
        }
    }

    let appointmentType = await appointmentTypes.get(req.body.appointmentType, req.context)

    if (!appointmentType) {
        appointmentType = await appointmentTypes.create(req.body.appointmentType, req.context)
    }

    let model = {
        purpose: req.body.purpose,
        from: req.body.from,
        till: req.body.till,
        data: req.body.data,
        agent: agent,
        provider: req.body.provider,
        duration: req.body.duration,
        visitors: visitors,
        organization: req.context.organization || req.context.agent.organization,
        status: req.body.status || 'scheduled',
        appointmentType: appointmentType
    }

    let appointment = await appointments.create(model, req.context)
    log.debug('new appointment', `${appointment}`)
    log.end()
    return mapper.toModel(appointment)
}

exports.remove = async (req) => {
    let log = req.context.logger.start('update')

    await appointments.remove(req.params.id, req.context)

    return `Appointment Deleted`
}

exports.update = async (req) => {
    let log = req.context.logger.start('update')

    let model = {
        purpose: req.body.purpose,
        from: req.body.from,
        till: req.body.till,
        status: req.body.status,
        duration: req.body.duration
    }

    let appointment = await appointments.getById(req.params.id, req.context)

    // if (req.body.agent) {
    //     model.agent = req.body.agent
    // }

    if (req.body.visitors && req.body.visitors.length) {
        let visitors = []

        for (const item of req.body.visitors) {
            let visitor = await users.get(item, req.context)
            if (item.meta) {
                visitor.meta = item.meta
                await visitor.save()
            }
            visitors.push(visitor)
        }

        let newVisitors = appointments.newVisitors(appointment.visitors, visitors, req.context)

        if (newVisitors && newVisitors.length) {
            for (const visitor of visitors) {
                let futureAppointmentWithAgent = await appointments.futureAppointments({
                    visitorId: visitor.id,
                    agentId: appointment.agent.id
                }, req.context)

                if (futureAppointmentWithAgent && futureAppointmentWithAgent.length) {
                    let i = 0
                    for (const futureAppointment of futureAppointmentWithAgent) {
                        if (appointment.id === futureAppointment.id) {
                            futureAppointmentWithAgent.splice(i, 1)
                        }
                        i++
                    }
                    if (futureAppointmentWithAgent.length) {
                        throw new Error('You can not book more appointments with this doctor.')
                    }
                }
            }
        }

        model.visitors = visitors
    }

    if (req.body.agent && req.body.agent.email && appointment.agent && appointment.agent.email !== req.body.agent.email) {

        let agent = await users.get(req.body.agent, req.context)

        if (!agent) {
            throw new Error('agent does not exist')
        } else {
            if (req.body.agent.meta) {
                agent.meta = req.body.agent.meta
                await agent.save()
            }
        }

        req.context.agent = agent

        let query

        if (req.body.till && req.body.from) {
            query = {
                agent: agent.id,
                till: {
                    $lte: req.body.till
                },
                from: {
                    $gte: req.body.from
                },
                status: {
                    $in: ['scheduled', 'rescheduled']
                }
            }

            let bookedAppointments = await db.appointment.find(query).lean()
            if (bookedAppointments && bookedAppointments.length) {
                let i = 0
                for (const bookedAppointment of bookedAppointments) {
                    if (appointment.id === bookedAppointment.id) {
                        bookedAppointments.splice(i, 1)
                    }
                    i++
                }
                if (bookedAppointments.length) {
                    throw new Error('appointment already booked')
                }
            }
        }
        model.agent = agent
    }

    let updatedAppointment = await appointments.update(model, appointment, req.context)
    log.debug('updatedAppointment', `${updatedAppointment}`)
    log.end()
    return mapper.toModel(updatedAppointment)
}

exports.get = async (req) => {
    let log = req.context.logger.start('get')

    let appointment = await appointments.getById(req.params.id, req.context)
    log.debug('appointment', `${appointment}`)
    log.end()
    return mapper.toModel(appointment)
}

exports.search = async (req, res) => {
    let page = pager.extract(req)

    let query = inflate(req.query)
    req.context.logger.silly(query)
    const entities = await appointments.search(query, page, req.context)

    let pagedItems = {
        items: entities.items.map(i => {
            return (mapper.toSummary || mapper.toModel)(i, req.context)
        }),
        total: entities.count || entities.items.length
    }

    if (page) {
        pagedItems.skip = page.skip
        pagedItems.limit = page.limit
        pagedItems.pageNo = page.pageNo
    }

    return pagedItems
}

exports.visitorAppointments = async (req, res) => {
    let log = logger.start('visitorsAppointment')

    let userId
    if (req.params.id === 'my') {
        userId = req.context.user.id
    } else {
        let visitor = await db.visitor.findById(req.params.id)
        if (!visitor) {
            throw new Error('visitor not found')
        }
        userId = visitor.user.toString()
    }

    const upcomingAppointments = await appointments.visitorAppointments(userId, {
        $and: [{
            status: { $in: ['scheduled', 'rescheduled'] }
        }, {
            from: { $gt: moment().toDate() }
        }]
    }, { from: 1 }, req.context)

    const oldAppointments = await appointments.visitorAppointments(userId, {
        $or: [{
            status: { $in: ['visited'] }
        }, {
            from: { $lt: moment().toDate() }
        }]
    }, { from: -1 }, req.context)

    const cancelledAppointments = await appointments.visitorAppointments(userId, {
        $and: [{
            status: { $in: ['cancelled', 'closed', 'failed'] }
        }]
    }, { from: 1 }, req.context)

    const appointmentsDetails = [upcomingAppointments, oldAppointments, cancelledAppointments]

    await Promise.all(appointmentsDetails).spread((upcomingAppointments, oldAppointments, cancelledAppointments) => {
        var visitorSchedule = {}
        let upcoming = mapper.toVisitorAppointments(upcomingAppointments)
        let old = mapper.toVisitorAppointments(oldAppointments)
        let cancelled = mapper.toVisitorAppointments(cancelledAppointments)
        visitorSchedule.upcoming = upcoming
        visitorSchedule.old = old
        visitorSchedule.cancelled = cancelled
        log.end()
        res.data(visitorSchedule)
    })
}

exports.agentAppointments = async (req) => {
    let log = logger.start('agentAppointments')

    let from = req.query.from || moment().toDate()
    let fromDate = from ? moment(from).startOf('day')._d : moment().startOf('day')._d
    let tillDate = from ? moment(from).endOf('day')._d : moment().endOf('day')._d
    let query = {
        status: { $in: ['scheduled', 'rescheduled'] },
        from: {
            $gte: fromDate,
            $lt: tillDate
        }
    }

    let id = null
    let agent = null
    if (req.params.id !== 'my') {
        agent = await users.get(req.params.id, req.context)
    } else {
        agent = await users.get(id, req.context)
    }

    if (!agent) {
        throw new Error('agent not found')
    } else {
        req.context.agent = agent
    }

    let agentSchedule = await appointments.agentAppointments(query, req.context)

    log.end()
    return mapper.toSearchModel(agentSchedule)
}

exports.cancelAgentAppointment = async (req) => {
    let log = req.context.logger.start('api/appointments:cancelAgentAppointment')

    let agentId = req.params.id === 'my' ? null : req.params.id

    let agent = await users.get(agentId, req.context)

    if (!agent) {
        throw new Error('agent not found')
    }

    let data = {
        from: req.body.from,
        till: req.body.till,
        agentId: agent.id
    }

    req.context.processSync = true
    offline.queue('appointment', 'cancelAgentAppointment', data, req.context)

    log.end()
    return {
        message: `Appointments from: ${moment(data.from).format('MMMM Do YYYY, h:mm:ss a')} to till: ${moment(data.till).format('MMMM Do YYYY, h:mm:ss a')} process to cancel`
    }
}

exports.bulkUpdate = async (req) => {
    let log = req.context.logger.start('api/appointments:bulkUpdate')

    let items = req.body.items || []

    if (!items.length) {
        throw new Error('no appointment found')
    }

    for (let item of items) {
        let appointment = await appointments.getById(item.id, req.context)

        await appointments.update(item, appointment, req.context)
    }

    log.end()
    return 'appointments successfully updated'
}

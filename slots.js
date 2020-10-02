'use strict'
const logger = require('@open-age/logger')('slots')
let moment = require('moment-timezone')
let appointmentMapper = require('../mappers/appointment')
const availabilities = require('../services/availabilities')
const appointments = require('../services/appointments')
const dateHelper = require('../helpers/dates')

const generateTimeSlots = async (timeTable, gap) => { // timeTable is array of object having startTime and endTime
    let log = logger.start('generateTimeSlots') // gap is intervalTime gap

    let items = []

    timeTable.forEach(period => {
        let mins = moment(period.startTime, 'HH:mm:ss').diff(moment(period.endTime, 'HH:mm:ss')) / 60000

        let totalSlots = Math.abs(Math.trunc(mins / gap))
        let slot = 0

        let current = moment(period.startTime)

        while (slot < totalSlots) {
            let interval = {
                start: current.toISOString(),
                end: current.add(gap, 'minutes').subtract(1, 'second').toISOString(),
                status: 'available'
            }
            items.push(interval)
            current.add(1, 'second')
            slot++
        }
    })

    log.end()
    return items
}

const updatingTimeTableByDate = (timeTable, byDate) => {
    let log = logger.start('updating timeTable ...')

    timeTable.forEach((period) => {
        period.startTime = moment(byDate).set('hour', moment(period.startTime).hour())
            .set('minute', moment(period.startTime).minutes())
            .set('second', moment(period.startTime).seconds()).toDate()

        period.endTime = moment(byDate).set('hour', moment(period.endTime).hour())
            .set('minute', moment(period.endTime).minutes())
            .set('second', moment(period.endTime).seconds()).toDate()
    })

    log.end()
    return timeTable
}

const slotFilter = (slots) => {  // remove past-time blank slot
    return slots.filter((slot) => {
        if (moment(slot.end).isAfter(moment()) || slot.id) {
            return slot
        }
    })
}

const slotBlocker = (slots) => { // block past time blank slot
    return slots.map((slot) => {
        if (dateHelper.time(slot.start).lt(new Date()) || slot.id) {
            slot.status = 'booked'
        }
        return slot
    })
}

exports.search = async (req, res) => {
    let log = logger.start('api/slots:search')

    try {
        let availability

        if (req.query.availabilityId) {
            availability = await availabilities.getById(req.query.availabilityId)
        } else if (req.query.agent) {
            availability = await availabilities.getByAgent(req.query.agent)
        }

        if (!availability) {
            throw new Error('agent not found')
        }

        let agent = availability.agent

        let from = req.query.date || new Date()

        let day = moment(from).format('dddd').toLowerCase() // monday

        let timeTable = availability.schedule[day]

        timeTable = updatingTimeTableByDate(timeTable, moment(from).toDate())

        let timeSlots = await generateTimeSlots(timeTable, availability.appointment.duration)

        let agentAppointments = await appointments.agentAppointments({
            agent: agent,
            appointmentType: availability.type,
            from: {
                $gte: moment(from).startOf('day').toDate(),
                $lt: moment(from).endOf('day').toDate()
            },
            status: {
                $in: ['scheduled', 'rescheduled', 'visited']
            }
        }, req.context)

        if (agentAppointments.length) {
            agentAppointments.forEach((appointment) => {
                timeSlots.forEach((slot) => {
                    if (slot.status !== 'booked') {
                        if ((moment(appointment.from).isSame(slot.start, 'hh:mm:ss a') ||
                            moment(appointment.from).isBetween(slot.start, slot.end, 'hh:mm:ss a'))) {
                            slot.id = appointment.id
                            slot.visitor = appointment.visitor
                            slot.status = 'booked'
                            slot.agent = appointment.agent
                            slot.organization = appointment.organization
                        }
                    }
                })
            })
        }
        let items = req.context.organization ? slotFilter(timeSlots) : slotBlocker(timeSlots)
        return {
            items: appointmentMapper.toSearchModel(items),
            total: items.length
        }
    } catch (error) {
        log.error(error)
        res.failure(error)
    }
}

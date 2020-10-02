'use strict'

const logger = require('@open-age/logger')('appointment-types')
const appointmentTypes = require('../services/appointment-types')
const mapper = require('../mappers/appointment-type')
const db = require('../models')

exports.create = async (req, res) => {
    let log = logger.start('creating appointment-type...')

    let model = {
        name: req.body.name,
        purpose: req.body.purpose,
        maxQueueSize: req.body.maxQueueSize,
        availability: req.body.availability,
        status: req.body.status || 'active',
        agents: req.body.agents
    }

    if (!req.body.organization.id && req.body.organization.code) {
        model.organization = db.organization.findOne({ code: req.body.organization.code })
    } else {
        model.organization = req.body.organization.id
    }

    try {
        let appointmentType = await appointmentTypes.create(model, req.context)
        return res.data(mapper.toModel(appointmentType))
    } catch (err) {
        log.error(err)
        return res.failure
    }
}

exports.update = async (req, res) => {
    let log = logger.start('update appointment-type...')

    let model = req.body

    try {
        let appointmentType = await appointmentTypes.getById(req.params.id, req.context)

        if (model.code) {
            let sameappointmentType = await db.appointmentType.findOne({ code: model.code }, { organization: appointmentType.organization })

            if (sameappointmentType) { throw new Error('appointment-type already exist') }
        }

        let updatedappointmentType = await appointmentTypes.update(appointmentType, model, req.context)

        return res.data(mapper.toModel(updatedappointmentType))
    } catch (error) {
        log.error(error)
        res.failure(error)
    }
}

exports.get = async (req, res) => {
    let log = logger.start('get')

    try {
        let appointmentType = await appointmentTypes.getById(req.params.id, req.context)

        return res.data(mapper.toModel(appointmentType))
    } catch (error) {
        log.error(error)
        res.failure(error)
    }
}

exports.search = async (req, res) => {
    let log = logger.start('api/appointment-types:search')
    let query = {}

    if (req.query.organizationId) {
        query.organization = req.query.organizationId.isObjectId()
            ? await db.organization.findById(req.query.organizationId)
            : await db.organization.findOne({ code: req.query.organizationId })
    }

    if (req.query.code) {
        query.name = req.query.code
    }

    db.appointmentType.find(query)
        .then((appointmentTypes) => {
            log.debug(`${appointmentTypes}`)
            log.end()
            return res.page(mapper.toSearchModel(appointmentTypes))
        }).catch((err) => {
            log.end()
            res.failure(err)
        })
}

'use strict'
const db = require('../models')
const mapper = require('../mappers/queue')

exports.create = async (req, res) => {
    let model = req.body

    var data = {
        data: model.date,
        currentToken: model.currentToken,
        lastToken: model.lastToken,
        type: model.type,
        status: model.status,
        agents: model.agents,
        organization: model.organization
    }

    try {
        let queue = await new db.queue(data).save()

        return res.data(mapper.toModel(queue))
    } catch (error) {
        return res.failure(error)
    }
}

'use strict'

let db = global.db

let mapper = require('../mappers/identity')

let createIdentity = data => {
    return new db.identityType(data)
        .save()
}

exports.create = async (req) => {
    let orgCode = req.headers['org-code'].toLowerCase()
    let model = req.body

    let org = await db.organization.findOne({ code: orgCode })
    if (!org) {
        throw new Error(' org-code does not exist')
    }

    let identity = await createIdentity({
        name: model.name,
        organization: org.id
    })
    return mapper.toModel(identity)
}

exports.update = async (req, res) => {
    let model = req.body

    var data = {
        name: model.name
    }

    var query = {}

    query._id = req.params.id

    let identity = db.identityType.findOneAndUpdate(query, data, { new: true })

    return mapper.toModel(identity)
}

exports.search = (req, res) => {
    var query = {}
    query.organization = req.org.id
    var filters = {
        name: req.query.identityName || ''

    }

    if (filters.name) {
        query.name = { $regex: '.*' + filters.name + '.*' }
    }

    db.identityType.find(query)
        .then(identities => {
            res.page(mapper.toSearchModel(identities))
        })
        .catch(err => {
            res.failure(err)
        })
}

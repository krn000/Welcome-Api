'use strict'
let db = global.db
let mapper = require('../mappers/organization')
var uuid = require('uuid')

let createOrg = data => {
    return new db.organization(data)
        .save()
}

exports.create = (req, res) => {
    let model = req.body
    if (!model.code || !model.name) {
        return res.failure('organization code and name is needed')
    }

    var data = {
        code: model.code,
        name: model.name,
        externalUrl: model.externalUrl,
        activationKey: uuid.v()
    }
    createOrg(data)
        .then(org => {
            res.data(mapper.toModel(org))
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.update = (req, res) => {
    let model = req.body
    if (!model.code || !model.name) {
        throw new Error('organization code and name is needed')
    }

    var data = {
        code: model.code,
        name: model.name
    }

    var query = {}

    query._id = req.params.id

    db.organization.findOneAndUpdate(query, data, { new: true })
        .then(org => {
            res.data(mapper.toModel(org))
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.get = (req, res) => {
    db.organization.find()
        .then(organization => {
            return res.page(mapper.toSearchModel(organization))
        })
        .catch(err => {
            res.failure(err)
        })
}

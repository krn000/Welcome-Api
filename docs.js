'use strict'

const fs = require('fs')
const documents = require('../services/documents')

exports.getByDataId = function (req, res) {
    documents.getPdfByDataId(req.params.dataId, req.params.code, req.context).then(buffer => {
        res.contentType('application/pdf')
        res.header('Content-disposition', `inline; filename=${req.params.code}-${req.params.dataId}.pdf`)
        res.send(buffer)
    }).catch(err => res.failure(err))
}

exports.getByModel = function (req, res) {
    documents.getPdfByModel(req.body, req.params.code, req.context).then(buffer => {
        res.contentType('application/pdf')
        res.header('Content-disposition', `inline; filename=${req.params.code}.pdf`)
        res.send(buffer)
    }).catch(err => res.failure(err))
}

exports.createPreview = async (req) => {
    return documents.getDocByModel(req.body, req.params.code, req.context)
}

exports.getDocxByModel = (req, res) => {
    documents.getDocxByModel(req.body, req.params.code, req.context).then(file => {
        res.download(file.path, (err) => {
            if (err) {
                throw new Error(err)
            }

            fs.unlinkSync(file.path)
        })
    }).catch(err => res.failure(err))
}

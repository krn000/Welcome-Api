'use strict'

var mongoose = require('mongoose')

module.exports = {
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'provider'
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tenant'
    },
    status: {
        type: String,
        default: 'enabled',
        enum: ['active', 'enabled', 'disabled']
    },
    config: Object,
    category: String
}

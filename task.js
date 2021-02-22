'use strict'
var mongoose = require('mongoose')
module.exports = {
    date: Date,
    entity: {
        id: String,
        name: String,
        type: { type: String }
    },
    data: Object,

    progress: Number,
    error: Object,

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
        enum: ['new', 'invalid', 'in-progress', 'aborted', 'canceled', 'done', 'erro']
    }
}

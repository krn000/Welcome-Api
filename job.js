'use strict'
var mongoose = require('mongoose')
module.exports = {
    code: String,
    name: String,
    processor: String,
    periodicity: {
        expression: String,
        type: {
            type: String,
            default: 'daily',
            enum: ['daily', 'weekly', 'monthly', 'yearly']
        },
        period: Number,
        start: Date,
        end: Date
    },
    schedule: {
        hour: Number,
        minute: Number
    },
    dataSource: Object,
    config: Object,

    last: {
        time: Date,
        status: String,
        error: Object
    },

    next: {
        time: Date,
        status: String
    },

    template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'template'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
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
        default: 'active',
        enum: ['active', 'inactive']
    }
}

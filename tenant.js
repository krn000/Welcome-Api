'use strict'
var mongoose = require('mongoose')
module.exports = {
    code: { type: String, lowercase: true },
    name: String,
    channels: {
        sms: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'channel'
        },
        email: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'channel'
        },
        push: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'channel'
        },
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'channel'
        }
    },
    config: Object,
    notifications: {
        enabled: { type: Boolean, default: true },
        snooze: Date,
        refusals: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'template'
        }]
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive']
    }
}

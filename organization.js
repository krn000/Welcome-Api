'use strict'
var mongoose = require('mongoose')
module.exports = {
    code: { type: String, lowercase: true },
    name: String,
    shortName: String,
    type: String,
    email: String,
    phone: String,
    logo: {
        url: String,
        thumbnail: String
    },
    address: {
        line1: String,
        line2: String,
        district: String,
        city: String,
        state: String,
        pinCode: String,
        country: String
    },
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
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tenant'
    },
    status: {
        type: String,
        default: 'active',
        enum: ['new', 'active', 'inactive']
    }
}

'use strict'
var mongoose = require('mongoose')
module.exports = {
    tackingId: String,
    role: {
        id: String,
        key: String,
        code: String,
        permissions: [{
            type: String
        }]
    },
    email: String,
    phone: String,
    code: String,
    profile: {
        firstName: String,
        lastName: String,
        gender: String,
        dob: Date,
        pic: {
            url: String,
            thumbnail: String
        }
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
    config: Object,
    status: String,
    chat: {
        id: Number,
        key: String,
        statusMessage: String
    },
    devices: [{
        id: String,
        name: String,
        status: {
            type: String,
            default: 'active',
            enum: ['active', 'inactive']
        }
    }],
    notifications: {
        enabled: { type: Boolean, default: true },
        snooze: Date,
        refusals: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'template'
        }]
    },

    lastSeen: Date,
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}

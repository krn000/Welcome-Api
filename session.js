'use strict'
var mongoose = require('mongoose')

module.exports = {
    purpose: String, // login
    device: String, // machine name
    status: {
        type: String,
        default: 'new',
        enum: [
            'active', 'expired', 'awaiting'
        ]
    },
    app: String, // dashboard
    role: {
        id: String
    },
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'appointment'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
}

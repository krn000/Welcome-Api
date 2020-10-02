'use strict'
var mongoose = require('mongoose')
module.exports = {
    name: { type: String, required: true }, // dental-opd
    purpose: String, // Dental OPD
    maxQueueSize: Number, // max no of patients that can be served
    schedule: {
        monday: {
            startTime: Date,
            endTime: Date
        },
        tuesday: {
            startTime: Date,
            endTime: Date
        },
        wednesday: {
            startTime: Date,
            endTime: Date
        },
        thursday: {
            startTime: Date,
            endTime: Date
        },
        friday: {
            startTime: Date,
            endTime: Date
        },
        saturday: {
            startTime: Date,
            endTime: Date
        },
        sunday: {
            startTime: Date,
            endTime: Date
        }
    },
    closedOn: [{ // Holidays
        date: Date,
        reason: String
    }],
    status: {
        type: String,
        enum: [
            'active', 'inactive'
        ]
    },

    agents: [{ // list of agents who may provide the services of this queue
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],

    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    }
}

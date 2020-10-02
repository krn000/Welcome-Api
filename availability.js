'use strict'
var mongoose = require('mongoose')
module.exports = {
    type: { // OPD, OT
        type: mongoose.Schema.Types.ObjectId,
        ref: 'appointmentType',
        required: [true, 'appointment-type required']
    },
    agent: { // Doctor, Principle
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: [true, 'agent required']
    },
    appointment: {
        duration: Number, // in minutes
        fee: String       //price
    },
    bap: {
        id: String
    },
    appointmentFee: String,  //TODO: obsolete
    periodicity: {
        period: Number, // 1
        type: {
            type: String,
            enum: [
                'day', 'week', 'month', 'year'
            ]
        },
        startDate: Date,
        count: Date,
        endDate: Date
    },
    status: {
        type: String,
        enum: ['active', 'de-active']
    },
    schedule: {
        monday: [{
            startTime: Date, // time
            endTime: Date
        }],
        tuesday: [{
            startTime: Date, // time
            endTime: Date
        }],
        wednesday: [{
            startTime: Date, // time
            endTime: Date
        }],
        thursday: [{
            startTime: Date, // time
            endTime: Date
        }],
        friday: [{
            startTime: Date, // time
            endTime: Date
        }],
        saturday: [{
            startTime: Date, // time
            endTime: Date
        }],
        sunday: [{
            startTime: Date, // time
            endTime: Date
        }],
        activeCamps: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'camp'
        }]
    }
}

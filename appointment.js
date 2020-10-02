'use strict'
var mongoose = require('mongoose')
module.exports = {
    purpose: String, // Root Canal Treatment
    from: Date,
    till: Date,
    startTime: Date, // the actual time when the appointment started
    endTime: Date, // the actual time when the appointment ended
    duration: Number,
    meta: Object,
    data: {},
    provider: String,
    agent: { // Doctor, Principle
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    agentName: String,
    visitors: [{ // Patient, Student, Candidate
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    visitorsName: [String],
    token: {
        no: String,
        queue: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'queue'
        }
    },
    camp: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'camp'
    },
    status: {
        type: String,
        enum: ['scheduled', 'rescheduled', 'visited', 'closed', 'cancelled', 'failed', 'draft', 'expired']
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    appointmentType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'appointmentType'
    },
    invoices: [{
        id: String,
        visitor: { // Patient, Student, Candidate
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    }]
}

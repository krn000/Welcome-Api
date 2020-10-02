'use strict'
var mongoose = require('mongoose')
module.exports = {
    name: String,
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
    startTime: Date, // time    endTime: Date, // time
    agents: [{ // list of agents who may provide the services of this queue
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    }
}

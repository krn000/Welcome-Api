'use strict'
var mongoose = require('mongoose')
module.exports = {
    name: String,
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    }
}

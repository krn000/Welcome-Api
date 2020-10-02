'use strict'

const mongoose = require('mongoose')

module.exports = {
    code: { type: String, lowercase: true },
    name: String,
    shortName: String,
    logo: {
        url: String,
        thumbnail: String
    },
    config: Object,
    services: [{
        logo: String,
        code: String,
        name: String,
        url: String, // api root url
        hooks: {
            project: {
                onCreate: String,
                onUpdate: String,
                onDelete: String
            },
            task: {
                onCreate: String,
                onUpdate: String,
                onDelete: String
            }
        }
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    meta: Object,
    status: {
        type: String,
        default: 'active',
        enum: ['new', 'active', 'inactive']
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tenant'
        //    required: true TODO: add tenant to prod
    }
}

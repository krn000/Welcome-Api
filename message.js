'use strict'
var mongoose = require('mongoose')
module.exports = {
    subject: String,
    body: String,
    date: Date,
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    to: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        deliveredOn: Date,
        viewedOn: Date,
        processedOn: Date,
        archivedOn: Date
    }],
    modes: {
        sms: Boolean,
        email: Boolean,
        chat: Boolean,
        push: Boolean
    },
    priority: {
        type: String,
        default: 'medium',
        enum: ['low', 'medium', 'high']
    },
    attachments: [{
        mimeType: String,
        thumbnail: String,
        description: String,
        url: String,
        filename: String,
        content: mongoose.Schema.Types.Mixed
    }],
    data: Object,
    meta: Object,
    isHidden: Boolean,
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'conversation'
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tenant'
    },
    status: {
        type: String,
        default: 'queued',
        enum: ['queued', 'delivered', 'viewed', 'processed', 'archived']
    },
    externalId: {
        type: String,
        default: null
    }
}

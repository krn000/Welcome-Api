'use strict'
var mongoose = require('mongoose')
module.exports = {
    code: String,
    name: String,
    subject: String,
    body: String,
    config: Object,

    dataSource: {
        type: { type: String }, // 'http' | 'file' | 'mysql' | 'mongodb' | 'mssql',
        connectionString: String,
        meta: Object, // headers in case of http
        config: Object,
        params: [{ key: String, value: String }], // includes dataId
        field: String // the field in response object that has data
    },

    attachment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'template'
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
        default: 'active',
        enum: ['active', 'inactive']
    },

    isPublic: {
        type: Boolean,
        default: false
    },

    thumbnail: String,

    logo: String, // logo of tenant or organization
    dp: String, // dispaly picture of user
    isHidden: Boolean, // For hidden operations
    category: String,
    actions: [{
        label: String, // 'view'
        type: { type: String }, // 'button' input methods
        operation: String, // 'httpGET,POST' 'intent',
        data: Object,
        await: Boolean // to wait for response
    }]
}

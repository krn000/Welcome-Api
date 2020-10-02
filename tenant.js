const mongoose = require('mongoose')

module.exports = {
    code: { type: String, lowercase: true },
    name: String,
    logo: {
        url: String,
        thumbnail: String
    },
    config: Object,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
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
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive']
    }
}

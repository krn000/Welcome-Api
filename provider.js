'use strict'

module.exports = {
    code: String, // twilio, way2sms, slack
    name: String,
    url: String,
    description: String,
    category: {
        type: String,
        enum: ['sms', 'email', 'chat', 'push']
    },
    discoverable: Boolean,
    picUrl: String,
    parameters: [{
        name: String,
        title: String,
        type: {
            type: String,
            default: 'string'
        },
        description: String,
        validators: {
            type: [String],
            default: []
        },
        options: {
            type: [String],
            default: []
        }
    }]
}

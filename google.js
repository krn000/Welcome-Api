'use strict'

const logger = require('@open-age/logger')('providers/google')
var Client = require('node-rest-client').Client
var client = new Client()

const captcha = (token) => {
    return new Promise((resolve, reject) => {
        return client.post('https://www.google.com/recaptcha/api/siteverify', {
            data: {
                secret: '',
                response: token,
                remoteip: '' // optional
            }
        }, (err, response) => {
            if (err) {
                return reject(err)
            }
            if (!response && !response.success) {
                return reject()
            }
            return resolve(response)
        })
    })
}

exports.verifyCaptcha = captcha

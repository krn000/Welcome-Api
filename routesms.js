'use strict'
var HttpClient = require('node-rest-client').Client
var logger = require('@open-age/logger')('providers/routesms')

var send = async (message, to, config) => {
    var log = logger.start('send')

    const mobile = to.phone || to
    log.info({
        message: message.subject,
        mobile: mobile
    })
    var http = new HttpClient()
    return new Promise((resolve) => {
        http.get(`${config.url}?username=${config.userName}&password=${config.password}&type=${config.type}&dlr=${config.dlr}&destination=${mobile}&source=${config.source}&message=${message.subject}`, function (data) {
            log.debug(data)
            resolve(true)
        })
    })
}
exports.config = function (config) {
    return {
        send: async (message, to) => {
            return send(message, to, config)
        }
    }
}

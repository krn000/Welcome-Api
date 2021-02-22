'use strict'
const fs = require('fs')
const join = require('path').join
const camelCase = require('camel-case')
const services = {}

const init = function () {
    fs.readdirSync(__dirname).forEach(function (file) {
        if (file.indexOf('.js') && file.indexOf('index.js') < 0) {
            var name = camelCase(file.substring(0, file.indexOf('.js')))
            services[name] = require('./' + file)
        }
    })
}

init()

module.exports = services

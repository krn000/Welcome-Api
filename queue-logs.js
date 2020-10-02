'use strict'
const mongoose = require('mongoose')

module.exports = {
    entity: String,
    action: String,
    data: Object,
    context: Object
}

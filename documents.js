'use strict'
const fs = require('fs')
const path = require('path')
const appRoot = require('app-root-path')
const HtmlDocx = require('html-docx-js')
const pdf = require('html-pdf')
const dataSources = require('../helpers/data-sources')
const formatter = require('../helpers/template').formatter
const templateService = require('./templates')
const fileStore = require('config').get('file-store')

const extractContext = (context) => {
    const pic = (item) => {
        item = item || {}
        return {
            url: item.url,
            thumbnail: item.thumbnail
        }
    }

    const result = {}

    if (context.tenant) {
        result.tenant = {
            id: context.tenant.id,
            code: context.tenant.code,
            name: context.tenant.name,
            logo: pic(context.tenant.logo)
        }
    }

    if (context.organization) {
        result.organization = {
            id: context.organization.id,
            code: context.organization.code,
            shortName: context.organization.shortName,
            name: context.organization.name,
            logo: pic(context.organization.logo),
            address: {}
        }

        if (context.organization.address) {
            result.organization.address = {
                line1: result.organization.address.line1,
                line2: result.organization.address.line2,
                district: result.organization.address.district,
                city: result.organization.address.city,
                state: result.organization.address.state,
                pinCode: result.organization.address.pinCode,
                country: result.organization.address.country
            }
        }
    }

    if (context.user) {
        result.user = {
            id: context.user.id,
            code: context.user.code,
            email: context.user.email,
            phone: context.user.phone,
            profile: {
                firstName: context.user.profile.firstName,
                lastName: context.user.profile.lastName,
                pic: pic(context.user.profile.pic)
            },
            role: {
                id: context.user.role.id
            }
        }
    }

    return result
}

const builder = (template, context) => {
    const subjectFormatter = formatter(template.subject || '')
    const bodyFormatter = formatter(template.body || '')
    return {
        inject: (data) => {
            data.context = extractContext(context)
            return {
                name: subjectFormatter.inject(data),
                content: bodyFormatter.inject(data)
            }
        },
        toPdf: (data) => {
            data.context = extractContext(context)
            const content = bodyFormatter.inject(data)
            return pdf.create(content, template.config)
        }
    }
}

exports.getPdfByDataId = async (dataId, code, context) => {
    const template = await templateService.get(code, context)

    const model = {
        dataSource: template.dataSource || {}
    }

    model.dataSource.params = dataSource.params || []
    model.dataSource.params.push({
        key: 'dataId',
        value: dataId
    })

    const items = await dataSources.fetch(model, context)

    return new Promise((resolve, reject) => {
        builder(template, context).toPdf(items[0]).toBuffer((err, buffer) => {
            if (err) {
                return reject(err)
            }
            resolve(buffer)
        })
    })
}

exports.getPdfByModel = async (model, code, context) => {
    const template = await templateService.get(code, context)

    const items = await dataSources.fetch(model, context)

    return new Promise((resolve, reject) => {
        builder(template, context).toPdf(items[0]).toBuffer((err, buffer) => {
            if (err) {
                return reject(err)
            }
            resolve(buffer)
        })
    })
}

exports.getDocByModel = async (model, code, context) => {
    const template = await templateService.get(code, context)

    const items = await dataSources.fetch(model, context)
    return builder(template, context).inject(items[0])
}

exports.getDocByTemplate = async (data, template, context) => {
    return builder(template, context).inject(data)
}

exports.getDocxByModel = async (model, code, context) => {
    const template = await templateService.get(code, context)

    const items = await dataSources.fetch(model, context)

    const fileName = `${Date.now()}.doc`
    const destination = path.join(appRoot.path, `${fileStore.dir}/${fileName}`)

    return new Promise((resolve, reject) => {
        const docxTemplate = builder(template, context).toPdf(items[0])
        const docx = HtmlDocx.asBlob(docxTemplate.html)

        fs.writeFile(destination, docx, function (err) {
            if (err) {
                return reject(err)
            }
            return resolve({ path: destination })
        })
    })
}

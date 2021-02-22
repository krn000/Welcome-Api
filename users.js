'use strict'
const db = require('../models')
const directory = require('@open-age/directory-client')

const validator = require('validator')

const tenantService = require('./tenants')
const organizationService = require('./organizations')
const populate = 'organization tenant'

const set = async (model, entity, context) => {
    if (model.status) {
        entity.status = model.status
    }

    if (model.email && validator.isEmail(model.email)) {
        entity.email = model.email.toLowerCase().replace(' ', '')
    }

    if (model.phone && validator.isMobilePhone(model.phone, 'any')) {
        entity.phone = model.phone.trim().replace(' ', '')
    }

    if (model.userId || model.trackingId) {
        entity.trackingId = model.userId || model.trackingId
    }

    if (model.code && entity.code !== model.code.toLowerCase()) {
        entity.code = model.code.toLowerCase()
    }

    if (model.profile) {
        entity.profile = entity.profile || {}
        entity.profile.firstName = model.profile.firstName
        entity.profile.lastName = model.profile.lastName
        entity.profile.gender = model.profile.gender
        entity.profile.dob = model.profile.dob
        model.profile.pic = model.profile.pic || {}
        entity.profile.pic = {
            url: model.profile.pic.url,
            thumbnail: model.profile.pic.thumbnail
        }
    }

    if (model.address) {
        entity.address.line1 = model.address.line1
        entity.address.line2 = model.address.line2
        entity.address.district = model.address.district
        entity.address.city = model.address.city
        entity.address.state = model.address.state
        entity.address.pinCode = model.address.pinCode
        entity.address.country = model.address.country
    }

    if (model.role) {
        entity.role = entity.role || {}
        if (entity.role.id && model.role.id && model.role.id !== entity.role.id) {
            // role id cannot be changed
            throw new Error('ID_IMMUTABLE')
        } else if (!entity.role.id && model.role.id) {
            entity.role.id = model.role.id
        }
        if (model.role.key) {
            entity.role.key = model.role.key
        }

        if (model.role.code) {
            entity.role.code = model.role.code
        }

        if (model.role.permissions) {
            entity.role.permissions = model.role.permissions
        }
    }
    if (model.chat) {
        entity.chat = entity.chat || {}

        if (model.chat.id) {
            entity.chat.id = model.chat.id
        }

        if (model.chat.key) {
            entity.chat.key = model.chat.key
        }

        if (model.chat.statusMessage) {
            entity.chat.statusMessage = model.chat.statusMessage
        }
    }

    if (model.devices && model.devices.length) {
        model.devices.forEach(deviceModel => {
            let device = entity.devices.find(item => item.id === deviceModel.id)
            if (!device) {
                device = {
                    id: deviceModel.id, // firebase or one signal token
                    name: deviceModel.name,
                    status: deviceModel.status || 'active'
                }
                entity.devices.push(device)
            }

            device.name = deviceModel.name
            device.status = deviceModel.status || 'active'
        })
    }

    if (model.notifications) {
        if (model.notifications.enabled !== undefined) {
            entity.notifications.enabled = model.notifications.enabled
        }

        if (model.notifications.snooze) {
            entity.notifications.snooze = model.notifications.snooze
        }

        if (model.notifications.refusals && model.notifications.refusals.length) {
            model.notifications.refusals.forEach(refusal => {
                const refused = entity.notifications.refusals.find(item => item === refusal)
                if (!refused) {
                    model.notifications.refusals.push(refusal)
                }
            })
        }
    }
}

const getFromDirectory = async (query, context) => {
    const role = await directory.roles.get(query, context)

    if (!role) {
        return
    }

    let user = await db.user.findOne({
        'role.id': role.id
    }).populate(populate)

    if (!user) {
        user = new db.user({
            role: {
                id: role.id
            },
            status: 'new'
        })

        if (role.tenant) {
            user.tenant = await tenantService.get({
                code: role.tenant.code
            }, context)

            if (!user.tenant) {
                user.tenant = await tenantService.create(role.tenant, context)
            }

            await context.setTenant(user.tenant)
        }

        if (role.organization) {
            user.organization = await organizationService.get({
                code: role.organization.code
            }, context)

            if (!user.organization) {
                user.organization = await organizationService.create(role.organization, context)
            }

            await context.setOrganization(user.organization)
        }
    }

    const model = {
        role: {
            id: role.id,
            code: role.code,
            key: role.key,
            permissions: role.permissions
        },
        code: role.code,
        email: role.email,
        phone: role.phone,
        profile: role.profile,
        status: role.status
    }

    if (role.user) {
        model.phone = model.phone || role.user.phone
        model.email = model.email || role.user.email
        model.status = model.status || role.user.status
        if (role.user.profile) {
            model.profile = role.user.profile
        }
    }

    if (role.employee) {
        model.tackingId = role.employee.id
        model.profile = role.employee.profile || model.profile
        model.designation = role.employee.designation
        model.department = role.employee.department
        model.division = role.employee.division
        model.phone = role.employee.phone || model.phone
        model.email = role.employee.email || model.email
        model.code = role.employee.code || model.code
        model.type = 'employee'
    } else if (role.student) {
        model.tackingId = role.student.id
        model.profile = role.student.profile || model.profile
        model.designation = role.student.batch
        model.department = role.student.course
        model.division = role.student.institute
        model.phone = role.student.phone || model.phone
        model.email = role.student.email || model.email
        model.code = role.student.code || model.code
        model.type = 'student'
    }

    await set(model, user, context)

    return user.save()
}

const getByCode = async (code, context) => {
    context.logger.start('services/users:getByCode')

    let user = await db.user.findOne({
        code: code.toLowerCase(),
        tenant: context.tenant,
        organization: context.organization
    }).populate(populate)

    if (!user) {
        user = await db.user.findOne({
            'role.code': code.toLowerCase(),
            tenant: context.tenant,
            organization: context.organization
        }).populate(populate)

        if (user) {
            user.code = user.role.code
            await user.save()
        }
    }

    if (user) { return user }

    return getFromDirectory(code, context)
}

const getByRoleId = async (roleId, context) => {
    context.logger.start('services/users:getById')

    const user = await db.user.findOne({
        'role.id': roleId
    }).populate(populate)

    if (user) { return user }

    return getFromDirectory(roleId, context)
}

const getByKey = async (roleKey, context) => {
    context.logger.start('services/users:getByKey')

    const user = await db.user.findOne({
        'role.key': roleKey
    }).populate(populate)

    if (user) { return user }

    return getFromDirectory(roleKey, context)
}

const getByEmail = async (email, context) => {
    context.logger.start('services/users:getByEmail')

    let user = await db.user.findOne({
        email: email.toLowerCase(),
        organization: context.organization,
        tenant: context.tenant
    }).populate(populate)

    if (user) { return user }

    try {
        user = await getFromDirectory(email, context)
    } catch (err) {
        context.logger.debug(err)
    }

    if (user) { return user }

    user = await (new db.user({
        role: {},
        code: email,
        email: email,
        profile: {},
        address: {},
        devices: [],
        tenant: context.tenant,
        organization: context.organization,
        status: 'temp'
    }).save())

    return user
}

const getByPhone = async (phone, context) => {
    context.logger.start('services/users:getByPhone')

    let user = await db.user.findOne({
        phone: phone,
        organization: context.organization,
        tenant: context.tenant
    }).populate(populate)

    if (user) { return user }

    user = await getFromDirectory(phone, context)

    if (user) { return user }

    user = await (new db.user({
        role: {},
        code: phone,
        phone: phone,
        profile: {},
        address: {},
        devices: [],
        tenant: context.tenant,
        organization: context.organization,
        status: 'temp'
    }).save())

    return user
}

exports.create = async (model, context) => {
    let user = await this.get(model, context)

    if (!user) {
        user = new db.user({
            role: {},
            profile: {},
            address: {},
            devices: [],
            notifications: context.organization ? context.organization.notifications : context.tenant.notifications,
            tenant: context.tenant,
            organization: context.organization,
            status: 'new'
        })
    }

    await set(model, user, context)
    return user.save()
}

exports.update = async (id, model, context) => {
    const entity = await this.get(id, context)
    await set(model, entity, context)
    return entity.save()
}

exports.get = async (query, context) => {
    if (typeof query === 'string') {
        if (query === 'my') {
            return context.user
        } else if (query === 'system' && context.tenant.owner) {
            return db.user.findById(context.tenant.owner).populate(populate)
        } else if (query.isObjectId()) {
            return db.user.findById(query).populate(populate)
        } else if (query.isUUID()) {
            return getByKey(query, context)
        } else if (query.isEmail()) {
            return getByEmail(query, context)
        } else if (query.isPhone()) {
            return getByPhone(query, context)
        } else {
            return getByCode(query, context)
        }
    }

    if (query._doc) {
        return query
    }

    if (query.id) {
        if (query.id === 'my') {
            return context.user
        }
        return db.user.findById(query.id).populate(populate)
    }

    if (query.role && query.role.id) {
        return getByRoleId(query.role.id, context)
    }

    let user

    if (query.trackingId) {
        user = await db.user.findOne({
            trackingId: query.trackingId,
            tenant: context.tenant,
            organization: context.organization
        }).populate(populate)
    }

    if (!user && query.code) {
        if (query.code === 'my') {
            return context.user
        } else if (query.code === 'system' && context.tenant.owner) {
            return db.user.findById(context.tenant.owner).populate(populate)
        }
        user = await getByCode(query.code, context)
    }

    if (!user && query.email) {
        user = await getByEmail(query.email, context)
    }

    if (!user && query.phone) {
        user = await getByPhone(query.phone, context)
    }

    return user
}

exports.search = async (query, page, context) => {
    const where = {
        tenant: context.tenant,
        organization: context.organization
    }

    if (query.text) {
        if (validator.isEmail(query.text)) {
            where.email = query.text.toLowerCase()
        } else if (validator.isMobilePhone(query.text)) {
            where.phone = query.text.trim().replace(' ', '')
        }
    }

    return {
        items: await (page ? db.user.find(where).skip(page.skip).limit(page.limit) : db.user.find(where)),
        count: await db.user.count(where)
    }
}

exports.getMyUsers = async (query, context) => {
    const where = {
        tenant: context.tenant
    }

    if (query.to) {
        if (validator.isEmail(query.to)) {
            where.email = query.to.toLowerCase()
        }
    }

    return {
        items: await db.user.find(where),
        count: await db.user.count(where)
    }
}

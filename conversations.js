const db = require('../models')
const userService = require('./users')
const channels = require('./channels')

const set = async (model, entity, context) => {
    if (model.name) {
        entity.name = model.name
    }

    if (model.description) {
        entity.description = model.description
    }

    if (model.pic) {
        entity.pic = {
            url: model.pic.url,
            thumbnail: model.pic.thumbnail
        }
    }

    if (model.isPublic !== undefined) {
        entity.isPublic = model.isPublic
    }

    if (model.category) {
        entity.category = model.category
    }

    if (model.status) {
        entity.status = model.status
    }

    if (model.config) {
        entity.config = model.config
    }

    if (model.lastMessage) {
        entity.lastMessage = model.lastMessage
    }
}
exports.search = async (query, page, context) => {
    let where

    if (context.tenant) {
        query.tenant = context.tenant
    }

    if (query.entity) {
        where = {
            'entity.id': query.entity.id,
            'entity.type': query.entity.type.toLowerCase()
        }
    }
    if (query.userRoleId) {
        const user = await userService.getByRoleId(query.userRoleId, context)
        if (user) {
            if (where) { where.participants = [user, context.user] } else {
                where = {
                    participants: [user, context.user]
                }
            }
        }
    }
    if (query.user) {
        if (query.user === 'me' || query.user === 'my') {
            if (where) {
                where.participants = {
                    $all: [context.user]
                }
            } else {
                where = {
                    participants: {
                        $all: [context.user]
                    }
                }
            }
        }
    }
    const sort = {
        timeStamp: -1
    }
    if (query.type) {
        if (where) { where.type = query.type } else {
            where = {
                type: query.type
            }
        }
    }

    if (!page || !page.limit) {
        return {
            items: await db.conversation.find(where).sort(sort).populate('participants owner lastMessage'),
            count: await db.conversation.count(where)
        }
    }

    return {
        items: await db.conversation.find(where).sort(sort).limit(page.limit).skip(page.skip).populate('participants owner lastMessage'),
        count: await db.conversation.count(where)
    }
}

exports.update = async (query, model, context) => {
    const entity = await exports.get(query, context)
    await set(model, entity, context)
    return entity.save()
}

exports.get = async (query, context) => {
    if (!query) {
        return
    }

    if (query._bsontype === 'ObjectID') {
        query = {
            id: query.toString()
        }
    }
    if (typeof query === 'string' && query.isObjectId()) {
        return db.conversation.findById(query).populate('participants owner lastMessage')
    }

    if (query._doc) {
        return query
    }

    if (query.id) {
        return db.conversation.findById(query.id).populate('participants owner lastMessage')
    }

    if (query.entity) {
        return exports.getEntityConversation(query, context)
    }

    if (query.user) {
        return exports.getDirectConversation(query.user, context)
    }

    return null
}

exports.addParticipant = async (conversation, user, context) => {
    const entity = await exports.get(conversation, context)

    if (!entity) {
        throw new Error('CONVERSATION_IS_INVALID')
    }

    user = await userService.get(user, context)

    if (entity.participants.find(p => p.id === user.id)) {
        throw new Error('CONVERSATION_ALREADY_JOINED')
    }

    entity.participants.push(user)
    return entity.save()
}

exports.removeParticipant = async (conversation, user, context) => {
    const entity = await exports.get(conversation, context)

    if (!entity) {
        throw new Error('CONVERSATION_IS_INVALID')
    }

    user = await userService.get(user, context)

    if (!entity.participants.find(p => p.id === user.id)) {
        throw new Error('CONVERSATION_ALREADY_REMOVED')
    }

    entity.participants = entity.participants.filter(p => p.id !== user.id)
    return entity.save()
}

exports.getEntityConversation = async (model, context) => {
    const entity = model.entity

    let conversation = await db.conversation.findOne({
        type: 'entity',
        'entity.id': `${entity.id}`.toLowerCase(),
        'entity.type': entity.type.toLowerCase()
    }).populate('participants owner lastMessage')

    if (!conversation) {
        conversation = new db.conversation({
            name: entity.name || entity.type,
            entity: {
                id: `${entity.id}`.toLowerCase(),
                type: entity.type.toLowerCase(),
                name: entity.name
            },
            config: model.config,
            type: 'entity',
            tenant: context.tenant,
            organization: context.organization
        })
        await conversation.save()
    }

    return conversation
}

exports.getDirectConversation = async (user, context) => {
    user = await userService.get(user, context)

    let baseConversation = {
        type: 'direct',
        participants: { $all: [user, context.user] }
    }

    conversation = await db.conversation.findOne(baseConversation).populate('participants owner lastMessage')

    if (!conversation) {
        baseConversation = {
            type: 'direct',
            participants: [user, context.user]
        }
        conversation = new db.conversation(baseConversation)
        await conversation.save()
    }

    return conversation
}

exports.createGroupConversation = async (name, users, context) => {
    if (!Array.isArray(users)) {
        users = [users]
    }
    users.push(context.user)

    const conversation = new db.conversation({
        name: name,
        type: 'group',
        participants: users,
        owner: context.user,
        tenant: context.tenant
    })

    await conversation.save()
    return conversation
}

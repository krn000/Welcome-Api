'use strict'
exports.toModel = (entity, context) => {
    const model = {
        total: entity.total,
        unread: entity.unread,
        actions: entity.actions,
        messages: []
    }

    if (entity.messages && entity.messages.length) {
        entity.messages.forEach(message => {
            model.messages.push({
                id: message.id,
                code: message.code,
                name: message.name,
                title: message.title,
                subject: message.subject,
                body: message.body,
                priority: message.priority,
                category: message.category,
                deliveredOn: message.deliveredOn,
                viewedOn: message.viewedOn,
                archivedOn: message.archivedOn,
                processedOn: message.processedOn,
                status: message.status,
                meta: message.meta
            })
        })
    }

    return model
}

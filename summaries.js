const messages = require('../services/messages')

exports.get = async (id, context) => {
    const log = context.logger.start('get')

    const summary = {}

    const messagesQuery = {
        to: id,
        isHidden: false
    }

    const unreadQuery = {
        to: id,
        isHidden: false,
        viewedOn: { $exists: true }
    }

    const actionQuery = {
        to: id,
        isHidden: false,
        'meta.actions.1': { $exists: true }
    }

    summary.messages = await messages.limit(10, messagesQuery, context)
    summary.total = await messages.count(messagesQuery, context)
    summary.unread = await messages.count(unreadQuery, context)
    summary.actions = await messages.count(actionQuery, context)

    return summary
}

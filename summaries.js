'use strict'
const summaryService = require('../services/summaries')
const mapper = require('../mappers/summary')

exports.search = async (req) => {
    let log = req.context.logger.start('api/summaries:search')

    let byMonth = !!(req.query.byMonth === 'true' || req.query.byMonth === true)
    let summaries = []

    if (byMonth) {
        let monthSummaries = await summaryService.getMonthWiseSummary(req.query.fromDate, req.query.tillDate, req.query.agentId, req.context)
        let yearSummaries = await summaryService.getYearWiseSummary(req.query.fromDate, req.query.tillDate, req.query.agentId, req.context)
        summaries.push(...monthSummaries, ...yearSummaries)
    } else {
        let daySummaries = await summaryService.getDayWiseSummary(req.query.fromDate, req.query.tillDate, req.query.agentId, req.context)
        let monthSummaries = await summaryService.getMonthWiseSummary(req.query.fromDate, req.query.tillDate, req.query.agentId, req.context)
        summaries.push(...monthSummaries, ...daySummaries)
    }

    log.end()
    return mapper.toSearchModel(summaries)
}

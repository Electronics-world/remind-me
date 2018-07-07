const chrono = require('chrono-node');
const moment = require('moment');
const { REMAIND_ME_USERNAME } = require('./consts');

function findMentionLine(comment) {
    return comment.split(/\r?\n/).find(line => line.includes('@' + REMAIND_ME_USERNAME)) || null;
}

function getFutureDateByTextAndContext(text, context) {
    return chrono.parseDate(text, context);
}

function getFurureDateByCommentTextAndContextDate(commentText, contextDate) {
    const mentionText = findMentionLine(commentText);
    const future = getFutureDateByTextAndContext(mentionText || '', moment(contextDate));
    return future ? moment(future) : null;
}

module.exports = {
    getFurureDateByCommentTextAndContextDate
}
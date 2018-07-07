const nconf = require('nconf');
const Queue = require('better-queue');
const moment = require('moment');
const request = require('request');
const _ = require('lodash');

const uuidv4 = require('uuid/v4');
const remindersRegistry = require('./reminders-registry');
const spamControl = require('./spam-control');

const {
    delayWithSecs,
    isDateEnoughtDelayedToBeRegistered,
    toBlockchainDateString } = require('./helpers');
const { COMMENT_TIMEOUT_MS, ONE_SEC_MS,
    REMAIND_ME_USERNAME,
    APP_NAME, PRIORITY, ACTIVITY_TYPE, DEBUG_TEXT } = require('./consts');
const { getFurureDateByCommentTextAndContextDate } = require('./parser');
const { encryptPayload } = require('./reminder');
const { isCommentOperationWithMention, respondToComment, getBlock,
    isReminderCommentOperation,
    isCommentOperation, getComment } = require('./blockchain')

const IS_DEBUG = !!nconf.get('IS_DEBUG');

const fetchBlockQueue = new Queue(function ({ blockNo, isFirstBlockLoad }, done) {
    getBlock(blockNo, (err, block) => {
        if (err) return done(err);
        if (block === null) {
            return done('block not yet produced');
        }

        const { timestamp, witness, transactions } = block

        IS_DEBUG && console.log(blockNo, timestamp, witness)

        if (isFirstBlockLoad) {
            manageNotResolvedRemindersByBlockTimestamp(timestamp);
        }

        manageRemindersByBlockTimestamp(timestamp)

        const regReqOps = getRegisterRequestCommentOperationsByTransactions(transactions)
        regReqOps.map(commentOp => {
            console.log(commentOp)
            registerRequestQueue.push(commentOp)
        })

        done(null, { blockNo })
    })
}, {
        batchSize: 1,
        maxRetries: 99,
        afterProcessDelay: 0,
        retryDelay: ONE_SEC_MS
    })


const commentsQueue = new Queue(function ({ parentComment, newComment: { text, customJson } }, done) {
    respondToComment({
        parentComment: parentComment,
        newComment: {
            text,
            customJson
        }
    }).then(() => {
        console.log('success!');
        delayWithSecs(done, COMMENT_TIMEOUT_MS)
    }, err => {
        if (err.toString().match('STEEM_MIN_REPLY_INTERVAL')) {
            console.log('error! STEEM_MIN_REPLY_INTERVAL')
            done('STEEM_MIN_REPLY_INTERVAL')
        } else if (err.data.code === 13) {
            console.log('no parent comment, finishing with success')
            done();
        } else {
            console.log('err!', err);
            console.log('err data!', err.data);
            done(err);
        }
    })

}, {
        maxRetries: 10,
        retryDelay: 5 * ONE_SEC_MS,
        priority: function ({ priority }, cb) {
            return cb(null, priority || PRIORITY.LOW);
        }
    })
//===============================================
const registerRequestQueue = new Queue(async ({ author, permlink }, done) => {
    const comment = await getComment(author, permlink);

    if (!comment.id) {
        console.error('error while loading comment');
        return done();
    }

    if (comment.created !== comment.active && !IS_DEBUG) {
        console.error('post edited');
        return done();
    }

    const futureDate = getFurureDateByCommentTextAndContextDate(comment.body, comment.active);

    if (!futureDate) {
        console.error('no future specified');
        return done();
    }

    console.log('created at:', comment.active)
    console.log(futureDate)

    if (!isDateEnoughtDelayedToBeRegistered(futureDate)) {
        console.error('not enought futuristic');
        return done();
    }

    spamControl.register({
        user: author,
        created: comment.created
    });

    if(!spamControl.isAllowed({ user: author, created: comment.created })) {
        return console.error('daily limit exceeded');
        return done();
    }

    if(comment.body.includes(DEBUG_TEXT)) {
        console.error('ignore, it\'s a debug reminder creation request')
        return done();
    }

    const payload = {
        id: uuidv4(),
        author: comment.author,
        permlink: comment.permlink,
        future: toBlockchainDateString(futureDate)
    };

    remindersRegistry.add(payload);

    commentsQueue.push({
        parentComment: {
            author: comment.author,
            permlink: comment.permlink,
        },
        newComment: {
            text: createRemainderRegisterCommentText(comment.author, futureDate),
            customJson: {
                app: APP_NAME,
                type: ACTIVITY_TYPE.REMINDER_REGISTER,
                payload: encryptPayload(payload)
            }
        },
        priority: PRIORITY.LOW
    });
    done();
})

const resolveReminderQueue = new Queue(async (reminder, done) => {
    console.log('managing');
    console.log(reminder);
    console.log(createRemainderTextByComment(reminder.author, reminder.permlink));

    commentsQueue.push({
        parentComment: {
            author: reminder.author,
            permlink: reminder.permlink,
        },
        newComment: {
            text: createRemainderTextByComment(reminder.author, reminder.permlink),
            customJson: {
                app: APP_NAME,
                type: ACTIVITY_TYPE.REMINDER_RESOLVE,
                payload: encryptPayload({ id: reminder.id })
            }
        },
        priority: PRIORITY.HIGH
    });
    done();
})


function getRegisterRequestCommentOperationsByTransactions(transactions) {
    return _.chain(transactions || [])
        .flatMap('operations')
        .filter(isCommentOperation)
        .map(wrappedOp => wrappedOp[1])
        .filter(operation => isCommentOperationWithMention(operation, REMAIND_ME_USERNAME))
        .filter(operation => !isReminderCommentOperation(operation))
        .value()
}

function createRemainderTextByComment(author, permlink) {
    return `Hi @${author}!
You asked me in [this comment](/@${author}/${permlink}) to create a reminder.
It seems the time has passed!
    `
}

function createRemainderRegisterCommentText(author, futureDate) {
    const formattedFutureDate = moment(futureDate).format('MMMM Do YYYY, h:mm:ss a');
    return `Hey @${author}, I will notify you on ${formattedFutureDate} (UTC)
Later!`
}

function manageNotResolvedRemindersByBlockTimestamp(timestamp) {
    console.log(`searching for reminders had to be resolved earlier than timestamp ${timestamp}`)
    const reminders = remindersRegistry.getEarlierThanTimestamp(timestamp);
    remindersRegistry.removeReminders(reminders);
    console.log('needs to be resolved (late)', reminders);
    resolveReminders(reminders)
}

function manageRemindersByBlockTimestamp(timestamp) {
    const reminders = remindersRegistry.getByTimestamp(timestamp);
    remindersRegistry.removeReminders(reminders);
    resolveReminders(reminders)
}

function resolveReminders(reminders) {
    _.forEach(reminders, reminder => resolveReminderQueue.push(reminder))
}

module.exports = {
    fetchBlockQueue,
    commentsQueue,
    resolveReminderQueue,
    registerRequestQueue
}
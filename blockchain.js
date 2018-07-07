const nconf = require('nconf');
const steem = require('steem');
const request = require('request');
const _ = require('lodash');
const { promisify } = require('util');

const { REMAIND_ME_USERNAME, APP_NAME } = require('./consts');

const POSTING_WIF = nconf.get('POSTING_WIF');

let id = 0;

const HEADERS = {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
};

function call(method, params, cb) {
    return request({
        url: 'https://api.steemit.com',
        body: JSON.stringify({
            jsonrpc: '2.0',
            method,
            id: id++,
            params
        }),
        method: 'POST',
        headers: HEADERS,
    }, (err, resp, body) => {
        if(err) {
            console.log(err)
            return cb(err)
        }
        try {
            const data = JSON.parse(body);
            cb(null, data.result);
        } catch (e) {
            cb(e)
        }
    })
}

function getBlock(blockNo, cb) {
    call('get_block', [blockNo], cb);
}

function getDynamicGlobalProperties(cb) {
    call('get_dynamic_global_properties', [], cb);
}

function isCommentOperation(operation) {
    return 'comment' === operation[0];
}

function isCommentOperationWithMention(operation, mention) {
    return !!(operation.body || '').match(new RegExp(`@${mention}`))
}

function isReminderCommentOperation(operation) {
    const json_metadata = operation.json_metadata || '{}';
    const jsonMetadata = JSON.parse(json_metadata);

    const isRemindMeAuthoredComment = operation.author === REMAIND_ME_USERNAME;
    const isAppGeneratedComment = jsonMetadata.app === APP_NAME
    
    return isRemindMeAuthoredComment && isAppGeneratedComment
}

function respondToComment({ parentComment, newComment: { text, customJson } }) {
    console.log('sending comment')
    console.log(text, customJson)
    return (promisify(steem.broadcast.comment))(
        POSTING_WIF,
        parentComment.author, // Parent Author
        parentComment.permlink, // Parent Permlink
        REMAIND_ME_USERNAME, // Author
        createPermlink(),
        '',
        text,
        customJson,
    );
}

function createPermlink() {
    return new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
}

function unwrapTransaction(trx) {
    return trx[1]
}

function mergeTransactionWithOperation(trx) {
    const operation = trx.op[1];
    trx.op = null;
    operation.trx = trx;
    return operation;
}

function parseJsonMetadata(op) {
    let jsonMetadata = null;
    try {
        jsonMetadata = JSON.parse(op.json_metadata);
    } catch (e) { }

    if (jsonMetadata) {
        op.json_metadata = jsonMetadata;
        return op;
    } else {
        return null;
    }
}

const getComment = promisify(steem.api.getContent);

async function getAllReminderCommentOperations() {
    const result = await promisify(steem.api.getAccountHistory)(REMAIND_ME_USERNAME, -1, 9940);

    let commentOperations = _.chain(result)
        .map(unwrapTransaction)
        .filter(trx => isCommentOperation(trx.op))
        .map(mergeTransactionWithOperation)
        .map(parseJsonMetadata)
        .compact()
        .filter(op => op.json_metadata.app === APP_NAME)
        .groupBy('permlink')
        .map(op => _.maxBy(op, op => op.trx.block))
        .value();

    return commentOperations;
}


module.exports = {
    getDynamicGlobalProperties,
    getBlock,
    respondToComment,
    getAllReminderCommentOperations,
    getComment,
    isCommentOperation,
    isCommentOperationWithMention,
    isReminderCommentOperation
};
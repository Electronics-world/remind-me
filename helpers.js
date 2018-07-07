const moment = require('moment');

//https://steemdb.com/block/21710071
//https://steemdb.com/block/21710070

function delayWithSecs(cb, timeout) {
    setTimeout(() => cb(), timeout)
}

function toBlockchainDateString(date) {
    return date.format().split('+')[0]
}

function isDateEnoughtDelayedToBeRegistered(future) {
    const noww = moment().utc().format()
    const now = moment(noww.substr(0, noww.length - 1))
    const diffInSeconds = future.diff(now) / 1000;
    return diffInSeconds >= 10
}

module.exports = {
    isDateEnoughtDelayedToBeRegistered,
    toBlockchainDateString,
    delayWithSecs
}
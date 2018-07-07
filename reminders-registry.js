const _ = require('lodash');
const moment = require('moment');

let reminders = [];

function getByTimestamp(_timestamp) {
    const now = moment(_timestamp);

    return reminders.filter(reminder => {
        const future = moment(reminder.future)
        const diffSec = Math.abs(moment(now).diff(future)) / 1000
        return diffSec < 10
    })
}

function add(reminder) {
    reminders = [...reminders, reminder];
}

function getEarlierThanTimestamp(timestamp) {
    const now = moment(timestamp);

    return reminders.filter(reminder => {
        return now.diff(moment(reminder.future)) >= 0;
    })
}

function removeReminders(remindersToDelete) {
    reminders = _.xorBy(reminders, remindersToDelete, 'id')
}

function list() {
    return reminders;
}

module.exports = {
    add,
    getByTimestamp,
    getEarlierThanTimestamp,
    removeReminders,
    list
}
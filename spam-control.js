const moment = require('moment');
const { DAILY_CREATION_CAP_PER_USER } = require('./consts');

const registry = {};

// example: 
// registry['21-06-2018']['adasq'] === 3
// so, user with name 'adasq' has used reminders limit set on day 21-06-2018 (as 3 === DAILY_CREATION_CAP_PER_USER)

function getDateKey (created) {
    return moment(created).format('DD-MM-YYYY');
}

function register({ user, created }) {
    const createdDay = getDateKey(created);

    if(!registry[createdDay]) {
        registry[createdDay] = {}
    }

    if(!registry[createdDay][user]) {
        registry[createdDay][user] = 0;
    }

    registry[createdDay][user] = registry[createdDay][user] + 1;
}

function isAllowed({ user, created }) {
    const createdDay = getDateKey(created);
    const userUsageCount = registry[createdDay][user];

    console.log(`${user} daily limit: ${userUsageCount}/${DAILY_CREATION_CAP_PER_USER}`);
    return userUsageCount <= DAILY_CREATION_CAP_PER_USER
}

module.exports = {
    register,
    isAllowed
};
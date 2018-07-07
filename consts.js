const ONE_SEC_MS = 1000;
const ONE_MIN_MS = 60 * ONE_SEC_MS;

const COMMENT_TIMEOUT_MS = 20 * ONE_SEC_MS;
const SECS_PER_BLOCK = 3;

const COMMENT_DELAY_ISSUE = 'You may only comment once every 20 seconds.';
const REMAIND_ME_USERNAME = 'remind-me';
const APP_NAME = 'remind-me/0.2';
const STREAMING_MODE = 'head'
const DEBUG_TEXT = '%debug%'

const ACTIVITY_TYPE = {
    REMINDER_REGISTER: 'reminder-register',
    REMINDER_RESOLVE: 'reminder-resolve'
}

const DAILY_CREATION_CAP_PER_USER = 3;

const PRIORITY = {
    HIGH: 10,
    LOW: 5
}

module.exports = {
    ONE_SEC_MS,
    ONE_MIN_MS,

    PRIORITY,
    ACTIVITY_TYPE,
    
    COMMENT_TIMEOUT_MS,
    COMMENT_DELAY_ISSUE,
    SECS_PER_BLOCK,

    REMAIND_ME_USERNAME,
    APP_NAME,

    STREAMING_MODE,
    DEBUG_TEXT,
    DAILY_CREATION_CAP_PER_USER
};

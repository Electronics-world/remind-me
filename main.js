const nconf = require('nconf')
nconf.env().file({ file: './config.json' })
const _ = require('lodash')

const { fetchBlockQueue } = require('./queue')
const { initializeWakeUper } = require('./utils')
const remindersRegistry = require('./reminders-registry')
const { decryptPayload } = require('./reminder')
const { getDynamicGlobalProperties, getAllReminderCommentOperations } = require('./blockchain');
const { ACTIVITY_TYPE } = require('./consts');

(async () => {
    await loadAllRemindersToRegistry()
    initBlockWatcher();
    initializeWakeUper();
})()

function initBlockWatcher() {
    getDynamicGlobalProperties((err, props) => {
        if (err) {
            console.log(err);
            return initBlockWatcher();
        }

        fetchBlockQueue.push({
            blockNo: props.head_block_number,
            isFirstBlockLoad: true
        })

        fetchBlockQueue.on('task_finish', (taskId, { blockNo }, stats) => {
            fetchBlockQueue.push({
                blockNo: blockNo + 1
            })
        })

        fetchBlockQueue.on('task_failed', (taskId, err, stats) => {
            console.log('err:', err)
        })
    });
}

async function loadAllRemindersToRegistry() {
    let commentOperations = []
    try {
        commentOperations = await getAllReminderCommentOperations()
    } catch (e) {
        conosle.log('err loadAllReminders', e)
    }

    //all registered reminders
    const registeredReminders = _.chain(commentOperations)
        .filter(isActivityTyped(ACTIVITY_TYPE.REMINDER_REGISTER))
        .map(toPayload)
        .value()

    //all resolver reminders
    const resolvedReminders = _.chain(commentOperations)
        .filter(isActivityTyped(ACTIVITY_TYPE.REMINDER_RESOLVE))
        .map(toPayload)
        .value()


    const notResolvedReminders = _.xorBy(registeredReminders, resolvedReminders, 'id')

    console.log('to resolve in future:', notResolvedReminders)
    _.forEach(notResolvedReminders, registeredReminder => remindersRegistry.add(registeredReminder))
}

function isActivityTyped(activityTupe) {
    return op => op.json_metadata.type === activityTupe
}

function toPayload(op) {
    return decryptPayload(op.json_metadata.payload)
}
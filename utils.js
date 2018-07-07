const request = require('request');
const nconf = require('nconf');
const express = require('express');
const { fetchBlockQueue } = require('./queue');
const remindersRegistry = require('./reminders-registry');
const { ONE_MIN_MS } = require('./consts');

const IS_DEBUG = !!nconf.get('IS_DEBUG');
const URL = nconf.get('URL') || '0:0:0:0'

module.exports = {
    initializeWakeUper() {
        const app = express();
        app.get('/', function (req, res) {
            res.send(`ok`);
        });

        app.get('/reminders', function (req, res) {
            res.send(remindersRegistry.list());
        });

        app.get('/stats', function (req, res) {
            res.send(fetchBlockQueue.getStats());
        });

        app.listen(process.env.PORT || 3000);

        if (!IS_DEBUG) {
            setInterval(() => request.get(URL, () => { }), ONE_MIN_MS * 10);
        }
    }
}

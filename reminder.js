const { encrypt, decrypt } = require('./security');

function decryptPayload(payload) {
    if(!payload) return null;
    let reminder = null;
    try {
        reminder = JSON.parse(decrypt(payload));
    } catch(e) { }

    return reminder;
}

function encryptPayload(payload) {
    return encrypt(JSON.stringify(payload));
}

module.exports = {
    decryptPayload,
    encryptPayload
}
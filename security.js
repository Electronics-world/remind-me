const nconf = require('nconf');
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const PSWD = nconf.get('PSWD');

function encrypt(text) {
  const cipher = crypto.createCipher(algorithm, PSWD)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text) {
  const decipher = crypto.createDecipher(algorithm, PSWD)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}
module.exports = {
    encrypt,
    decrypt
}
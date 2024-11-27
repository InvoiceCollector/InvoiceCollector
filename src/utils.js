//Import crypto
const crypto = require('crypto');

const generate_token = function generate_token(size=64) {
    return crypto.randomBytes(size).toString('hex');
}

module.exports = {
	generate_token
}
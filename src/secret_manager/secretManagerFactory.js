require('ts-node').register();
const Bitwarden = require('./bitwarden.ts');

class SecretManagerFactory {
    static getSecretManager() {
        const type = process.env.SECRET_MANAGER_TYPE;
        switch(type) {
            case 'bitwarden':
                return new Bitwarden();
            default:
                throw new Error(`Unknown secret manager type: ${type}`);
        }
    }
}

module.exports = SecretManagerFactory;

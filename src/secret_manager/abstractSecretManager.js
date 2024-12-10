class AbstractSecretManager {
    constructor() {
        if (new.target === AbstractSecretManager) {
            throw new TypeError("Cannot construct AbstractSecretManager instances directly");
        }
    }

    async connect() {
        throw new Error("Method 'connect()' must be implemented.");
    }

    async disconnect() {
        throw new Error("Method 'disconnect()' must be implemented.");
    }

    // SECRETS

    async addSecret(key, params) {
        throw new Error("Method 'addSecret()' must be implemented.");
    }

    async getSecret(id) {
        throw new Error("Method 'getSecret()' must be implemented.");
    }

    async deleteSecret(id) {
        throw new Error("Method 'deleteSecret()' must be implemented.");
    }
}

module.exports = AbstractSecretManager;

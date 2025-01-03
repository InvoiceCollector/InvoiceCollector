export class AbstractSecretManager {
    constructor() {
        if (new.target === AbstractSecretManager) {
            throw new TypeError("Cannot construct AbstractSecretManager instances directly");
        }
    }

    async connect() {
        throw new Error("Method 'connect()' must be implemented.");
    }

    /*async disconnect() {
        throw new Error("Method 'disconnect()' must be implemented.");
    }*/

    // SECRETS

    async addSecret(key, params): Promise<any> {
        throw new Error("Method 'addSecret()' must be implemented.");
    }

    async getSecret(id): Promise<any> {
        throw new Error("Method 'getSecret()' must be implemented.");
    }

    async deleteSecret(id): Promise<any> {
        throw new Error("Method 'deleteSecret()' must be implemented.");
    }
}

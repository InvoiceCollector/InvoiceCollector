class AbstractDatabase {
    constructor() {
        if (new.target === AbstractDatabase) {
            throw new TypeError("Cannot construct AbstractDatabase instances directly");
        }
    }

    async connect() {
        throw new Error("Method 'connect()' must be implemented.");
    }

    async disconnect() {
        throw new Error("Method 'disconnect()' must be implemented.");
    }

    // CUSTOMER
    
    async getCustomer(bearer) {
        throw new Error("Method 'getCustomer()' must be implemented.");
    }

    async updateCustomer(customer) {
        throw new Error("Method 'updateCustomer()' must be implemented.");
    }

    // USER
    
    async createUser(user) {
        throw new Error("Method 'createUser()' must be implemented.");
    }
    
    async getUser(customer_id, remote_id) {
        throw new Error("Method 'getUser()' must be implemented.");
    }

    async updateUser(user) {
        throw new Error("Method 'updateUser()' must be implemented.");
    }

    async createCredential(credential) {
        throw new Error("Method 'createCredential()' must be implemented.");
    }

    async getCredentials(customer_id) {
        throw new Error("Method 'getCredentials()' must be implemented.");
    }

    async updateCredential(credential) {
        throw new Error("Method 'updateCredential()' must be implemented.");
    }
}

module.exports = AbstractDatabase;

const mongodb = require('mongodb');
const AbstractDatabase = require('./abstractDatabase.js');

class MongoDB extends AbstractDatabase {

    static DB_NAME = 'invoice-collector';
    static CUSTOMER_COLLECTION = 'customers';
    static USER_COLLECTION = 'users';
    static CREDENTIAL_COLLECTION = 'credentials';

    constructor(uri) {
        super();
        this.client = new mongodb.MongoClient(uri);
        this.connect();
    }

    async initialize() {
        if (!this.db) {
            throw new Error("Database is not connected");
        }

        // Create collection if not existing
        await this.db.createCollection(MongoDB.CUSTOMER_COLLECTION);
        await this.db.createCollection(MongoDB.USER_COLLECTION);
        await this.db.createCollection(MongoDB.CREDENTIAL_COLLECTION);
    }

    async connect() {
        try {
            await this.client.connect();
            console.log("Connected successfully to MongoDB");
            this.db = this.client.db(MongoDB.DB_NAME);
        } catch (err) {
            console.error("Connection to MongoDB failed", err);
        }
        await this.initialize();
    }

    async disconnect() {
        try {
            await this.client.close();
            console.log("Disconnected successfully from MongoDB");
        } catch (err) {
            console.error("Disconnection from MongoDB failed", err);
        }
    }

    // CUSTOMER

    async getCustomer(bearer) {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        return await this.db.collection(MongoDB.CUSTOMER_COLLECTION).findOne({ bearer });
    }

    async updateCustomer(customer) {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        return await this.db.collection(MongoDB.CUSTOMER_COLLECTION).updateOne({ _id: customer._id }, { $set: customer });
    }

    // USER

    async createUser(user) {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        return await this.db.collection(MongoDB.USER_COLLECTION).insertOne(user);
    }

    async getUser(customer_id, remote_id) {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        if (typeof customer_id === 'string') {
            customer_id = new ObjectID(customer_id);
        }
        return await this.db.collection(MongoDB.USER_COLLECTION).findOne({ customer_id, remote_id });
    }

    async updateUser(user) {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        return await this.db.collection(MongoDB.USER_COLLECTION).updateOne({ _id: user._id }, { $set: user });
    }

    // CREDENTIAL

    async getCredentials(user_id) {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        if (typeof user_id === 'string') {
            user_id = new ObjectID(user_id);
        }
        return await this.db.collection(MongoDB.CREDENTIAL_COLLECTION).find({ user_id }).toArray();
    }

    async createCredential(credential) {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        return await this.db.collection(MongoDB.CREDENTIAL_COLLECTION).insertOne(credential);
    }

    async updateCredential(credential) {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        return await this.db.collection(MongoDB.CREDENTIAL_COLLECTION).updateOne({ _id: credential._id }, { $set: credential });
    }

    async deleteCredential(user_id, credential_id) {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        if (typeof credential_id === 'string') {
            credential_id = new mongodb.ObjectId(credential_id);
        }
        return await this.db.collection(MongoDB.CREDENTIAL_COLLECTION).deleteOne({ _id: credential_id, user_id });
    }
}

module.exports = MongoDB;
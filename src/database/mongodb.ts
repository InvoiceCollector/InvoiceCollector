import { MongoClient, Db, ObjectId } from "mongodb";
import { AbstractDatabase } from "./abstractDatabase";
import { Customer } from "../model/customer";
import { User } from "../model/user";
import { IcCredential } from "../model/credential";


export class MongoDB extends AbstractDatabase {

    static CUSTOMER_COLLECTION = 'customers';
    static USER_COLLECTION = 'users';
    static CREDENTIAL_COLLECTION = 'credentials';

    client: MongoClient;
    db_name: string;
    db: Db|null;

    constructor(uri) {
        if (!process.env.DATABASE_MONGODB_NAME) {
            throw new Error("DATABASE_MONGODB_NAME environment variable is required");
        }

        super();
        this.client = new MongoClient(uri);
        this.db_name = process.env.DATABASE_MONGODB_NAME;
        this.db = null;
    }

    async connect(): Promise<void> {
        try {
            await this.client.connect();
            console.log("Connected successfully to MongoDB");
            this.db = this.client.db(this.db_name);

            // Create collection if not existing
            await this.db.createCollection(MongoDB.CUSTOMER_COLLECTION);
            await this.db.createCollection(MongoDB.USER_COLLECTION);
            await this.db.createCollection(MongoDB.CREDENTIAL_COLLECTION);
        } catch (err) {
            console.error("Connection to MongoDB failed", err);
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.client.close();
            console.log("Disconnected successfully from MongoDB");
        } catch (err) {
            console.error("Disconnection from MongoDB failed", err);
        }
    }

    // CUSTOMER

    async getCustomerFromBearer(bearer: string): Promise<Customer|null> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        const document = await this.db.collection(MongoDB.CUSTOMER_COLLECTION).findOne({ bearer });
        if (!document) {
            return null;
        }
        let customer = new Customer(document.callback, document.bearer);
        customer.id = document._id.toString();
        return customer;
    }

    async getCustomer(customer_id: string): Promise<Customer|null> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        const document = await this.db.collection(MongoDB.CUSTOMER_COLLECTION).findOne({
            _id: new ObjectId(customer_id)
        });
        if (!document) {
            return null;
        }
        let customer = new Customer(document.callback, document.bearer);
        customer.id = document._id.toString();
        return customer;
    }

    async updateCustomer(customer: Customer): Promise<void> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        await this.db.collection(MongoDB.CUSTOMER_COLLECTION).updateOne(
            { _id: new ObjectId(customer.id) },
            { $set: {
                callback: customer.callback
            }}
        );
    }

    // USER

    async getUser(user_id: string): Promise<User|null> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        const document = await this.db.collection(MongoDB.USER_COLLECTION).findOne({
            _id: new ObjectId(user_id)
        });
        if (!document) {
            return null;
        }
        let user = new User(
            document.customer_id.toString(),
            document.remote_id,
            document.location,
            document.locale,
            document.termsConditions
        );
        user.id = document._id.toString();
        return user;
    }

    async getUserFromCustomerIdAndRemoteId(customer_id: string, remote_id: string): Promise<User|null> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        const document = await this.db.collection(MongoDB.USER_COLLECTION).findOne({
            customer_id: new ObjectId(customer_id),
            remote_id
        });
        if (!document) {
            return null;
        }
        let user = new User(
            document.customer_id.toString(),
            document.remote_id,
            document.location,
            document.locale,
            document.termsConditions
        );
        user.id = document._id.toString();
        return user;
    }

    async createUser(user: User): Promise<User> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        const document = await this.db.collection(MongoDB.USER_COLLECTION).insertOne({
            customer_id: new ObjectId(user.customer_id),
            remote_id: user.remote_id,
            location: user.location,
            locale: user.locale,
            termsConditions: user.termsConditions
        });
        user.id = document.insertedId.toString();
        return user;
    }

    async updateUser(user: User): Promise<void> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        await this.db.collection(MongoDB.USER_COLLECTION).updateOne(
            { _id: new ObjectId(user.id) },
            { $set: {
                customer_id: new ObjectId(user.customer_id),
                remote_id: user.remote_id,
                location: user.location,
                locale: user.locale,
                termsConditions: user.termsConditions
            }}
        );
    }

    async deleteUser(user_id: string): Promise<void> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        await this.db.collection(MongoDB.USER_COLLECTION).deleteOne({ _id: new ObjectId(user_id) });
    }

    // CREDENTIAL

    async getCredentialsIdToCollect(): Promise<string[]> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        const query = {
            $or: [
            { last_collect_timestamp: NaN },
            {
                $and: [
                    { $expr: { $lt: [ "$last_collect_timestamp", "$next_collect_timestamp" ] } },
                    { $expr: { $lt: [ "$next_collect_timestamp", Date.now() ] } },
                    { state: { $ne: "ERROR" } }
                ]
            }
            ]
        };
        const documents = await this.db.collection(MongoDB.CREDENTIAL_COLLECTION).aggregate([
            { $match: query },
            { $project: { _id: 1 } }
        ]).toArray();
        return documents.map(document => document._id.toString());
    }

    async getCredentials(user_id: string): Promise<IcCredential[]> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        const documents = await this.db.collection(MongoDB.CREDENTIAL_COLLECTION).find({ user_id: new ObjectId(user_id) }).toArray();
        return documents.map(document => {
            let credential = new IcCredential(
                document.user_id.toString(),
                document.collector_id,
                document.note,
                document.secret_manager_id,
                document.create_timestamp,
                document.last_collect_timestamp,
                document.next_collect_timestamp,
                document.invoices,
                document.state,
                document.error
            );
            credential.id = document._id.toString();
            return credential;
        });
    }

    async getCredential(credential_id: string): Promise<IcCredential|null> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        const document = await this.db.collection(MongoDB.CREDENTIAL_COLLECTION).findOne({
            _id: new ObjectId(credential_id)
        });
        if (!document) {
            return null;
        }
        let credential = new IcCredential(
            document.user_id.toString(),
            document.collector_id,
            document.note,
            document.secret_manager_id,
            document.create_timestamp,
            document.last_collect_timestamp,
            document.next_collect_timestamp,
            document.invoices,
            document.state,
            document.error
        );
        credential.id = document._id.toString();
        return credential;
    }

    async createCredential(credential: IcCredential): Promise<IcCredential> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        const document = await this.db.collection(MongoDB.CREDENTIAL_COLLECTION).insertOne({
            user_id: new ObjectId(credential.user_id),
            collector_id: credential.collector_id,
            note: credential.note,
            secret_manager_id: credential.secret_manager_id,
            create_timestamp: credential.create_timestamp,
            last_collect_timestamp: credential.last_collect_timestamp,
            next_collect_timestamp: credential.next_collect_timestamp,
            invoices: credential.invoices,
            state: credential.state,
            error: credential.error
        });
        credential.id = document.insertedId.toString();
        return credential;
    }

    async updateCredential(credential: IcCredential): Promise<void> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        await this.db.collection(MongoDB.CREDENTIAL_COLLECTION).updateOne(
            { _id: new ObjectId(credential.id) },
            { $set: {
                user_id: new ObjectId(credential.user_id),
                collector_id: credential.collector_id,
                note: credential.note,
                secret_manager_id: credential.secret_manager_id,
                create_timestamp: credential.create_timestamp,
                last_collect_timestamp: credential.last_collect_timestamp,
                next_collect_timestamp: credential.next_collect_timestamp,
                invoices: credential.invoices,
                state: credential.state,
                error: credential.error
            }}
        );
    }

    async deleteCredential(user_id: string, credential_id: string): Promise<void> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        await this.db.collection(MongoDB.CREDENTIAL_COLLECTION).deleteOne({ _id: new ObjectId(credential_id), user_id: new ObjectId(user_id) });
    }

    async deleteCredentials(user_id: string): Promise<void> {
        if (!this.db) {
            throw new Error("Database is not connected");
        }
        await this.db.collection(MongoDB.CREDENTIAL_COLLECTION).deleteMany({ user_id: new ObjectId(user_id) });
    }
}

import { Customer } from "../model/customer";
import { User } from "../model/user";
import { IcCredential } from "../model/credential";

export class AbstractDatabase {
    constructor() {
        if (new.target === AbstractDatabase) {
            throw new TypeError("Cannot construct AbstractDatabase instances directly");
        }
    }

    async connect(): Promise<void> {
        throw new Error("Method 'connect()' must be implemented.");
    }

    async disconnect(): Promise<void> {
        throw new Error("Method 'disconnect()' must be implemented.");
    }

    // CUSTOMER
    
    async getCustomerFromBearer(bearer: string): Promise<Customer|null> {
        throw new Error("Method 'getCustomerFromBearer()' must be implemented.");
    }
    
    async getCustomer(customer_id: string): Promise<Customer|null> {
        throw new Error("Method 'getCustomer()' must be implemented.");
    }

    async updateCustomer(customer: Customer): Promise<void> {
        throw new Error("Method 'updateCustomer()' must be implemented.");
    }

    // USER
    
    async getUser(user_id: string): Promise<User|null> {
        throw new Error("Method 'getUser()' must be implemented.");
    }

    async getUserFromCustomerIdAndRemoteId(customer_id: string, remote_id: string): Promise<User|null> {
        throw new Error("Method 'getUserFromCustomerIdAndRemoteId()' must be implemented.");
    }
    
    async createUser(user: User): Promise<User> {
        throw new Error("Method 'createUser()' must be implemented.");
    }

    async updateUser(user: User): Promise<void> {
        throw new Error("Method 'updateUser()' must be implemented.");
    }

    // CREDENTIAL

    async getCredentialsIdToCollect(): Promise<string[]> {
        throw new Error("Method 'getCredentialsToCollect()' must be implemented.");
    }

    async getCredentials(user_id: string|null): Promise<IcCredential[]> {
        throw new Error("Method 'getCredentials()' must be implemented.");
    }

    async getCredential(credential_id: string): Promise<IcCredential|null> {
        throw new Error("Method 'getCredential()' must be implemented.");
    }

    async createCredential(credential: IcCredential): Promise<IcCredential> {
        throw new Error("Method 'createCredential()' must be implemented.");
    }

    async updateCredential(credential: IcCredential): Promise<void> {
        throw new Error("Method 'updateCredential()' must be implemented.");
    }

    async deleteCredential(user_id: string, credential_id: string): Promise<void> {
        throw new Error("Method 'deleteCredential()' must be implemented.");
    }
}

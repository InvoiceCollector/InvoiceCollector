import { DatabaseFactory } from "../database/databaseFactory";

export class User {

    id: string;
    customer_id: string;
    remote_id: string;
    locale: string;

    constructor(customer_id, remote_id, locale = "") {
        this.id = "";
        this.customer_id = customer_id;
        this.remote_id = remote_id;
        this.locale = locale;
    }

    async getCustomer() {
        return await DatabaseFactory.getDatabase().getCustomer(this.customer_id);
    }

    async getCredential(credential_id: string) {
        return await DatabaseFactory.getDatabase().getCredential(credential_id);
    }

    async getCredentials() {
        return await DatabaseFactory.getDatabase().getCredentials(this.id);
    }

    async commit() {
        if (this.id) {
            // Update existing user
            await DatabaseFactory.getDatabase().updateUser(this);
        }
        else {
            // Create user
            await DatabaseFactory.getDatabase().createUser(this);
        }
    }
}

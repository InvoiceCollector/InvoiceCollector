import { DatabaseFactory } from "../database/databaseFactory";

export class IcCredential {
    static async fromId(id: string): Promise<IcCredential|null> {    
        // Get customer from bearer
        return await DatabaseFactory.getDatabase().getCredential(id);
    }

    id: string;
    user_id: string;
    key: string;
    note: string;
    secret_manager_id: string;

    constructor(
        user_id: string,
        key: string,
        note: string,
        secret_manager_id: string
    ) {
        this.id = "";
        this.user_id = user_id;
        this.key = key;
        this.note = note;
        this.secret_manager_id = secret_manager_id;
    }

    async getUser() {
        return await DatabaseFactory.getDatabase().getUser(this.user_id);
    }

    async delete() {
        await DatabaseFactory.getDatabase().deleteCredential(this.user_id, this.id);
    }

    async commit() {
        if (this.id) {
            // Update existing credential
            await DatabaseFactory.getDatabase().updateCredential(this);
        }
        else {
            // Create credential
            await DatabaseFactory.getDatabase().createCredential(this);
        }
    }
}

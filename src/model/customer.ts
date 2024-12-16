import { AuthenticationBearerError } from "../error";
import { DatabaseFactory } from "../database/databaseFactory";

export class Customer {

    static async fromBearer(bearer): Promise<Customer|null> {
        // Check if bearer is missing or does not start with "Bearer "
        if(!bearer || !bearer.startsWith("Bearer ")) {
            throw new AuthenticationBearerError()
        }
    
        // Get customer from bearer
        return await DatabaseFactory.getDatabase().getCustomerFromBearer(bearer.split(' ')[1]);
    }

    id: string;
    callback: string;

    constructor(callback) {
        this.id = "";
        this.callback = callback;
    }

    async getUserFromRemoteId(remote_id: string) {
        return await DatabaseFactory.getDatabase().getUserFromCustomerIdAndRemoteId(this.id, remote_id);
    }
}

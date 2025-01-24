import { AuthenticationBearerError } from "../error";
import { DatabaseFactory } from "../database/databaseFactory";
import { hash_string } from "../utils";

export class Customer {

    static async fromBearer(bearer): Promise<Customer|null> {
        // Check if bearer is missing or does not start with "Bearer "
        if(!bearer || !bearer.startsWith("Bearer ")) {
            throw new AuthenticationBearerError()
        }

        // Get hash from bearer
        const hashed_bearer = hash_string(bearer.split(' ')[1]);
    
        // Get customer from bearer
        return await DatabaseFactory.getDatabase().getCustomerFromBearer(hashed_bearer);
    }

    id: string;
    callback: string;
    bearer: string;

    constructor(callback: string, bearer: string) {
        this.id = "";
        this.callback = callback;
        this.bearer = bearer;
    }

    async getUserFromRemoteId(remote_id: string) {
        return await DatabaseFactory.getDatabase().getUserFromCustomerIdAndRemoteId(this.id, remote_id);
    }
}

import { AuthenticationBearerError } from "../error";
import { DatabaseFactory } from "../database/databaseFactory";
import * as utils from "../utils";

export class Customer {

    static DEFAULT_NAME = "default";
    static DEFAULT_CALLBACK = "https://path.to/callback";

    static async fromBearer(bearer): Promise<Customer|null> {
        // Check if bearer is missing or does not start with "Bearer "
        if(!bearer || !bearer.startsWith("Bearer ")) {
            throw new AuthenticationBearerError()
        }

        // Get hash from bearer
        const hashed_bearer = utils.hash_string(bearer.split(' ')[1]);
    
        // Get customer from bearer
        return await DatabaseFactory.getDatabase().getCustomerFromBearer(hashed_bearer);
    }

    static async createDefault(): Promise<{bearer: string, customer: Customer}> {
        const bearer = utils.generate_bearer();
        const customer = new Customer(Customer.DEFAULT_NAME, Customer.DEFAULT_CALLBACK, utils.hash_string(bearer));
        return {
            bearer,
            customer: await DatabaseFactory.getDatabase().createCustomer(customer)
        }
    }

    id: string;
    name: string;
    callback: string;
    bearer: string;

    constructor(name: string, callback: string, bearer: string) {
        this.id = "";
        this.name = name;
        this.callback = callback;
        this.bearer = bearer;
    }

    async getUserFromRemoteId(remote_id: string) {
        return await DatabaseFactory.getDatabase().getUserFromCustomerIdAndRemoteId(this.id, remote_id);
    }
}

import { DatabaseFactory } from "../database/databaseFactory";

export enum State {
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    ERROR = "ERROR"
}

export class IcCredential {

    static ONE_DAY_MS: number = 86400000;
    static ONE_WEEK_MS: number = 604800000;

    static async fromId(id: string): Promise<IcCredential|null> {    
        // Get customer from bearer
        return await DatabaseFactory.getDatabase().getCredential(id);
    }

    static async getCredentialsIdToCollect(): Promise<string[]> {
        return await DatabaseFactory.getDatabase().getCredentialsIdToCollect();
    }

    id: string;
    user_id: string;
    key: string;
    note: string;
    secret_manager_id: string;
    create_timestamp: number;
    last_collect_timestamp: number;
    next_collect_timestamp: number;
    invoices: any[];
    state: State;
    error: string;

    constructor(
        user_id: string,
        key: string,
        note: string,
        secret_manager_id: string,
        create_timestamp: number = Date.now(),
        last_collect_timestamp: number = Number.NaN,
        next_collect_timestamp: number = Number.NaN,
        invoices: any[] = [],
        state: State = State.PENDING,
        error: string = ""
    ) {
        this.id = "";
        this.user_id = user_id;
        this.key = key;
        this.note = note;
        this.secret_manager_id = secret_manager_id;
        this.create_timestamp = create_timestamp;
        this.last_collect_timestamp = last_collect_timestamp;
        this.next_collect_timestamp = next_collect_timestamp;
        this.invoices = invoices;
        this.state = state;
        this.error = error;
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

    computeNextCollect() {
        // If not in error
        if (this.state != State.ERROR) {
            // If last_collect_timestamp and next_collect_timestamp are NaN, the invoices has never been collected
            if (isNaN(this.last_collect_timestamp) && isNaN(this.next_collect_timestamp)) {
                // Plan the next collection now
                this.next_collect_timestamp = this.create_timestamp;
            }
            else if (this.next_collect_timestamp < this.last_collect_timestamp) { // If next_collect_timestamp is before last_collect_timestamp
                if (this.invoices.length < 2) { // If has less than 2 invoices
                    // Plan the next collect in one week
                    this.next_collect_timestamp = this.last_collect_timestamp + IcCredential.ONE_WEEK_MS;
                }
                else { // If has more than 2 invoices
                    // Take the last 10 invoices
                    let invoices = this.invoices.slice(-10);

                    // Compute the average time between invoices
                    let sum = 0;
                    for (let i = 1; i < invoices.length; i++) {
                        sum += invoices[i].timestamp - invoices[i-1].timestamp;
                    }
                    let avg = sum / (invoices.length - 1);

                    // Plan the next collect in the average time between invoices
                    this.next_collect_timestamp = this.last_collect_timestamp + avg;
                }
            }
        }
        else {
            // Cancel next collect
            this.next_collect_timestamp = Number.NaN;
        }
    }

    addInvoice(invoice: any) {
        this.invoices.push({
            id: invoice.id,
            timestamp: invoice.timestamp
        });
    }

    sortInvoices() {
        // Order invoices by timestamp
        this.invoices.sort((a, b) => a.timestamp - b.timestamp);
    }
}

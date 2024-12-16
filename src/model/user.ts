export class User {
    id: string;
    customer_id: string;
    remote_id: string;

    constructor(customer_id, remote_id) {
        this.id = "";
        this.customer_id = customer_id;
        this.remote_id = remote_id;
    }
}

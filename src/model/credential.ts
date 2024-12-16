export class IcCredential {
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
}

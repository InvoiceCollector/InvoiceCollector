import { DatabaseFactory } from "../database/databaseFactory";
import { TermsConditionsError } from "../error";
import { SecretManagerFactory } from "../secret_manager/secretManagerFactory";
import { IcCredential } from "./credential";

export type TermsConditions = {
    verificationCode: string,
    sentTimestamp: number,
    validTimestamp?: number;
}

export class User {

    id: string;
    customer_id: string;
    remote_id: string;
    location: string | null;
    locale: string;
    termsConditions: TermsConditions;

    constructor(customer_id: string, remote_id: string, location: string | null, locale: string, termsConditions: TermsConditions) {
        this.id = "";
        this.customer_id = customer_id;
        this.remote_id = remote_id;
        this.location = location;
        this.locale = locale;
        this.termsConditions = termsConditions;
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

    async delete() {
        // Get all credentials
        const credentials: IcCredential[] = await this.getCredentials();

        // Delete all secrets in secret manager
        const secret_manager_ids: string[] = credentials.map(credential => credential.secret_manager_id);
        await SecretManagerFactory.getSecretManager().deleteSecrets(secret_manager_ids);

        // Delete all credentials
        await DatabaseFactory.getDatabase().deleteCredentials(this.id);

        // Delete the user
        await DatabaseFactory.getDatabase().deleteUser(this.id);
    }

    checkTermsConditions(): void {
        if (this.termsConditions.validTimestamp == undefined) {
            throw new TermsConditionsError(this.locale);
        }
    }
}

import { DatabaseFactory } from './database/databaseFactory';
import { AbstractSecretManager } from './secret_manager/abstractSecretManager';
import { SecretManagerFactory } from './secret_manager/secretManagerFactory';
import { AuthenticationBearerError, OauthError, MissingField } from './error';
import { generate_token } from './utils';
import { collectors } from './collectors/collectors';
import { User } from './model/user';
import { Customer } from './model/customer';
import { IcCredential } from './model/credential';
import { CollectionTask } from './task/collectionTask';
import { error } from 'console';

export class Server {

    static OAUTH_TOKEN_VALIDITY_DURATION_MS = Number(process.env.OAUTH_TOKEN_VALIDITY_DURATION_MS) || 600000; // 10 minutes, in ms 

    secret_manager: AbstractSecretManager;
    tokens: object;

    collection_task: CollectionTask;

    constructor() {
        // Connect to database
        DatabaseFactory.getDatabase().connect();

        this.secret_manager = SecretManagerFactory.getSecretManager();
        this.tokens = {}

        this.collection_task = new CollectionTask(this.secret_manager);
	}

    // ---------- BEARER TOKEN NEEDED ----------

    async post_authorize(bearer, remote_id) {
        // Get user from bearer
        const customer = await Customer.fromBearer(bearer);

        // Check if customer exists
        if(!customer) {
            throw new AuthenticationBearerError();
        }

        //Check if remote_id field is missing
        if(!remote_id) {
            throw new MissingField("remote_id");
        }

        // Get user from remote_id
        let user = await customer.getUserFromRemoteId(remote_id);

        // If user does not exist, create it
        if(!user) {
            user = new User(customer.id, remote_id);
            // Create user in database
            user.commit();
        }

        // Generate oauth token
        const token = generate_token();

        // Map token with user
        this.tokens[token] = user;

        // Schedule token delete after 1 hour
        setTimeout(() => {
            delete this.tokens[token];
            console.log(`Token ${token} deleted`);
        }, Server.OAUTH_TOKEN_VALIDITY_DURATION_MS);

        return { token }
    }

    async post_collect(bearer, credential_id) {
        // Get customer from bearer
        const customer = await Customer.fromBearer(bearer);

        // Check if customer exists
        if(!customer) {
            throw new AuthenticationBearerError();
        }

        // Check if credential_id field is missing
        if(!credential_id) {
            throw new MissingField("credential_id");
        }

        // Get credential from credential_id
        const credential = await IcCredential.fromId(credential_id);

        // Check if credential exists
        if (!credential) {
            throw new Error(`Credential with id "${credential_id}" not found.`);
        }

        // Get user from credential
        const user = await credential.getUser();

        // Check if user exists
        if (!user) {
            throw new Error(`Could not find user for credential with id "${credential.id}".`);
        }

        // Check if user belongs to customer
        if (user.customer_id != customer.id) {
            throw new Error(`User with id "${user.id}" does not belong to customer with id "${customer.id}".`);
        }

        // Schedule next collect now
        credential.next_collect_timestamp = Date.now()

        // Update credential in database
        await credential.commit();
    }

    // ---------- OAUTH TOKEN NEEDED ----------

    get_token_mapping(token): User {
        // Check if token is missing or incorrect
        if(!token || !this.tokens.hasOwnProperty(token)) {
            throw new OauthError();
        }

        return this.tokens[token];
    }

    async get_credentials(token) {
        // Get user from token
         const user = this.get_token_mapping(token);

        // Get credentials from user
        let credentials = await user.getCredentials();

        // Build response 
        return credentials.map((credential) => {
            const collector = this.get_collector(credential.key);
            return {
                collector: collector.CONFIG,
                note: credential.note,
                credential_id: credential.id,
                state: credential.state,
                error: credential.error
            }
        });
    }

    async post_credential(token, key, params) {
        // Get user from token
         const user = this.get_token_mapping(token);

        //Check if key field is missing
        if(!key) {
            throw new MissingField("key");
        }

        //Check if params field is missing
        if(!params) {
            throw new MissingField("params");
        }

        // Check if collector exists
        this.get_collector(key);

        // Get credential note
        const note = params.note;
        delete params.note;

        // Add credential to Secure Storage
        const secret = await this.secret_manager.addSecret(`${user.customer_id}_${user.id}_${key}`, params);

        // Create credential
        let credential = new IcCredential(
            user.id,
            key,
            note,
            secret.id
        );

        // Compute next collect
        credential.computeNextCollect();

        // Create credential in database
        await credential.commit();
    }

    async delete_credential(token, credential_id) {
        // Get user from token
        const user = this.get_token_mapping(token);

        // Get credential from credential_id
        const credential = await user.getCredential(credential_id);

        // Check if credential exists
        if (!credential) {
            throw new Error(`Credential with id "${credential_id}" not found.`);
        }

        // Check if credential belongs to user
        if (credential.user_id != user.id) {
            throw new Error(`Credential with id "${credential_id}" does not belong to user.`);
        }

        // Delete credential from Secure Storage
        await this.secret_manager.deleteSecret(credential.secret_manager_id);

        // Delete credential
        await credential.delete();
    }

    // ---------- NO OAUTH TOKEN NEEDED ----------

    get_collectors(): object {
        console.log(`Listing all collectors`);
        return collectors.map((collector) => collector.CONFIG);
    }

    get_collector(key) {
        const collector_pointers = collectors.filter((collector) => collector.CONFIG.key.toLowerCase() == key.toLowerCase())
        if(collector_pointers.length == 0) {
            throw new Error(`No collector with key "${key}" found.`);
        }
        if(collector_pointers.length > 1) {
            throw new Error(`Found ${collector_pointers.length} collectors with key "${key}".`);
        }
        return collector_pointers[0]
    }
}

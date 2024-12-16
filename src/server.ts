import { Queue, Worker, QueueOptions } from 'bullmq';
import axios from 'axios';

import { AbstractDatabase } from './database/abstractDatabase';
import { DatabaseFactory } from './database/databaseFactory';
import { AbstractSecretManager } from './secret_manager/abstractSecretManager';
import { SecretManagerFactory } from './secret_manager/secretManagerFactory';
import { LogServer } from './log_server';
import { AuthenticationBearerError, OauthError, LoggableError, MissingField } from './error';
import { generate_token } from './utils';
import { collectors } from './collectors/collectors';
import { User } from './model/user';
import { Customer } from './model/customer';
import { IcCredential } from './model/credential';

export class Server {

    static OAUTH_TOKEN_VALIDITY_DURATION_MS = Number(process.env.OAUTH_TOKEN_VALIDITY_DURATION_MS) || 600000; // 10 minutes, in ms 

    secret_manager: AbstractSecretManager;
    log_server: LogServer;
    tokens: object;

    collect_invoice_queue: Queue;
    collect_invoice_worker: Worker;

    constructor() {
        const connection = {
            host: String(process.env.REDIS_HOST),
            port: Number(process.env.REDIS_PORT)
        };

        this.secret_manager = SecretManagerFactory.getSecretManager();
        this.log_server = new LogServer()
        this.tokens = {}

        this.collect_invoice_queue = new Queue('collect_invoice', { connection });
        this.collect_invoice_worker = new Worker(
            'collect_invoice',
            async data => {
                return await this.collect(
                    data.data.credential_id
                );
            },
            {
                connection,
                concurrency: 1
            }
        );
        
        this.collect_invoice_worker.on("completed", (job, invoices) => {
            console.log(`${job.id} has completed!`);

            // Send invoices to callback
            axios.post(job.data.callback, {
                type: "invoices",
                invoices
            })
            .then(function (response) {
                console.log("Callback succesfully reached");
            })
            .catch(function (error) {
                console.error(`Could not reach callback ${error.request._currentUrl}`);
            });

            // Log success
            this.log_server.logSuccess(job.data.collector);
        });
        
        this.collect_invoice_worker.on("failed", (job, err) => {
            console.error(`${job?.id} has failed:`);

            // Log error if is LoggableError
            if(err instanceof LoggableError) {

                // Send error to callback
                axios.post(job?.data.callback, {
                    type: "error",
                    error: {
                        collector: err.collector,
                        version: err.version,
                        name: err.name,
                        message: err.message
                    }
                })
                .then(function (response) {
                    console.log("Callback succesfully reached");
                })
                .catch(function (error) {
                    console.error(`Could not reach callback ${error.request._currentUrl}`);
                });

                // Log error
                this.log_server.logError(err);
            }
        });
        
        console.log("Worker started!");
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

        // Add job in queue
        console.log(`Adding job to the queue to collect ${credential.id}`);
        let job = await this.collect_invoice_queue.add(credential.key, {credential_id: credential.id, callback: customer.callback});
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
                credential_id: credential.id
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

    async collect(credential_id) {
        console.log(`Collecting invoices for ${credential_id}`);

        // Get credential from credential_id
        const credential = await IcCredential.fromId(credential_id);

        // Check if credential exists
        if (!credential) {
            throw new Error(`Credential with id "${credential_id}" not found.`);
        }

        // Get secret from secret_manager_id
        const secret = await this.secret_manager.getSecret(credential.secret_manager_id);

        // Get collector from key and instantiate it
        const collector_class = this.get_collector(credential.key);
        const collector = new collector_class();

        // Collect invoices
        const invoices = await collector.collect(secret.value);

        return {type: "success", invoices}
    }
}

const { Queue, Worker } = require('bullmq');
const axios = require('axios');

const DatabaseFactory = require('./database/databaseFactory.js');
const SecretManagerFactory = require('./secret_manager/secretManagerFactory.js');
const LogServer = require('./log_server.ts');
const { AuthenticationBearerError, OauthError, LoggableError, MissingField } = require('./error.js')
const utils = require('./utils.js')
const collectors = require('./collectors/collectors.js')

class Server {

    static OAUTH_TOKEN_VALIDITY_DURATION_MS = process.env.OAUTH_TOKEN_VALIDITY_DURATION_MS || 600000; // 10 minutes, in ms 

    constructor() {
        const connection = {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        };

        this.database = DatabaseFactory.getDatabase();
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
            console.error(`${job.id} has failed:`);

            // Send error to callback
            axios.post(job.data.callback, {
                type: "error",
                error: {
                    collector: err.collector,
                    version: err.version,
                    name: err.name,
                    message: err.message
                },
                metadata: job.data.metadata || {}
            })
            .then(function (response) {
                console.log("Callback succesfully reached");
            })
            .catch(function (error) {
                console.error(`Could not reach callback ${error.request._currentUrl}`);
            });

            // Log error if is LoggableError
            if(err instanceof LoggableError) {
                this.log_server.logError(err);
            }
        });
        
        console.log("Worker started!");
	}

    // ---------- AUTHORIZE ----------

    async get_customer_from_bearer(bearer) {
        // Check if bearer is missing or does not start with "Bearer "
        if(!bearer || !bearer.startsWith("Bearer ")) {
            throw new AuthenticationBearerError()
        }

        // Get customer from bearer
        return await this.database.getCustomer(bearer.split(' ')[1]);
    }

    async post_authorize(bearer, remote_id) {
        // Get user from bearer
        const customer = await this.get_customer_from_bearer(bearer);

        //Check if remote_id field is missing
        if(!remote_id) {
            throw new MissingField("remote_id");
        }

        // Check if customer exists
        if(!customer) {
            throw new AuthenticationBearerError();
        }

        // Generate oauth token
        const token = utils.generate_token();

        // Create request record in
        this.tokens[token] = {
            customer_id: customer._id,
            remote_id
        }

        // Schedule token delete after 1 hour
        setTimeout(() => {
            delete this.tokens[token];
            console.log(`Token ${token} deleted`);
        }, Server.OAUTH_TOKEN_VALIDITY_DURATION_MS);

        return { token }
    }

    // ---------- OAUTH TOKEN NEEDED ----------

    get_token_mapping(token) {
        // Check if token is missing or incorrect
        if(!token || !this.tokens.hasOwnProperty(token)) {
            throw new OauthError();
        }

        return this.tokens[token];
    }

    async get_credentials(token) {
        // Get customer_id and remote_id from token
         const { customer_id, remote_id } = this.get_token_mapping(token);

        // Get user from customer_id and remote_id
        const user = await this.database.getUser(customer_id, remote_id);

        // Get credentials from user
        let credentials = await this.database.getCredentials(user._id);

        // Build response 
        return credentials.map((credential) => {
            const collector = this.get_collector(credential.key);
            return {
                collector: collector.CONFIG,
                note: credential.note,
                credential_id: credential._id.toString()
            }
        });
    }

    async post_credential(token, key, params) {
        // Get customer_id and remote_id from token
         const { customer_id, remote_id } = this.get_token_mapping(token);

        //Check if key field is missing
        if(!key) {
            throw new MissingField("key");
        }

        //Check if params field is missing
        if(!params) {
            throw new MissingField("params");
        }

        // Get collector from name
        const collector = this.get_collector(key);

        // Get user from customer_id and remote_id
        let user = await this.database.getUser(customer_id, remote_id);

        // Get credential note
        const note = params.note;
        delete params.note;

        // Add credential to Secure Storage
        const secret = await this.secret_manager.addSecret(`${customer_id}_${user._id}_${key}`, params);

        // If user does not exist, create it
        if(!user) {
            user = await this.database.createUser({
                customer_id,
                remote_id
            });
        }

        // Create credential
        await this.database.createCredential({
            user_id: user._id,
            key,
            note,
            secret_manager_id: secret.id
        });
    }

    async delete_credential(token, credential_id) {
        // Get customer_id and remote_id from token
        const { customer_id, remote_id } = this.get_token_mapping(token);

        // Get user from customer_id and remote_id
        const user = await this.database.getUser(customer_id, remote_id);

        // Get credential from credential_id
        const credential = await this.database.getCredential(credential_id);

        // Check if credential exists
        if (!credential) {
            throw new Error(`Credential with id "${credential_id}" not found.`);
        }

        // Delete credential from Secure Storage
        this.secret_manager.deleteSecret(credential.secret_manager_id);

        // Delete credential
        await this.database.deleteCredential(user._id, credential_id);
    }

    // ---------- NO OAUTH TOKEN NEEDED ----------

    collectors() {
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

    async post_collect(bearer, credential_id) {
        // Get customer from bearer
        const customer = await this.get_customer_from_bearer(bearer);

        // Check if credential_id field is missing
        if(!credential_id) {
            throw new MissingField("credential_id");
        }

        // Get credential from credential_id
        const credential = await this.database.getCredential(credential_id);

        // Check if credential exists
        if (!credential) {
            throw new Error(`Credential with id "${credential_id}" not found.`);
        }

        // Add job in queue
        console.log(`Adding job to the queue to collect ${credential._id}`);
        let job = await this.collect_invoice_queue.add(credential.key, {credential_id, callback: customer.callback});
    }

    async collect(credential_id) {
        console.log(`Collecting invoices for ${credential_id}`);

        // Get credential from credential_id
        const credential = await this.database.getCredential(credential_id);

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

module.exports = {
	Server
}
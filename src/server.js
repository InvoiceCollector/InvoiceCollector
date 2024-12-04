const { Queue, Worker } = require('bullmq');
const axios = require('axios');

const DatabaseFactory = require('./database/databaseFactory.js');
const { AuthenticationBearerError, OauthError, ElementNotFoundError, UnfinishedCollector } = require('./error.js')
const utils = require('./utils.js')

const invoice_collector_server = axios.create({
    baseURL: `${process.env.LOG_SERVER_ENDPOINT}/v1`,
    //headers: {'Authorization': `Bearer ${}`}
  });

const collectors = require('./collectors/collectors.js')
const { MissingField } = require('./error.js')

class Server {

    static OAUTH_TOKEN_VALIDITY_DURATION_MS = process.env.OAUTH_TOKEN_VALIDITY_DURATION_MS || 600000; // 10 minutes, in ms

    constructor() {
        const connection = {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        };

        this.database = DatabaseFactory.getDatabase(process.env.DATABASE_TYPE);
        this.tokens = {}

        this.collect_invoice_queue = new Queue('collect_invoice', { connection });
        this.collect_invoice_worker = new Worker(
            'collect_invoice',
            async data => {
                return await this.collect(
                    data.key,
                    data.params
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
                invoices,
                metadata: job.data.metadata
            })
            .then(function (response) {
                console.log("Callback succesfully reached");
            })
            .catch(function (error) {
                console.error(`Could not reach callback ${error.request.res.responseUrl}`);
            });

            // Log success
            invoice_collector_server.post("/log/success", {
                collector: job.data.collector
            })
            .then(function (response) {
                console.log("Invoice-Collector server succesfully reached");
            })
            .catch(function (error) {
                console.error(`Could not reach Invoice-Collector server at ${error.request.res.responseUrl}`);
            });
        });
        
        this.collect_invoice_worker.on("failed", (job, err) => {
            console.error(`${job.id} has failed:`);
            console.error(err.stack);

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
                console.error(`Could not reach callback ${error.request.res.responseUrl}`);
            });

            // Log error if is ElementNotFoundError or UnfinishedCollector
            if(err instanceof ElementNotFoundError || err instanceof UnfinishedCollector) {
                invoice_collector_server.post("/log/error", {
                    collector: err.collector,
                    version: err.version,
                    error: err.name,
                    traceback: err.stack,
                    source_code: err.source_code,
                    screenshot: err.screenshot
                })
                .then(function (response) {
                    console.log("Invoice-Collector server succesfully reached");
                })
                .catch(function (error) {
                    console.error(`Could not reach Invoice-Collector server at ${error.request.res.responseUrl}`);
                });
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

        // Get user from customer_id and remote_id
        let user = await this.database.getUser(customer_id, remote_id);

        // Save credentials to Secure Storage
        // TODO: Implement Secure Storage
        const ss_id = params;

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
            ss_id
        });
    }

    async delete_credential(token, credential_id) {
        // Get customer_id and remote_id from token
        const { customer_id, remote_id } = this.get_token_mapping(token);

        // Get user from customer_id and remote_id
        const user = await this.database.getUser(customer_id, remote_id);

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

    async post_collect(bearer, key, params) {
        // Get customer from bearer
        const customer = await this.get_customer_from_bearer(bearer);

        // Check if key field is missing
        if(!key) {
            throw new MissingField("key");
        }

        // Check if params field is missing
        if(!params) {
            throw new MissingField("params");
        }

        // Get collector from name
        const collector = this.get_collector(key);

        // Check mandatory parameters
        for(const collector_param of collector.CONFIG.params) {
            if(collector_param.mandatory && !params.hasOwnProperty(collector_param.name)) {
                throw new MissingField(`params.${collector_param.name}`);
            }
        }

        // Add job in queue
        console.log(`Adding job to the queue "${key}"`);
        let job = await this.collect_invoice_queue.add(collector.CONFIG.name, {key, params});
    }

    async collect(key, params) {
        console.log(`Collecting invoices on "${key}"`);

        // Get collector from key and instantiate it
        const collector = this.get_collector(key)();

        // Collect invoices
        const invoices = await collector.collect(params);

        return {type: "success", invoices}
    }
}

module.exports = {
	Server
}
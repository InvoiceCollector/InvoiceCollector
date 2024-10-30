const { Queue, Worker } = require('bullmq');
const axios = require('axios');

const { ElementNotFoundError, UnfinishedCollector } = require('./error.js')

const invoice_collector_server = axios.create({
    baseURL: `${process.env.LOG_SERVER_ENDPOINT}/v1`,
    //headers: {'Authorization': `Bearer ${}`}
  });

const collectors = require('./collectors/collectors.js')
const { MissingField } = require('./error.js')

class Server {

    constructor() {
        const connection = {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        };
        this.collect_invoice_queue = new Queue('collect_invoice', { connection });
        this.collect_invoice_worker = new Worker(
            'collect_invoice',
            async job => {
                return await this.collect(
                    job.name,
                    job.data
                );
            },
            {
                connection,
                concurrency: 1
            }
        );
        
        this.collect_invoice_worker.on("completed", (job, invoices) => {
            console.log(`${job.id} has completed!`);

            // Send invoices to webhook
            axios.post(job.data.webhook, {
                collector: job.data.collector,
                metadata: job.data.metadata,
                type: "Success",
                invoices
            })
            .then(function (response) {
                console.log("Webhook succesfully reached");
            })
            .catch(function (error) {
                console.error(`Could not reach webhook ${error.request.res.responseUrl}`);
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

            // Send error to webhook
            axios.post(job.data.webhook, {
                collector: job.data.collector,
                metadata: job.data.metadata || {},
                type: "Error",
                name: err.name,
                message: err.message,
                stack: err.stack
            })
            .then(function (response) {
                console.log("Webhook succesfully reached");
            })
            .catch(function (error) {
                console.error(`Could not reach webhook ${error.request.res.responseUrl}`);
            });

            // Log error if is ElementNotFoundError or UnfinishedCollector
            if(err instanceof ElementNotFoundError || err instanceof UnfinishedCollector) {
                invoice_collector_server.post("/log/error", {
                    collector: job.data.collector,
                    error: `${err.name}: ${err.message}`,
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

    collectors() {
        console.log(`Listing all collectors`);
        return collectors.map((collector) => collector.CONFIG.name);
    }

    get_collector(name) {
        const collector_pointers = collectors.filter((collector) => collector.CONFIG.name.toLowerCase() == name.toLowerCase())
        if(collector_pointers.length == 0) {
            throw new Error(`No collector named "${name}" found.`);
        }
        if(collector_pointers.length > 1) {
            throw new Error(`Found ${collector_pointers.length} collectors named "${name}".`);
        }
        return collector_pointers[0]
    }

    async post_collect(data) {
        //Get collector from name
        const collector = this.get_collector(data.collector);

        //Check mandatory parameters
        for(const collector_param of collector.CONFIG.params) {
            if(collector_param.mandatory && !data.params.hasOwnProperty(collector_param.name)) {
                throw new MissingField(`params.${collector_param.name}`);
            }
        }

        //Add job in queue
        console.log(`Adding job to the queue "${data.collector}"`);
        let job = await this.collect_invoice_queue.add(collector.CONFIG.name, data);
    }

    async collect(name, data) {
        console.log(`Collecting invoices on "${name}"`);

        //Get collector from name
        const collector_pointer = this.get_collector(name);
        const collector = new collector_pointer();

        //Collect invoices
        const invoices = await collector.collect(data.params);

        return {type: "success", invoices}
    }

    async get_collect(token) {
        //Return request record in database
        //TODO
    }
}

module.exports = {
	Server
}
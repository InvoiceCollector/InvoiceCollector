const collectors = require('../collectors/collectors.js')
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

class Server {

    constructor() {
        const connection = new IORedis({maxRetriesPerRequest: null});
        this.collect_invoice_queue = new Queue('collect_invoice', { connection });
        this.collect_invoice_worker = new Worker(
            'collect_invoice',
            async job => {
                return await collect(
                    job.name,
                    new job.data.collector_pointer(),
                    job.data.body
                );
            },
            {
                connection,
                concurrency: 1
            }
        );
	}

    collectors() {
        console.log(`Listing all collectors`);
        return collectors.map((collector) => collector.NAME);
    }

    async post_collect(name, body = {}) {
        //Get collector from name
        const collector_pointers = collectors.filter((collector) => collector.NAME == name)
        if(collector_pointers.length == 0) {
            throw new Error(`No collector named "${name}" found.`);
        }
        if(collector_pointers.length > 1) {
            throw new Error(`Found ${collector_pointers.length} collectors named "${name}".`);
        }

        //Check mandatory parameters
        //TODO

        //Add job in queue
        await this.collect_invoice_queue.add(collector_pointers[0].NAME, {
            collector_pointer: collector_pointers[0],
            body
        })
    }

    async collect(name, collector, body = {}) {

        console.log(`Collecting invoices on "${name}"`);

        //Collect invoices
        const invoices = await collector.collect(body);

        //Download invoices to token folder
        await collector.download(invoices); //TODO

        return {type: "success", token: "my_token", invoices}
    }

    async get_collect(token) {
        //Return request record in database
        //TODO
    }
}

module.exports = {
	Server
}
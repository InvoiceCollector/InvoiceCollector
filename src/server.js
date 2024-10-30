const { Queue, Worker } = require('bullmq');

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
        
        this.collect_invoice_worker.on("completed", (job, data) => {
            console.log(`${job.id} has completed!`);
            console.log(data);
        });
        
        this.collect_invoice_worker.on("failed", (job, err) => {
            console.error(`${job.id} has failed:`);
            console.error(err);
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

    async post_collect(name, params = {}) {
        console.log(`Adding job to the queue "${name}"`);

        //Get collector from name
        const collector = this.get_collector(name);

        //Check mandatory parameters
        for(const collector_param of collector.CONFIG.params) {
            if(collector_param.mandatory && !params.hasOwnProperty(collector_param.name)) {
                throw new MissingField(`params.${collector_param.name}`);
            }
        }

        //Add job in queue
        let job = await this.collect_invoice_queue.add(collector.CONFIG.name, params);
    }

    async collect(name, params = {}) {
        console.log(`Collecting invoices on "${name}"`);

        //Get collector from name
        const collector_pointer = this.get_collector(name);
        const collector = new collector_pointer();

        //Collect invoices
        const invoices = await collector.collect(params);

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
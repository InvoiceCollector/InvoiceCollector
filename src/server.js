const { Cluster } = require('puppeteer-cluster');
const { Driver } = require('../src/driver.js');
const collectors = require('../collectors/collectors.js')

class Server {
    constructor() {
        this.driver = new Driver({
            launch: {
                headless:false,
                args:[
                    '--start-maximized' // you can also use '--start-fullscreen'
                 ]
            },
            view_port: {
                width: 1920,
                height: 1080,
            }
        });
	}

    async start() {
        await this.driver.start();

        await this.cluster.task(async ({ page, data: context}) => {
            console.log(`Collecting invoice on "${context.collector.NAME}"`);

            //Instanciate collector
            const collector = new context.collector();

            context.driver = new Driver(page);
            const invoices = await collector.collect(context);
            console.log(invoices);
        });
    }

    async stop() {
        if (this.cluster) {
            await this.driver.close();
        }
    }

    collectors() {
        return collectors.map((collector) => collector.NAME);
    }

    collect(name, body = {}) {
        if (this.cluster == null) {
            throw new Error('Cluster not initialized. Start the server first.');
        }

        //Get collector from name
        const matching_collector = collectors.filter((collector) => collector.NAME == name)
        if(matching_collector.length == 0) {
            throw new Error(`No collectors with the name "${name}".`);
        }
        if(matching_collector.length > 1) {
            throw new Error(`Found ${matching_collector.length} collectors with the name "${name}".`);
        }

        console.log(`Adding collector "${name}" on queue`);

        //Generate unique token
        //TODO
        
        var context = {
            collector: matching_collector[0],
            config: body,
        }
        this.cluster.queue(context);

        //Return token
        return "my_token" //TODO
    }
}

module.exports = {
	Server
}
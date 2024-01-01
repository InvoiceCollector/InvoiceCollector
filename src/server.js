const puppeteer = require('puppeteer');
const collectors = require('../collectors/collectors.js')

class Server {

    PUPPETEER_CONFIG = {
        headless:false,
        args:[
            '--start-maximized' // you can also use '--start-fullscreen'
        ]
    };

    constructor() {
        this.browser = null;
	}

    async start() {
        this.browser = await puppeteer.launch(this.PUPPETEER_CONFIG);
    }

    async stop() {
        if(this.browser) {
            await this.browser.close();
        }
    }

    collectors() {
        console.log(`Listing all collectors`);
        return collectors.map((collector) => collector.NAME);
    }

    async collect(name, body = {}) {
        if(!this.browser) {
            throw new Error(`Browser not started.`);
        }

        //Get collector from name
        const matching_collector = collectors.filter((collector) => collector.NAME == name)
        if(matching_collector.length == 0) {
            throw new Error(`No collector named "${name}" found.`);
        }
        if(matching_collector.length > 1) {
            throw new Error(`Found ${matching_collector.length} collectors named "${name}".`);
        }

        console.log(`Collecting invoice on "${name}"`);

        //Generate unique token
        //TODO
        
        var context = {
            collector: matching_collector[0],
            config: body,
        }

        //Instanciate collector
        const collector = new context.collector(this.browser);
        const invoices = await collector.collect(context);
        console.log(invoices);

        //Return token
        return "my_token" //TODO
    }
}

module.exports = {
	Server
}
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

    async post_collect(name, body = {}) {
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

        //Create request record in database as pending
        //TODO

        console.log(`Collecting invoice on "${name}"`);

        //Instanciate collector
        const collector = new matching_collector[0](this.browser);
        const invoices = await collector.collect(body);

        //Generate unique token
        //TODO

        //Download invoices to token folder
        await collector.download(invoices); //TODO

        //Update request record in database
        //TODO

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
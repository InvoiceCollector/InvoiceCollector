const axios = require('axios');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { Driver } = require('../driver.js');
const { NotAuthenticatedError, InMaintenanceError, UnfinishedCollector } = require('../error.js')

class AbstractCollector {
    constructor(config) {
        this.config = config;
    }

    async download(invoices) {
        for(let invoice of invoices) {
            if(invoice.type == "link") {
                const format = invoice.mime.split('/')[1]
                const response = await axios.get(invoice.link, {
                    responseType: 'arraybuffer',
                });
                fs.writeFileSync(`media/${this.name}_${invoice.id}.${format}`, response.data);
            }
        }
    }

    //NOT IMPLEMENTED

    async collect(params) {
        throw new Error('`collect` is not implemented.');
    }
}

class ScrapperCollector extends AbstractCollector {
    
    PUPPETEER_CONFIG = {
        headless:'new',
        args:[
            '--start-maximized', // you can also use '--start-fullscreen'
            '--no-sandbox',
        ]
    };

    PAGE_CONFIG = {
        width: 1920,
        height: 1080,
    };

    constructor(config) {
        super(config);
    }

    async collect(params) {
        if(!params.username) {
            throw new Error('Field "username" is missing.');
        }
        if(!params.password) {
            throw new Error('Field "password" is missing.');
        }

        //Start browser
        let browser = await puppeteer.launch(this.PUPPETEER_CONFIG);

        //Open new page
        let page = await browser.newPage();
        await page.setViewport(this.PAGE_CONFIG);
        await page.goto(this.config.entry_url);

        let driver = new Driver(page);

        //Check if website is in maintenance
        const is_in_maintenance = await this.is_in_maintenance(driver, params)
        if (is_in_maintenance) {
            throw new InMaintenanceError();
        }

        //Login
        await this.login(driver, params)

        //Check if authenticated
        const { authenticated, message } = await this.is_authenticated(driver, params)
        if (authenticated) {
            throw new NotAuthenticatedError({cause: message});
        }

        //Collect invoices
        const invoices = await this.run(driver, params)
        if (invoices === undefined) {
            const source_code = await page.content();
            const screenshot = await page.screenshot({encoding: 'base64'});
            throw new UnfinishedCollector(await page.url(), source_code, screenshot);
        }

        return invoices;
    }

    //NOT IMPLEMENTED

    async is_authenticated(driver, params){
        //Assume the password is correct
        return {
            authenticated: true,
            message: null
        };
    }

    async is_in_maintenance(driver, params){
        //Assume the website is not in maintenance
        return false;
    }
}

class ApiCollector extends AbstractCollector {
    constructor(config) {
        super(config);
    }
}

module.exports = {
	ScrapperCollector,
    ApiCollector,
}

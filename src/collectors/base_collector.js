const axios = require('axios');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { Driver } = require('../driver.js');
const { NotAuthenticatedError, InMaintenanceError } = require('../error.js')

class AbstractCollector {
    constructor(name) {
        this.name = name;
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

    async collect(config) {
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

    constructor(name, entry_url) {
        super(name);
        this.entry_url = entry_url;
    }

    async collect(config) {
        if(!config.username) {
            throw new Error('Field "username" is missing.');
        }
        if(!config.password) {
            throw new Error('Field "password" is missing.');
        }

        //Start browser
        let browser = await puppeteer.launch(this.PUPPETEER_CONFIG);

        //Open new page
        let page = await browser.newPage();
        await page.setViewport(this.PAGE_CONFIG);
        await page.goto(this.entry_url);

        let driver = new Driver(page);
        try {
            const invoices = await this.run(driver, config)
            await page.close();
            return invoices;
        }
        catch (err) {
            if(!(await this.is_authenticated(driver))) {
                await browser.close();
                throw new NotAuthenticatedError({cause: err});
            }
            if(await this.is_in_maintenance(driver)) {
                await browser.close();
                throw new InMaintenanceError({cause: err});
            }
            await browser.close();
            throw err;
        }
    }

    //NOT IMPLEMENTED

    async is_authenticated(driver){
        //Assume the password is correct
        return true;
    }

    async is_in_maintenance(driver){
        //Assume the website is not in maintenance
        return false;
    }
}

class ApiCollector extends AbstractCollector {
    //TODO
}

module.exports = {
	ScrapperCollector,
    ApiCollector,
}

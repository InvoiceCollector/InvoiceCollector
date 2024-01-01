const { Driver } = require('../src/driver.js');
const axios = require('axios');
const fs = require('fs');

class AbstractCollector {
    constructor(name) {
        this.name = name;
    }

    async collect() {
        throw new Error('`collect` is not implemented.');
    }

    async download(invoices) {
        for(let invoice of invoices) {
            const response = await axios.get(invoice.url, {
                responseType: 'arraybuffer',
            });
            fs.writeFileSync(`media/${this.name}_${invoice.id}.${invoice.format}`, response.data);
        }
    }
}

class ScrapperCollector extends AbstractCollector {
    
    PAGE_CONFIG = {
        width: 1920,
        height: 1080,
    };

    constructor(name, entry_url, browser) {
        super(name);
        this.entry_url = entry_url;
        this.browser = browser;
    }

    async collect(context) {
        if(!context.config.username) {
            throw new Error('Field "username" is missing.');
        }
        if(!context.config.password) {
            throw new Error('Field "password" is missing.');
        }

        let page = await this.browser.newPage();
        await page.setViewport(this.PAGE_CONFIG);

        context.driver = new Driver(page); //TODO get page from newPage

        await context.driver.goto(this.entry_url);
        const invoices = await this.run(context.driver, context.config)
        await this.download(invoices);
        return invoices;
    }
}

class ApiCollector extends AbstractCollector {
    //TODO
}

module.exports = {
	ScrapperCollector,
    ApiCollector,
}

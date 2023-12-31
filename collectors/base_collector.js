const axios = require('axios');
const fs = require('fs');
const { Driver } = require('../src/driver.js');
const { NotAuthenticatedError, InMaintenanceError } = require('../src/error.js')

class AbstractCollector {
    constructor(name) {
        this.name = name;
    }

    async download(invoices) {
        for(let invoice of invoices) {
            const response = await axios.get(invoice.url, {
                responseType: 'arraybuffer',
            });
            fs.writeFileSync(`media/${this.name}_${invoice.id}.${invoice.format}`, response.data);
        }
    }

    //NOT IMPLEMENTED

    async collect() {
        throw new Error('`collect` is not implemented.');
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

    async collect(config) {
        if(!config.username) {
            throw new Error('Field "username" is missing.');
        }
        if(!config.password) {
            throw new Error('Field "password" is missing.');
        }

        //Open new page
        let page = await this.browser.newPage();
        await page.setViewport(this.PAGE_CONFIG);
        await page.goto(this.entry_url);

        const driver = new Driver(page);
        try {
            const invoices = await this.run(driver, config)
            await page.close();
            return invoices;
        }
        catch (err) {
            if(!(await this.is_authenticated(driver))) {
                await page.close();
                throw new NotAuthenticatedError({cause: err});
            }
            if(await this.is_in_maintenance(driver)) {
                await page.close();
                throw new InMaintenanceError({cause: err});
            }
            await page.close();
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

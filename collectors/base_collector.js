const { Driver } = require('../lib/driver/driver.js');
const axios = require('axios');
const fs = require('fs');

class AbstractCollector {
    constructor(name) {
        this.name = name;
    }

    collect() {
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
    constructor(name, entry_url) {
        super(name);

        this.entry_url = entry_url;
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

    async collect(context) {
        await this.driver.launch();
        await this.driver.goto(this.entry_url);
        const invoices = await this.run(context)
        await this.download(invoices);
        await this.driver.close();
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

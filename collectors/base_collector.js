const { Driver } = require('../src/driver.js');
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
    }

    async collect(context) {
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

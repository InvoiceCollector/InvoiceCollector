const prompt = require('prompt-sync')({sigint: true});
const fs = require('fs');
const { Server } = require("../src/server.ts");
const { collectors } = require('../src/collectors/collectors.ts');

(async () => {
    // Get collector name
    let name;
    if(process.argv[2]) {
        name = process.argv[2]
        console.log(`collector: ${name}`)
    }
    else {
        name = prompt('collector: ');
    }

    // Get collectors
    const collector_pointers = collectors.filter((collector) => collector.CONFIG.name.toLowerCase() == name.toLowerCase())
    if(collector_pointers.length == 0) {
        throw new Error(`No collector named "${name}" found.`);
    }
    if(collector_pointers.length > 1) {
        throw new Error(`Found ${collector_pointers.length} collectors named "${name}".`);
    }

    // Get collectors
    const collector = new collector_pointers[0]();

    // Update puppeteer config
    if (collector.PUPPETEER_CONFIG) {
      collector.PUPPETEER_CONFIG.headless = false;
    }

    let params = {}
    let argv_index = 3;

    // Loop throught each config
    for(const param_key of Object.keys(collector.config.params)) {
        if(process.argv[argv_index]) {
            params[param_key] = process.argv[argv_index]
            if(param_key.toLowerCase().includes("password") || param_key.toLowerCase().includes("secret") || param_key.toLowerCase().includes("token")) {
                console.log(`${param_key}: <hidden>`)
            }
            else {
                console.log(`${param_key}: ${process.argv[argv_index]}`)
            }
        }
        else {
            if(param_key.toLowerCase().includes("password") || param_key.toLowerCase().includes("secret") || param_key.toLowerCase().includes("token")) {
                params[param_key] = prompt.hide(`${param_key}: `);
            }
            else {
                params[param_key] = prompt(`${param_key}: `);
            }
        }
        argv_index++;
    }

    // Collect invoices
    const invoices = await collector.collect_new_invoices(params, true, [], Server.DEFAULT_LOCALE);
    console.log(invoices);

    for (const invoice of invoices) {
        // Save data to file
        fs.writeFileSync(`./media/${name}_${invoice.id}.pdf`, Buffer.from(invoice.data, 'base64'));
    }
})();

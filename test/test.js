const collectors = require('../src/collectors/collectors.js')
const prompt = require('prompt-sync')({sigint: true});

(async () => {
    // Get collector name
    let name;
    if(process.argv[2]) {
        name = process.argv[2]
        console.log(`Collector:${name}`)
    }
    else {
        name = prompt('Collector:');
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
    for(const [param_key, param] of Object.entries(collector.config.params)) {
        if(process.argv[argv_index]) {
            params[param_key] = process.argv[argv_index]
            if(param_key.toLowerCase().includes("password") || param_key.toLowerCase().includes("secret") || param_key.toLowerCase().includes("token")) {
                console.log(`${param_key}:<hidden>`)
            }
            else {
                console.log(`${param_key}:${process.argv[argv_index]}`)
            }
        }
        else {
            if(param_key.toLowerCase().includes("password") || param_key.toLowerCase().includes("secret") || param_key.toLowerCase().includes("token")) {
                params[param_key] = prompt.hide(`${param.name}:`);
            }
            else {
                params[param_key] = prompt(`${param.name}:`);
            }
        }
        argv_index++;
    }

    // Collect invoices
    const invoices = await collector.collect(params);
    console.log(invoices);
})();

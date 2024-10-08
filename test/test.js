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
    const collector_pointers = collectors.filter((collector) => collector.NAME.toLowerCase() == name.toLowerCase())
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
      collector.PUPPETEER_CONFIG.args = ['--start-maximized'];
    }
    
    // Loop throught each config
    //TODO

    // Get username
    let username;
    if(process.argv[3]) {
        username = process.argv[3]
        console.log(`Username:${username}`)
    }
    else {
        username = prompt('Username:');
    }

    // Get password
    let password;
    if(process.argv[4]) {
        password = process.argv[4]
        console.log(`Password:${password}`)
    }
    else {
        password = prompt.hide('Password:');
    }

    // Collect invoices
    const invoices = await collector.collect({username, password});
    console.log(invoices);
})();

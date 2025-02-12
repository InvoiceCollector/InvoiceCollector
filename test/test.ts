import promptSync from 'prompt-sync';
const prompt = promptSync({});
import fs from 'fs';
import { Server } from "../src/server";
import { collectors } from '../src/collectors/collectors';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
    // Get collector key
    let key;
    if(process.argv[2]) {
        key = process.argv[2]
        console.log(`collector: ${key}`)
    }
    else {
        key = prompt('collector: ');
    }

    // Get collectors
    const matching_collectors = collectors.filter((collector) => collector.config.key == key.toLowerCase())
    if(matching_collectors.length == 0) {
        throw new Error(`No collector with key "${key}" found.`);
    }
    if(matching_collectors.length > 1) {
        throw new Error(`Found ${matching_collectors.length} collectors with key "${key}".`);
    }

    // Get collectors
    const collector = matching_collectors[0];

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
    const invoices = await collector.collect_new_invoices(params, true, [], Server.DEFAULT_LOCALE, {country: "FR"});
    console.log(`${invoices.length} invoices downloaded`);

    for (const invoice of invoices) {
        // If data is not null
        if (invoice.data) {
            // Save data to file
            fs.writeFileSync(`./media/${key}_${invoice.id}.pdf`, Buffer.from(invoice.data, 'base64'));
        }
        else {
            console.warn(`Invoice ${invoice.id} was not downloaded`);
        }
    }
})();

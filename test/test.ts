import promptSync from 'prompt-sync';
const prompt = promptSync({});
import fs from 'fs';
import { Server } from "../src/server";
import { collectors } from '../src/collectors/collectors';
import dotenv from 'dotenv';
import { LoggableError } from '../src/error';
dotenv.config();

(async () => {
    let id;
    try {
        // Get collector
        if(process.argv[2]) {
            id = process.argv[2]
            console.log(`collector: ${id}`)
        }
        else {
            id = prompt('collector: ');
        }

        // Get collectors
        const matching_collectors = collectors.filter((collector) => collector.config.id == id.toLowerCase())
        if(matching_collectors.length == 0) {
            throw new Error(`No collector with id "${id}" found.`);
        }
        if(matching_collectors.length > 1) {
            throw new Error(`Found ${matching_collectors.length} collectors with id "${id}".`);
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
        const invoices = await collector.collect_new_invoices(params, true, [], Server.DEFAULT_LOCALE, {country: "FR", lat: '', lon: ''});
        console.log(`${invoices.length} invoices downloaded`);

        for (const invoice of invoices) {
            // If data is not null
            if (invoice.data) {
                // Save data to file
                fs.writeFileSync(`./media/${id}_${invoice.id}.pdf`, Buffer.from(invoice.data, 'base64'));
            }
            else {
                console.warn(`Invoice ${invoice.id} was not downloaded`);
            }
        }
    } catch (error) {
        console.error(error);

        if (error instanceof LoggableError) {
            
            // Save screenshot if exists
            if (error.screenshot) {
                fs.writeFileSync(`./media/${id}_screenshot.png`, Buffer.from(error.screenshot, 'base64'));
            }

            // Save source code if exists
            if (error.source_code) {
                fs.writeFileSync(`./media/${id}_source_code.html`, error.source_code);
            }
        }
    }
})();

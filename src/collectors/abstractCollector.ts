import axios from 'axios';

export type Config = {
    name: string,
    description: string,
    instructions?: string,
    version: string,
    website: string,
    logo: string,
    params: {
        [key: string]: {
            name: string,
            placeholder: string,
            mandatory: boolean
        }
    },
    entry_url?: string,
    baseUrl?: string,
}

export abstract class AbstractCollector {
    config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    async download_direct_link(invoice: any): Promise<void> {
        const response = await axios.get(invoice.link, {
            responseType: 'arraybuffer',
        });
        invoice.data = response.data.toString("base64");
        invoice.type = "base64";
    }

    async collect_new_invoices(params: any, download: boolean, previousInvoices: any[], locale: string, location: any): Promise<any[]> {
            // Check if a mandatory field is missing
            for (const [key, value] of Object.entries(this.config.params)) {
                if (value.mandatory && !params[key]) {
                    throw new Error(`Field "${key}" is missing.`);
                }
            }

            const invoices = await this._collect(params, locale, location);

            // Get new invoices
            const newInvoices = invoices.filter((inv) => !previousInvoices.includes(inv.id));

            if(newInvoices.length > 0) {
                console.log(`Found ${invoices.length} invoices but only ${newInvoices.length} are new`);

                // Download new invoices if needed
                if(download) {
                    console.log(`Downloading ${newInvoices.length} invoices`);

                    // For each invoice
                    for(let newInvoice of newInvoices) {
                        await this._download(newInvoice)
                    }

                    // Order invoices by timestamp
                    newInvoices.sort((a, b) => a.timestamp - b.timestamp);
                }
                else {
                    console.log(`This is the first collect. Do not download invoices`);
                }
            }
            else {
                console.log(`Found ${invoices.length} invoices but none are new`);
            }

            // Close the collector resources
            this.close();

            return newInvoices;
    }

    //NOT IMPLEMENTED

    abstract _collect(params: any, locale: string, location: any): Promise<any[]>;

    abstract _download(invoice: any): Promise<void>;

    async close() {
        // Assume the collector does not need to close anything
    }
}

import axios from 'axios';
import { Location } from '../proxy/abstractProxy';

export type Config = {
    key: string,
    type: "web" | "api",
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
    useProxy: boolean,
    entryUrl?: string,
    baseUrl?: string,
}

export type Invoice = {
    id: string,
    timestamp: number,
    amount?: string,
    link?: string
}

export type DownloadedInvoice = Invoice & {
    data: string | null
}

export type CompleteInvoice = DownloadedInvoice & {
    mimetype: string | null
}

export abstract class AbstractCollector {
    config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    async download_direct_link(invoice: Invoice): Promise<DownloadedInvoice> {
        if (!invoice.link) {
            throw new Error('Field `link` is missing in the invoice object.');
        }
        const response = await axios.get(invoice.link, {
            responseType: 'arraybuffer',
        });
        return {
            ...invoice,
            data: response.data.toString("base64")
        };
    }

    async collect_new_invoices(params: any, download: boolean, previousInvoices: any[], locale: string, location: Location | null): Promise<CompleteInvoice[]> {
            // Check if a mandatory field is missing
            for (const [key, value] of Object.entries(this.config.params)) {
                if (value.mandatory && !params[key]) {
                    throw new Error(`Field "${key}" is missing.`);
                }
            }

            const invoices = await this._collect(params, locale, location);

            // Get new invoices
            const newInvoices = invoices.filter((inv) => !previousInvoices.includes(inv.id));
            let completeInvoices: CompleteInvoice[] = [];

            if(newInvoices.length > 0) {
                console.log(`Found ${invoices.length} invoices but only ${newInvoices.length} are new`);

                // Download new invoices if needed
                if(download) {
                    console.log(`Downloading ${newInvoices.length} invoices`);

                    // For each invoice
                    for(let newInvoice of newInvoices) {
                        const completeInvoice = await this._download(newInvoice);

                        // If data is not null, the invoice is ready
                        if(completeInvoice.data != null && completeInvoice.data.length > 0) {
                            completeInvoices.push(completeInvoice);
                        }
                    }

                    // Order invoices by timestamp
                    completeInvoices.sort((a, b) => a.timestamp - b.timestamp);
                }
                else {
                    console.log(`This is the first collect. Do not download invoices`);

                    // Add not downloaded invoice to the list
                    for(let newInvoice of newInvoices) {
                        completeInvoices.push({
                            ...newInvoice,
                            data: null,
                            mimetype: null
                        });
                    }
                }
            }
            else {
                console.log(`Found ${invoices.length} invoices but none are new`);
            }

            // Close the collector resources
            this.close();

            return completeInvoices;
    }

    //NOT IMPLEMENTED

    abstract _collect(params: any, locale: string, location: Location | null): Promise<Invoice[]>;

    abstract _download(invoice: Invoice): Promise<CompleteInvoice>;

    async close(): Promise<void> {
        // Assume the collector does not need to close anything
    }
}

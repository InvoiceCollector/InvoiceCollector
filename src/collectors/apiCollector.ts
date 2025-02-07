import axios, { AxiosInstance } from "axios";
import { AbstractCollector, Config, Invoice, DownloadedInvoice } from "./abstractCollector";
import { UnfinishedCollectorError } from '../error';

export type ApiConfig = Config & {
    baseUrl: string
}

export abstract class ApiCollector extends AbstractCollector {

    instance: AxiosInstance | null;

    constructor(config: ApiConfig) {
        super(config);
        this.instance = null;
    }

    async _collect(params: any, locale: any, location: any): Promise<Invoice[]> {
        console.log(`API Collector, do not use proxy`);

        // Initialise axios instance
        this.instance = axios.create({
            baseURL: this.config.baseUrl,
            timeout: 1000
        });

        // Collect invoices
        const invoices = await this.collect(this.instance, params)
        
        // If invoices is undefined, collector is unfinished
        if (invoices === undefined) {
            throw new UnfinishedCollectorError(this.config.name, this.config.version, this.instance.defaults.baseURL || "", "", "");
        }

        return invoices;
    }

    async _download(invoice: Invoice): Promise<DownloadedInvoice> {
        if (!this.instance) {
            throw new Error('Instance is not initialized.');
        }
        const downloadedInvoice = await this.download(this.instance, invoice);

        // If data field is missing, collector is unfinished
        if (!downloadedInvoice) {
            throw new UnfinishedCollectorError(this.config.name, this.config.version, this.instance.defaults.baseURL || "", "", "");
        }

        return downloadedInvoice;
    }
    
    //NOT IMPLEMENTED
    abstract collect(instance: AxiosInstance, params: any): Promise<Invoice[] | void>;
    
    abstract download(instance: AxiosInstance, invoice: Invoice): Promise<DownloadedInvoice>;
}

import axios, { AxiosInstance } from "axios";
import { AbstractCollector } from "./abstractCollector";
import { UnfinishedCollector } from '../error';

export abstract class ApiCollector extends AbstractCollector {

    instance: AxiosInstance | null;

    constructor(config) {
        super(config);
        this.instance = null;
    }

    async _collect(params: any, locale: any, location: any): Promise<any[]> {
        // Initialise axios instance
        const instance = axios.create({
            baseURL: this.config.baseUrl,
            timeout: 1000
        });

        // Collect invoices
        const invoices = await this.collect(instance, params)
        if (invoices === undefined) {
            throw new UnfinishedCollector(this.config.name, this.config.version, instance.defaults.baseURL || "", "", "");
        }

        return invoices;
    }

    async _download(invoice: any): Promise<void> {
        if (!this.instance) {
            throw new Error('Instance is not initialized.');
        }
        await this.download(this.instance, invoice);
    }
    
    //NOT IMPLEMENTED
    abstract collect(instance: AxiosInstance, params: any): Promise<any[] | void>;
    
    abstract download(instance: AxiosInstance, invoice: any): Promise<void>;
}

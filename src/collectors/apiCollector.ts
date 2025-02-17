import axios, { AxiosInstance } from "axios";
import { AbstractCollector, Invoice, DownloadedInvoice, CompleteInvoice } from "./abstractCollector";
import { CollectorError, LoggableError, UnfinishedCollectorError } from '../error';
import { mimetypeFromBase64 } from '../utils';
import { Location } from "../proxy/abstractProxy";

export type ApiConfig = {
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
    baseUrl: string,
    useProxy?: boolean,
}

export abstract class ApiCollector extends AbstractCollector {

    static TYPE: "api" = 'api';

    instance: AxiosInstance | null;

    constructor(config: ApiConfig) {
        super({
            ...config,
            id: '',
            type: ApiCollector.TYPE,
            useProxy: config.useProxy === undefined ? false : config.useProxy,
    });
        this.instance = null;
    }

    async _collect(params: any, locale: any, location: Location | null): Promise<Invoice[]> {
        console.log(`API Collector, do not use proxy`);

        // Initialise axios instance
        this.instance = axios.create({
            baseURL: this.config.baseUrl,
            timeout: 1000
        });

        try {
            // Collect invoices
            const invoices = await this.collect(this.instance, params)
            
            // If invoices is undefined, collector is unfinished
            if (invoices === undefined) {
                throw new UnfinishedCollectorError(this.config.id, this.config.version, this.instance.defaults.baseURL || "", "", "");
            }

            return invoices;
        } catch (error) {
            if (error instanceof CollectorError) {
                throw error;
            }

            // For unexpected error happening during the collection, log the error
            throw new LoggableError(
                "An error occured while collecting invoices from API",
                this.config.id,
                this.config.version,
                '',
                '',
                '',
                { cause: error }
            );
        }
    }

    async _download(invoice: Invoice): Promise<CompleteInvoice> {
        if (!this.instance) {
            throw new Error('Instance is not initialized.');
        }

        try {
            let downloadedInvoice = await this.download(this.instance, invoice);

            // If data field is missing, collector is unfinished
            if (!downloadedInvoice) {
                throw new UnfinishedCollectorError(this.config.id, this.config.version, this.instance.defaults.baseURL || "", "", "");
            }

            return {
                ...downloadedInvoice,
                mimetype: mimetypeFromBase64(downloadedInvoice.data)
            };
        } catch (error) {
            if (error instanceof CollectorError) {
                throw error;
            }

            // For unexpected error happening during the download, log the error
            throw new LoggableError(
                "An error occured while downloading invoices from API",
                this.config.id,
                this.config.version,
                invoice.link || '',
                '',
                '',
                { cause: error }
            );
        }
    }
    
    //NOT IMPLEMENTED
    abstract collect(instance: AxiosInstance, params: any): Promise<Invoice[] | void>;
    
    abstract download(instance: AxiosInstance, invoice: Invoice): Promise<DownloadedInvoice>;
}

import { AbstractCollector, Invoice, DownloadedInvoice, CompleteInvoice } from "./abstractCollector";
import { Driver } from '../driver';
import { AuthenticationError, MaintenanceError, UnfinishedCollectorError } from '../error';
import { Server } from "../server"
import { ProxyFactory } from '../proxy/proxyFactory';
import { mimetypeFromBase64 } from '../utils';
import { Location } from "../proxy/abstractProxy";

export type ScrapperConfig = {
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
    entryUrl: string,
    useProxy?: boolean,
}

export abstract class ScrapperCollector extends AbstractCollector {

    static TYPE: "web" = 'web';

    driver: Driver | null;

    constructor(config: ScrapperConfig) {
        super({
            ...config,
            id: '',
            type: ScrapperCollector.TYPE,
            useProxy: config.useProxy === undefined ? true : config.useProxy,
        });
        this.driver = null;
    }

    async _collect(params: any, locale: string, location: Location | null): Promise<Invoice[]> {
        // Get proxy
        const proxy = this.config.useProxy ? await ProxyFactory.getProxy().get(location) : null;

        // Start browser and page
        this.driver = new Driver(this);
        await this.driver.open(proxy);

        // Open entry url
        await this.driver.goto(this.config.entryUrl);

        // Check if website is in maintenance
        const is_in_maintenance = await this.is_in_maintenance(this.driver, params)
        if (is_in_maintenance) {
            await this.driver.close()
            throw new MaintenanceError(this.config.name, this.config.version);
        }

        // Login
        const login_error = await this.login(this.driver, params)

        // Check if not authenticated
        if (login_error) {
            await this.driver.close()
            throw new AuthenticationError(Server.i18n.__({ phrase: login_error, locale }), this.config.name, this.config.version);
        }

        // Collect invoices
        const invoices = await this.collect(this.driver, params)
        
        // If invoices is undefined, collector is unfinished
        if (invoices === undefined) {
            const url = this.driver.url();
            const source_code = await this.driver.sourceCode();
            const screenshot = await this.driver.screenshot();
            await this.driver.close()
            throw new UnfinishedCollectorError(this.config.name, this.config.version, url, source_code, screenshot);
        }

        return invoices;
    }

    async _download(invoice: Invoice): Promise<CompleteInvoice> {
        if (!this.driver) {
            throw new Error('Driver is not initialized.');
        }
        let downloadedInvoice = await this.download(this.driver, invoice);

        // If downloadedInvoice is undefined, collector is unfinished
        if (!downloadedInvoice) {
            const url = this.driver.url();
            const source_code = await this.driver.sourceCode();
            const screenshot = await this.driver.screenshot();
            await this.driver.close()
            throw new UnfinishedCollectorError(this.config.name, this.config.version, url, source_code, screenshot);
        }

        return {
            ...downloadedInvoice,
            mimetype: mimetypeFromBase64(downloadedInvoice.data)
        };
    }

    async close() {
        if (this.driver != null) {
            // Close the browser
            await this.driver.close();
        }
    }

    //NOT IMPLEMENTED

    abstract login(driver: Driver, params: any): Promise<string | void>;

    abstract collect(driver: Driver, params: any): Promise<Invoice[] | void>;

    abstract download(driver: Driver, invoice: Invoice): Promise<DownloadedInvoice | void>;

    async is_in_maintenance(driver: Driver, params: any): Promise<boolean>{
        //Assume the website is not in maintenance
        return false;
    }

    // DOWNLOAD METHODS

    async download_link(driver: Driver, invoice: Invoice): Promise<DownloadedInvoice> {
        if (!invoice.link) {
            throw new Error('Field `link` is missing in the invoice object.');
        }
        return {
            ...invoice,
            data: await driver.downloadFile(invoice.link)
        }
    }

    async download_webpage(driver: Driver, invoice: Invoice): Promise<DownloadedInvoice> {
        await driver.goto(invoice.link);
        return {
            ...invoice,
            data: await driver.pdf()
        }
    }

    async download_from_file(driver: Driver, invoice: Invoice): Promise<DownloadedInvoice> {
        return {
            ...invoice,
            data: await driver.waitForFileToDownload(false)
        }
    }
}

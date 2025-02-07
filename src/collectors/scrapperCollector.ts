import fs from 'fs';
import path from 'path';
import { AbstractCollector, Config } from "./abstractCollector";
import { Driver } from '../driver';
import { AuthenticationError, MaintenanceError, UnfinishedCollectorError } from '../error';
import { Server } from "../server"
import { ProxyFactory } from '../proxy/proxyFactory';

export abstract class ScrapperCollector extends AbstractCollector {

    driver: Driver | null;

    constructor(config: Config) {
        super(config);
        this.driver = null;
    }

    async _collect(params: any, locale: string, location: any): Promise<any[]> {
        // Get proxy
        const proxy = await ProxyFactory.getProxy().get(location);

        // Start browser and page
        this.driver = new Driver(this);
        await this.driver.open(proxy);

        // Open entry url
        await this.driver.goto(this.config.entry_url);

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

    async _download(invoice: any): Promise<void> {
        if (!this.driver) {
            throw new Error('Driver is not initialized.');
        }
        await this.download(this.driver, invoice);

        // If data field is missing, collector is unfinished
        if (!invoice.data) {
            const url = this.driver.url();
            const source_code = await this.driver.sourceCode();
            const screenshot = await this.driver.screenshot();
            await this.driver.close()
            throw new UnfinishedCollectorError(this.config.name, this.config.version, url, source_code, screenshot);
        }
    }

    async close() {
        if (this.driver != null) {
            // Close the browser
            await this.driver.close();
        }
    }

    //NOT IMPLEMENTED

    abstract login(driver: Driver, params: any): Promise<string | void>;

    abstract collect(driver: Driver, params: any): Promise<any[] | void>;

    abstract download(driver: Driver, invoice: any): Promise<void>;

    async is_in_maintenance(driver: Driver, params: any): Promise<boolean>{
        //Assume the website is not in maintenance
        return false;
    }

    // DOWNLOAD METHODS

    async download_link(driver: Driver, invoice: any): Promise<void> {
        invoice.data = await driver.downloadFile(invoice.link);
        invoice.type = "base64";
    }

    async download_webpage(driver: Driver, invoice: any): Promise<void> {
        await driver.goto(invoice.link);
        invoice.data = await driver.pdf();
        invoice.type = "base64";
    }

    async download_from_file(driver: Driver, invoice: any): Promise<void> {
        const files = fs.readdirSync(Driver.DOWNLOAD_PATH);
        if (files.length === 0) {
            throw new Error('No files found in the download path.');
        }
        const filePath = path.join(Driver.DOWNLOAD_PATH, files[0]);
        invoice.data = fs.readFileSync(filePath, {encoding: 'base64'});
        invoice.type = "base64";

        //Delete all file in the download path
        for (const file of files) {
            fs.unlinkSync(path.join(Driver.DOWNLOAD_PATH, file));
        }
    }
}

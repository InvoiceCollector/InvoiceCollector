import fs from 'fs';
import path from 'path';
import { AbstractCollector, Config } from "./abstractCollector";
import { Driver } from '../driver';
import { AuthenticationError, MaintenanceError, UnfinishedCollector } from '../error';
import { Server } from "../server"
import { ProxyFactory } from '../proxy/proxyFactory';

export class ScrapperCollector extends AbstractCollector {

    driver: Driver | null;

    constructor(config: Config) {
        super(config);
        this.driver = null;
        this.downloadMethods['link'] = this.download_link;
        this.downloadMethods['webpage'] = this.download_webpage;
    }

    async download_link(invoice): Promise<void> {
        if (!this.driver) {
            throw new Error('Driver is not initialized.');
        }
        invoice.data = await this.driver.downloadFile(invoice.link);
        invoice.type = "base64";
    }

    async download_webpage(invoice): Promise<void> {
        if (!this.driver) {
            throw new Error('Driver is not initialized.');
        }
        await this.driver.goto(invoice.link);
        invoice.data = await this.driver.pdf();
        invoice.type = "base64";
    }

    async download_from_file(invoice): Promise<void> {
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

    async collect(params, locale, location): Promise<any[]> {
        // Check if a mandatory field is missing
        for (const [key, value] of Object.entries(this.config.params)) {
            if (value.mandatory && !params[key]) {
                throw new Error(`Field "${key}" is missing.`);
            }
        }

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
        const invoices = await this.run(this.driver, params)
        if (invoices === undefined) {
            const url = this.driver.url();
            const source_code = await this.driver.sourceCode();
            const screenshot = await this.driver.screenshot();
            await this.driver.close()
            throw new UnfinishedCollector(this.config.name, this.config.version, url, source_code, screenshot);
        }

        return invoices;
    }

    async close() {
        if (this.driver != null) {
            // Close the browser
            await this.driver.close();
        }
    }

    //NOT IMPLEMENTED

    async login(driver: Driver, params): Promise<string | void>{
        throw new Error('`login` is not implemented.');
    }

    async run(driver: Driver, params): Promise<any[] | void> {
        throw new Error('`run` is not implemented.');
    }

    async is_in_maintenance(driver, params): Promise<boolean>{
        //Assume the website is not in maintenance
        return false;
    }
}

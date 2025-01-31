import axios from 'axios';
import { ConnectResult, connect } from 'puppeteer-real-browser';
import { Driver } from '../driver';
import { AuthenticationError, MaintenanceError, UnfinishedCollector } from '../error';
import { Server } from "../server"
import fs from 'fs';
import path from 'path';

export class AbstractCollector {
    config: any;
    downloadMethods: { [key: string]: (invoice: any) => Promise<void> };

    constructor(config) {
        this.config = config;
        this.downloadMethods = {
            "link": this.download_direct_link,
            "bytes": this.download_bytes,
        };
    }

    async download(invoices): Promise<void> {
        for(let invoice of invoices) {
            if (this.downloadMethods[invoice.type]) {
                await this.downloadMethods[invoice.type].call(this, invoice);
            }
        }

        // Order invoices by timestamp
        invoices.sort((a, b) => a.timestamp - b.timestamp);
    }

    async download_direct_link(invoice): Promise<void> {
        const response = await axios.get(invoice.link, {
            responseType: 'arraybuffer',
        });
        invoice.data = response.data.toString("base64");
        invoice.type = "base64";
    }

    async download_bytes(invoice): Promise<void> {
        invoice.data = btoa(String.fromCharCode.apply(null, invoice.bytes));
        delete invoice.bytes;
        invoice.type = "base64";
    }

    async collect_new_invoices(params, download, previousInvoices, locale): Promise<any[]> {
            const invoices = await this.collect(params, locale);

            // Get new invoices
            const newInvoices = invoices.filter((inv) => !previousInvoices.includes(inv.id));

            if(newInvoices.length > 0) {
                console.log(`Found ${invoices.length} invoices but only ${newInvoices.length} are new`);

                // Download new invoices if needed
                if(download) {
                    console.log(`Downloading ${newInvoices.length} invoices`);
                    await this.download(newInvoices);
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

    async collect(params, locale): Promise<any[]> {
        throw new Error('`collect` is not implemented.');
    }

    async close() {
        // Assume the collector does not need to close anything
    }
}

export class ScrapperCollector extends AbstractCollector {
    
    DOWNLOAD_PATH = path.resolve(__dirname, '../../media/download');
    PUPPETEER_CONFIG = {
        headless: true,
        args:[
            '--start-maximized', // you can also use '--start-fullscreen'
        ]
    };

    PAGE_CONFIG = {
        width: 1920,
        height: 1080,
    };

    driver: Driver | null;
    authentication_error: string | null;

    constructor(config) {
        super(config);
        this.driver = null;
        this.authentication_error = null;
        this.downloadMethods['webpage'] = this.download_webpage;
    }

    async download_webpage(invoice): Promise<void> {
        if (!this.driver) {
            throw new Error('Driver is not initialized.');
        }
        await this.driver.goto(invoice.link);

        invoice.bytes = await this.driver.pdf();
        await this.download_bytes(invoice);
    }

    async download_from_file(invoice): Promise<void> {
        const files = fs.readdirSync(this.DOWNLOAD_PATH);
        if (files.length === 0) {
            throw new Error('No files found in the download path.');
        }
        const filePath = path.join(this.DOWNLOAD_PATH, files[0]);
        invoice.data = fs.readFileSync(filePath, {encoding: 'base64'});
        invoice.type = "base64";

        //Delete all file in the download path
        for (const file of files) {
            fs.unlinkSync(path.join(this.DOWNLOAD_PATH, file));
        }
    }

    async collect(params, locale): Promise<any[]> {
        if(!params.username) {
            throw new Error('Field "username" is missing.');
        }
        if(!params.password) {
            throw new Error('Field "password" is missing.');
        }

        // Start browser and page
        let { browser, page }: ConnectResult = await connect(this.PUPPETEER_CONFIG);
        await page.setViewport(this.PAGE_CONFIG);
        await page.goto(this.config.entry_url);

        const client = await page.createCDPSession();
        await client.send("Page.setDownloadBehavior", {
            behavior: "allow",
            downloadPath: this.DOWNLOAD_PATH,
          });

        this.driver = new Driver(page, this);

        // Check if website is in maintenance
        const is_in_maintenance = await this.is_in_maintenance(this.driver, params)
        if (is_in_maintenance) {
            await browser.close()
            throw new MaintenanceError(this.config.name, this.config.version);
        }

        // Login
        const login_error = await this.login(this.driver, params)

        // Check if not authenticated
        if (login_error) {
            await browser.close()
            throw new AuthenticationError(Server.i18n.__({ phrase: login_error, locale }), this.config.name, this.config.version);
        }

        // Collect invoices
        const invoices = await this.run(this.driver, params)
        if (invoices === undefined) {
            const url = await page.url();
            const source_code = await page.content();
            const source_code_base64 = Buffer.from(source_code).toString('base64')
            const screenshot = await page.screenshot({encoding: 'base64'});
            await browser.close()
            throw new UnfinishedCollector(this.config.name, this.config.version, url, source_code_base64, screenshot);
        }

        return invoices;
    }

    async close() {
        // Close the browser
        await this.driver?.page.browser().close();
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

export class ApiCollector extends AbstractCollector {
    constructor(config) {
        super(config);
    }
}

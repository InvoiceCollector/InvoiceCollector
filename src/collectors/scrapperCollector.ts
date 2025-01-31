import { ConnectResult, connect } from 'puppeteer-real-browser';
import { AbstractCollector } from "./abstractCollector";
import { Driver } from '../driver';
import { AuthenticationError, MaintenanceError, UnfinishedCollector } from '../error';
import { Server } from "../server"
import fs from 'fs';
import path from 'path';

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
        invoice.data = await this.driver.pdf();
        invoice.type = "base64";
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

import axios from 'axios';
import fs from 'fs';
import puppeteer, { PuppeteerLaunchOptions } from 'puppeteer';
import { Driver } from '../driver';
import { NotAuthenticatedError, InMaintenanceError, UnfinishedCollector } from '../error';

export class AbstractCollector {
    config: any;

    constructor(config) {
        this.config = config;
    }

    async download(params, invoices) {
        console.log(`Downloading ${invoices.length} invoices`);

        for(let invoice of invoices) {
            if(invoice.type == "link") {
                const response = await axios.get(invoice.link, {
                    responseType: 'arraybuffer',
                });
                invoice.data = response.data.toString("base64");
                invoice.type = "base64";
            }
        }

        // Order invoices by timestamp
        invoices.sort((a, b) => a.timestamp - b.timestamp);
    }

    //NOT IMPLEMENTED

    async collect(params) {
        throw new Error('`collect` is not implemented.');
    }
}

export class ScrapperCollector extends AbstractCollector {
    
    PUPPETEER_CONFIG: PuppeteerLaunchOptions = {
        headless:'new',
        args:[
            '--start-maximized', // you can also use '--start-fullscreen'
            '--no-sandbox',
        ]
    };

    PAGE_CONFIG = {
        width: 1920,
        height: 1080,
    };

    constructor(config) {
        super(config);
    }

    async collect(params) {
        if(!params.username) {
            throw new Error('Field "username" is missing.');
        }
        if(!params.password) {
            throw new Error('Field "password" is missing.');
        }

        //Start browser
        let browser = await puppeteer.launch(this.PUPPETEER_CONFIG);

        //Open new page
        let page = await browser.newPage();
        await page.setViewport(this.PAGE_CONFIG);
        await page.goto(this.config.entry_url);

        let driver = new Driver(page);

        //Check if website is in maintenance
        const is_in_maintenance = await this.is_in_maintenance(driver, params)
        if (is_in_maintenance) {
            await browser.close()
            throw new InMaintenanceError(this.config.name, this.config.version);
        }

        //Login
        await this.login(driver, params)

        //Check if not authenticated
        const not_authenticated_message = await this.is_not_authenticated(driver, params)
        if (not_authenticated_message) {
            await browser.close()
            throw new NotAuthenticatedError(not_authenticated_message, this.config.name, this.config.version);
        }

        //Collect invoices
        const invoices = await this.run(driver, params)
        if (invoices === undefined) {
            const url = await page.url();
            const source_code = await page.content();
            const source_code_base64 = Buffer.from(source_code).toString('base64')
            const screenshot = await page.screenshot({encoding: 'base64'});
            await browser.close()
            throw new UnfinishedCollector(this.config.name, this.config.version, url, source_code_base64, screenshot);
        }

        //Download invoices to token folder
        await this.download(params, invoices);

        // Close the borwser
        await browser.close()

        return invoices;
    }

    //NOT IMPLEMENTED

    async login(driver, params){
        throw new Error('`login` is not implemented.');
    }

    async run(driver, params) {
        throw new Error('`run` is not implemented.');
    }

    async is_not_authenticated(driver, params){
        //Assume the password is correct
        return null;
    }

    async is_in_maintenance(driver, params){
        //Assume the website is not in maintenance
        return false;
    }
}

export class ApiCollector extends AbstractCollector {
    constructor(config) {
        super(config);
    }
}

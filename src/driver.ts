import path from 'path';
import { PageWithCursor, connect } from 'puppeteer-real-browser';
import { Browser } from "rebrowser-puppeteer-core";
import { ElementNotFoundError } from './error';

export class Driver {

    static DEFAULT_TIMEOUT = 10000;

    static DOWNLOAD_PATH = path.resolve(__dirname, '../media/download');
    static PUPPETEER_CONFIG = {
        args: ["--start-maximized"],
        turnstile: true,
        headless: false,
        // disableXvfb: true,
        customConfig: {},
        connectOption: {
            defaultViewport: null
        },
        plugins: []
    };

    static PAGE_CONFIG = {
        width: 1920,
        height: 1080,
    };

    collector;
    browser: Browser | null;
    page: PageWithCursor | null;

    constructor(collector) {
        this.collector = collector;
        this.browser = null;
        this.page = null;
    }

    async open(proxy: string | null = null) {
        // Clone config static object
        const puppeteerConfig = { ...Driver.PUPPETEER_CONFIG };
        // If proxy is provided
        if (proxy != null) {            
            // Set proxy
            puppeteerConfig.args.push(`--proxy-server=http=${proxy}`);
            console.log(`Using proxy: ${proxy}`);
        }
        else {
            console.log(`Do not use proxy`);
        }

        // Open browser and page
        const connectResult = await connect(puppeteerConfig);
        this.browser = connectResult.browser;
        this.page = connectResult.page;

        // Set viewport
        await this.page.setViewport(Driver.PAGE_CONFIG);

        // Set download path
        const client = await this.page.createCDPSession();
        await client.send("Page.setDownloadBehavior", {
            behavior: "allow",
            downloadPath: Driver.DOWNLOAD_PATH,
          });
    }

    async close() {
        await this.browser?.close();
    }

    // URL

    url(): string {
        if (this.page === null) {
            throw new Error('Page is not initialized.');
        }
        return this.page.url();
    }

    // GOTO

    async goto(url, network_request: string = ""): Promise<any> {
        if (this.page === null) {
            throw new Error('Page is not initialized.');
        }
        // If must wait for a specific network request
        if(network_request) {
            await this.page.setRequestInterception(true);
            const urlPromise = new Promise<any>((resolve) => {
                if (this.page === null) {
                    throw new Error('Page is not initialized.');
                }
                this.page.on('request', request => {
                    request.continue();
                });

                this.page.on('response', async (response) => {
                    if (response.url().includes(network_request) && response.status() === 200) {
                        const json = await response.json();
                        resolve(json);
                    }
                });
            });

            // Navigate to the page
            await this.page.goto(url, {waitUntil: 'networkidle0'});

            // Wait for the network request
            const response = await urlPromise;

            // Return the response
            return response;
        }
        else {
            // Navigate to the page
            await this.page.goto(url, {waitUntil: 'networkidle0'});
        }
    }

    // WAIT

    async wait_for_element(selector, raise_exception = true, timeout = Driver.DEFAULT_TIMEOUT) {
        if (this.page === null) {
            throw new Error('Page is not initialized.');
        }
        try {
            return await this.page.waitForSelector(selector.selector, {timeout});
        }
        catch (err) {
            if (raise_exception) {
                //Get time as string
                const url = await this.page.url();
                const source_code = await this.page.content();
                const source_code_base64 = Buffer.from(source_code).toString('base64')
                const screenshot = await this.page.screenshot({encoding: 'base64'});
                throw new ElementNotFoundError(this.collector.config.key, this.collector.config.version, url, source_code_base64, screenshot, selector, { cause: err })
            }
            return null;
        }
    }

    // ACTIONS

    async get_all_elements(selector, raise_exception = true, timeout = Driver.DEFAULT_TIMEOUT) {
        if (this.page === null) {
            throw new Error('Page is not initialized.');
        }
        await this.wait_for_element(selector, raise_exception, timeout);
        return await this.page.$$(selector.selector);
    }

    async get_all_attributes(selector, attributeName, raise_exception = true, timeout = Driver.DEFAULT_TIMEOUT) {
        if (this.page === null) {
            throw new Error('Page is not initialized.');
        }
        await this.wait_for_element(selector, raise_exception, timeout);
        return await this.page.$$eval(selector.selector, (elements, attr) => {
            return elements.map(element => element[attr]);
        }, attributeName);
    }

    async left_click(selector, raise_exception = true, timeout = Driver.DEFAULT_TIMEOUT) {
        let element = await this.wait_for_element(selector, raise_exception, timeout);
        if(element != null) {
            await element.click();
        }
    }

    async input_text(selector, text, raise_exception = true, timeout = Driver.DEFAULT_TIMEOUT) {
        let element = await this.wait_for_element(selector, raise_exception, timeout);
        if(element != null) {
            await element.type(text);
        }
    }

    async select_dropdown_menu_option(selector, option, raise_exception = true, timeout = Driver.DEFAULT_TIMEOUT) {
        await this.wait_for_element(selector, raise_exception, timeout);
        //TODO
    }

    // CHECK

    async check_element_exist(selector) {
        if (this.page === null) {
            throw new Error('Page is not initialized.');
        }
        return (await this.page.$$(selector.selector)).length > 0;
    }

    // PDF

    async pdf(): Promise<string> {
        if (this.page === null) {
            throw new Error('Page is not initialized.');
        }
        const bytes = await this.page.pdf({
            scale: 1,
            format: 'A4',
            printBackground: true,
        });
        return Buffer.from(bytes).toString('base64');
    }

    // SOURCE CODE

    async sourceCode() {
        if (this.page === null) {
            throw new Error('Page is not initialized.');
        }
        const source_code = await this.page.content();
        return Buffer.from(source_code).toString('base64')
    }

    // SCREENSHOT

    async screenshot() {
        if (this.page === null) {
            throw new Error('Page is not initialized.');
        }
        return await this.page.screenshot({encoding: 'base64'});
    }
}

import { PageWithCursor } from 'puppeteer-real-browser';
import { ElementNotFoundError } from './error';

export class Driver {

    static DEFAULT_TIMEOUT = 10000;

    page: PageWithCursor;
    collector;

    constructor(page, collector) {
        this.page = page;
        this.collector = collector;
    }

    // GOTO

    async goto(url, network_request: string = ""): Promise<any> {
        // If must wait for a specific network request
        if(network_request) {
            await this.page.setRequestInterception(true);
            const urlPromise = new Promise<any>((resolve) => {
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
        await this.wait_for_element(selector, raise_exception, timeout);
        return await this.page.$$(selector.selector);
    }

    async get_all_attributes(selector, attributeName, raise_exception = true, timeout = Driver.DEFAULT_TIMEOUT) {
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
        return (await this.page.$$(selector.selector)).length > 0;
    }

    // PDF

    async pdf() {
        return await this.page.pdf({
            scale: 0.5,
            format: 'A4',
            printBackground: true,
        });
    }
}

import { Page } from 'puppeteer';
import { ElementNotFoundError } from './error';

export class Driver {

    static DEFAULT_TIMEOUT = 10000;

    page: Page;
    collector;

    constructor(page, collector) {
        this.page = page;
        this.collector = collector;
    }

    // GOTO

    async goto(url) {
        await this.page.goto(url, {waitUntil: 'networkidle0'});
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
        return this.page.$$(selector);
    }

    async get_all_attributes(selector, attributeName, raise_exception = true, timeout = Driver.DEFAULT_TIMEOUT) {
        await this.wait_for_element(selector, raise_exception, timeout);
        return await this.page.$$eval(selector.selector, (elements, attr) => {
            return elements.map(element => element[attr]);
        }, attributeName);
    }

    async left_click(selector, raise_exception = true, timeout = Driver.DEFAULT_TIMEOUT) {
        await this.wait_for_element(selector, raise_exception, timeout);
        await this.page.click(selector.selector);
    }

    async input_text(selector, text, raise_exception = true, timeout = Driver.DEFAULT_TIMEOUT) {
        await this.wait_for_element(selector, raise_exception, timeout);
        await this.page.type(selector.selector, text);
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

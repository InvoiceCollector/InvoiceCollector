import { ElementNotFoundError } from './error';

export class Driver {

    static DEFAULT_TIMEOUT = 10000;

    page;

    constructor(page) {
        this.page = page;
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
                throw new ElementNotFoundError(null, null, url, source_code_base64, screenshot, selector, { cause: err })
            }
            return null;
        }
    }

    // ACTIONS

    async get_all_elements(selector) {
        await this.wait_for_element(selector);
        return this.page.$$(selector);
    }

    async get_all_attributes(selector, attributeName) {
        await this.wait_for_element(selector);
        return await this.page.$$eval(selector.selector, (elements, attr) => {
            return elements.map(element => element[attr]);
        }, attributeName);
    }

    async left_click(selector) {
        await this.wait_for_element(selector);
        await this.page.click(selector.selector);
    }

    async input_text(selector, text) {
        await this.wait_for_element(selector);
        await this.page.type(selector.selector, text);
    }

    async select_dropdown_menu_option(selector, option) {
        await this.wait_for_element(selector);
        //TODO
    }

    //CHECK

    async check_element_exist(selector) {
        return this.page.$$(selector.selector).length > 0;
    }
}

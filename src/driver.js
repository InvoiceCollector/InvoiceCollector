const fs = require('fs');
const { ElementNotFoundError } = require('./error.js')

class Driver {

    DEFAULT_TIMEOUT = 10000;

    constructor(page) {
        this.page = page;
    }

    // WAIT

    async wait_for_element(selector) {
        try {
            return await this.page.waitForSelector(selector.selector, {timeout: this.DEFAULT_TIMEOUT});
        }
        catch (err) {
            //Get time as string
            const source_code = await page.content();
            const screenshot = await page.screenshot({encoding: 'base64'});
            throw new ElementNotFoundError(await this.page.url(), source_code, screenshot, selector, { cause: err }) 
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

module.exports = {
	Driver,
}

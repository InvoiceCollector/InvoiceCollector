const fs = require('fs');
const { ElementNotFoundError } = require('./error.js')

class Driver {
    constructor(page) {
        this.page = page;
    }

    // ACTIONS

    async goto(url) {
        await this.page.goto(url);
    }

    // WAIT

    async wait_for_element(selector) {
        try {
            await this.page.waitForSelector(selector.selector);
        }
        catch (err) {
            //Get time as string
            const timestamp = Date.now().toString();
            const screenshot_path = `log/${timestamp}.png`;
            const source_code_path = `log/${timestamp}.txt`;
            fs.writeFileSync(source_code_path, await this.page.content());
            await this.page.screenshot({path: screenshot_path});
            throw new ElementNotFoundError(selector.selector, await this.page.url(), source_code_path, screenshot_path, selector.info, { cause: err }) 
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
}

module.exports = {
	Driver,
}

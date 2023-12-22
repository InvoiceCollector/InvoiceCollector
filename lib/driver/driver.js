const puppeteer = require('puppeteer');
const fs = require('fs');
const { ElementNotFoundError } = require('./error.js')

class Driver {
    constructor(config) {
        this.config = config;
    }

    // ACTIONS

    async launch() {
        this.browser = await puppeteer.launch(this.config.launch);
        this.page = await this.browser.newPage();
        await this.page.setViewport(this.config.view_port);
    }

    async close() {
        await this.browser.close();
    }

    async goto(url) {
        await this.page.goto(url);
    }

    // WAIT

    async wait_for_element(selector, infos) {
        try {
            await this.page.waitForSelector(selector);
        }
        catch (err) {
            //Get time as string
            const timestamp = Date.now().toString();
            const screenshot_path = `log/${timestamp}.png`;
            const source_code_path = `log/${timestamp}.txt`;
            fs.writeFileSync(source_code_path, await this.page.content());
            await this.page.screenshot({path: screenshot_path});
            throw new ElementNotFoundError(selector, await this.page.url(), source_code_path, screenshot_path, infos, { cause: err }) 
        }
    }

    // ACTIONS

    async get_all_elements(selector, infos) {
        await this.wait_for_element(selector, infos);
        return this.page.$$(selector);
    }

    async get_all_attributes(selector, attributeName, infos) {
        await this.wait_for_element(selector, infos);
        return await this.page.$$eval(selector, (elements, attr) => {
            return elements.map(element => element[attr]);
        }, attributeName);
    }

    async left_click(selector, infos) {
        await this.wait_for_element(selector, infos);
        await this.page.click(selector);
    }

    async input_text(selector, text, infos) {
        await this.wait_for_element(selector, infos);
        await this.page.type(selector, text);
    }

    async select_dropdown_menu_option(selector, option, infos) {
        await this.wait_for_element(selector);
        //TODO
    }
}

module.exports = {
	Driver,
}

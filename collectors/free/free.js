const { ScrapperCollector } = require('../base_collector.js');
const FreeSelectors = require('./selectors.js');

class FreeCollector extends ScrapperCollector {

    static NAME = "Free"
    static ENTRY_URL = "https://subscribe.free.fr/login/"

    constructor(browser) {
        super(FreeCollector.NAME, FreeCollector.ENTRY_URL, browser);
    }

    async is_authenticated(driver){
        return await driver.check_element_exist(FreeSelectors.CONTAINER_LOGIN_ALERT);
    }

    async run(driver, config) {
        //Authentication
        await driver.input_text(FreeSelectors.FIELD_USERNAME, config.username);
        await driver.input_text(FreeSelectors.FIELD_PASSWORD, config.password);
        await driver.left_click(FreeSelectors.BUTTON_SUBMIT);

        //Go to invoices
        await driver.left_click(FreeSelectors.BUTTON_INVOICES);

        //Get invoices
        const links = await driver.get_all_attributes(FreeSelectors.BUTTON_DOWNLOAD, "href");

        //Build return array
        return links.map(link => {
            let params = new URLSearchParams(link);
            return {
                id: params.get("no_facture"),
                url: link,
                format: 'pdf'
            };
        });
    }
}

module.exports = {
	FreeCollector,
}

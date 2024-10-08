const { ScrapperCollector } = require('../base_collector.js');
const FreeSelectors = require('./selectors.js');

class FreeCollector extends ScrapperCollector {

    static NAME = "free"
    static ENTRY_URL = "https://subscribe.free.fr/login/"

    constructor() {
        super(FreeCollector.NAME, FreeCollector.ENTRY_URL);
    }

    async is_authenticated(driver, params){
        return await driver.check_element_exist(FreeSelectors.CONTAINER_LOGIN_ALERT);
    }

    async run(driver, params) {
        //Authentication
        await driver.input_text(FreeSelectors.FIELD_USERNAME, params.username);
        await driver.input_text(FreeSelectors.FIELD_PASSWORD, params.password);
        await driver.left_click(FreeSelectors.BUTTON_SUBMIT);

        //Go to invoices
        await driver.left_click(FreeSelectors.BUTTON_INVOICES);

        //Get invoices
        const links = await driver.get_all_attributes(FreeSelectors.BUTTON_DOWNLOAD, "href");

        //Build return array
        return links.map(link => {
            let search_params = new URLSearchParams(link);
            return {
                id: search_params.get("no_facture"),
                type: "link",
                mime: 'application/pdf',
                link: link
            };
        });
    }
}

module.exports = {
	FreeCollector,
}

const { ScrapperCollector } = require('../base_collector.js');
const selectors = require('./selectors.js');

class FreeCollectorData {
    
    //LOGIN PAGE

    FIELD_LOGIN = {
        selector: "input[name='login']",
        info: "login input field"
    }
    FIELD_PASSWORD = {
        selector: "input[name='pass']",
        info: "password input field"
    }
    BUTTON_SUBMIT = {
        selector: "#ok",
        info: "submit form button"
    }
    
    //INDEX PAGE

    BUTTON_INVOICES = {
        selector: "a[title='Mes Factures']",
        info: "submit form button"
    }
    
    //INVOICES PAGE
}

class FreeCollector extends ScrapperCollector {

    static NAME = "Free"
    static ENTRY_URL = "https://subscribe.free.fr/login/"

    constructor() {
        super(FreeCollector.NAME, FreeCollector.ENTRY_URL);
    }

    async run(driver, config) {
        //Authentication
        await driver.input_text(selectors.FIELD_LOGIN, config.login);
        await driver.input_text(selectors.FIELD_PASSWORD, config.password);
        await driver.left_click(selectors.BUTTON_SUBMIT);

        //Go to invoices
        await driver.left_click(selectors.BUTTON_INVOICES);

        //Get invoices
        const links = await driver.get_all_attributes(selectors.BUTTON_DOWNLOAD, "href");

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

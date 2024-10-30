const { ScrapperCollector } = require('../base_collector.js');
const FreeSelectors = require('./selectors.js');

class FreeCollector extends ScrapperCollector {

    static CONFIG = {
        name: "free",
        description: "Free is a French telecommunications company.",
        version: "1",
        website: "https://www.free.fr",
        logo: "https://fr.wikipedia.org/wiki/Free_(entreprise)#/media/Fichier:Free_logo.svg",
        params: [
            {
                name: "username",
                description: "Email address of the account",
                mandatory: true
            },
            {
                name: "password",
                description: "Password of the account",
                mandatory: true,
            }
        ],
        entry_url: "https://subscribe.free.fr/login/"
    }

    constructor() {
        super(FreeCollector.CONFIG);
    }

    async login(driver, params){
        await driver.input_text(FreeSelectors.FIELD_USERNAME, params.username);
        await driver.input_text(FreeSelectors.FIELD_PASSWORD, params.password);
        await driver.left_click(FreeSelectors.BUTTON_SUBMIT);
    }

    async is_not_authenticated(driver, params){
        const login_alert = await driver.wait_for_element(FreeSelectors.CONTAINER_LOGIN_ALERT, false, 2000)
        if (login_alert) {
            return await login_alert.evaluate(el => el.textContent)
        }
    }

    async run(driver, params) {
        //Go to invoices
        await driver.left_click(FreeSelectors.BUTTON_INVOICES);

        //Get invoices
        const links = await driver.get_all_attributes(FreeSelectors.BUTTON_DOWNLOAD, "href");

        //Build return array
        return links.map(link => {
            let search_params = new URLSearchParams(link);
            const no_facture = search_params.get("no_facture")
            const date_string = search_params.get("mois")
            const year = date_string.slice(0, 4);
            const month = date_string.slice(4, 6) - 1; // Months in JavaScript are indexed from 0 to 11
            return {
                id: no_facture,
                type: "link",
                mime: 'application/pdf',
                timestamp: Date.UTC(year, month),
                link: link
            };
        });
    }
}

module.exports = {
	FreeCollector,
}

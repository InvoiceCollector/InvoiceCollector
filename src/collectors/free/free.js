const { ScrapperCollector } = require('../base_collector.js');
const FreeSelectors = require('./selectors.js');

class FreeCollector extends ScrapperCollector {

    static CONFIG = {
        name: "free",
        description: "Free is a French telecommunications company.",
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

    async is_authenticated(driver, params){
        const login_alert = await driver.wait_for_element(FreeSelectors.CONTAINER_LOGIN_ALERT)
        return {
            authenticated: !login_alert,
            message: await login_alert.evaluate(el => el.textContent)
        }
    }

    async run(driver, params) {
        //Go to invoices
        /*await driver.left_click(FreeSelectors.BUTTON_INVOICES);

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
        });*/
    }
}

module.exports = {
	FreeCollector,
}

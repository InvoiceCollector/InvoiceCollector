const { ScrapperCollector } = require('../base_collector.js');

class FreeCollector extends ScrapperCollector {

    static NAME = "Free"
    static ENTRY_URL = "https://subscribe.free.fr/login/"

    constructor() {
        super(FreeCollector.NAME, FreeCollector.ENTRY_URL);
    }

    async run(config) {
        //Authentication
        await this.driver.input_text("input[name='login']", config.login, {selector_info: "login input field"});
        await this.driver.input_text("input[name='pass']", config.password, {selector_info: "password input field"});
        await this.driver.left_click('#ok', {selector_info: "submit form button"});

        //Go to invoices
        await this.driver.left_click("a[title='Mes Factures']", {selector_info: "my invoices button"});

        //Get invoices
        const links = await this.driver.get_all_attributes("a[class='btn_download']", "href", {selector_info: "download invoice button"});

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

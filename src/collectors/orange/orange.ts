import { ScrapperCollector } from '../scrapperCollector';
import { OrangeSelectors } from './selectors';
import { Driver } from '../../driver';

export class OrangeCollector extends ScrapperCollector {

    static CONFIG = {
        name: "Orange",
        description: "i18n.collectors.orange.description",
        version: "1",
        website: "https://www.orange.fr",
        logo: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg",
        params: {
            id: {
                name: "i18n.collectors.all.email_or_number",
                placeholder: "i18n.collectors.all.email_or_number.placeholder",
                mandatory: true
            },
            password: {
                name: "i18n.collectors.all.password",
                placeholder: "i18n.collectors.all.password.placeholder",
                mandatory: true,
            }
        },
        entry_url: "https://espace-client.orange.fr/facture-paiement/historique-des-factures"
    }

    constructor() {
        super(OrangeCollector.CONFIG);
    }

    async login(driver: Driver, params: any): Promise<string | void> {
        // Refuse cookies
        await driver.left_click(OrangeSelectors.BUTTON_REFUSE_COOKIES, false, 5000);

        // Input email
        await driver.input_text(OrangeSelectors.FIELD_EMAIL, params.id);
        await driver.left_click(OrangeSelectors.BUTTON_CONTINUE);
    
        // Check if email is incorrect
        const email_alert = await driver.wait_for_element(OrangeSelectors.CONTAINER_LOGIN_ALERT, false, 2000);
        if (email_alert) {
            return await email_alert.evaluate(e => e.textContent) || "i18n.collectors.all.email_or_number.error";
        }
    
        // Input password
        await driver.input_text(OrangeSelectors.FIELD_PASSWORD, params.password);
        await driver.left_click(OrangeSelectors.BUTTON_SUBMIT);
    
        // Check if password is incorrect
        const password_alert = await driver.wait_for_element(OrangeSelectors.CONTAINER_PASSWORD_ALERT, false, 2000);
        if (password_alert) {
            return await password_alert.evaluate(e => e.textContent) || "i18n.collectors.all.password.error";
        }
    }

    async run(driver: Driver, params: any): Promise<void> {
        // TODO : Implement the rest of the collector
    }
}

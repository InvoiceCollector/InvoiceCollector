import { ScrapperCollector } from '../scrapperCollector';
import { USelectors } from './selectors';
import { Driver } from '../../driver';
import { Invoice } from '../abstractCollector';

export class TotalEnergiesCollector extends ScrapperCollector {

    static CONFIG = {
        name: "U Courses",
        description: "i18n.collectors.total_energies.description",
        version: "1",
        website: "https://www.coursesu.com",
        logo: "https://upload.wikimedia.org/wikipedia/fr/1/13/U_commer%C3%A7ants_logo_2018.svg",
        params: {
            id: {
                name: "i18n.collectors.all.email",
                placeholder: "i18n.collectors.all.email.placeholder",
                mandatory: true
            },
            password: {
                name: "i18n.collectors.all.password",
                placeholder: "i18n.collectors.all.password.placeholder",
                mandatory: true,
            }
        },
        entryUrl: "https://www.magasins-u.com/"
    }

    constructor() {
        super(TotalEnergiesCollector.CONFIG);
    }

    async login(driver: Driver, params: any): Promise<string | void> {
        // Refuse cookies
        await driver.left_click(USelectors.BUTTON_REFUSE_COOKIES, false, 5000);

        // Go to login page
        // Note: The login page is not the entryUrl to avoid datadom detection
        await driver.goto('https://www.coursesu.com/connexion');

        // Refuse cookies
        await driver.left_click(USelectors.BUTTON_REFUSE_COOKIES, false, 5000);

        // Input email & password
        await driver.input_text(USelectors.FIELD_EMAIL, params.id);
        await driver.input_text(USelectors.FIELD_PASSWORD, params.password);
    
        // Check if email alert
        const email_alert = await driver.wait_for_element(USelectors.CONTAINER_EMAIL_ALERT, false, 1000);
        if (email_alert) {
            return await email_alert.evaluate(e => e.textContent) || "i18n.collectors.all.email.error";
        }

        // Submit
        await driver.left_click(USelectors.BUTTON_SUBMIT);
    
        // Check if password alert
        const password_alert = await driver.wait_for_element(USelectors.CONTAINER_PASSWORD_ALERT, false, 2000);
        if (password_alert) {
            return await password_alert.evaluate(e => e.textContent) || "i18n.collectors.all.password.error";
        }
    }

    async collect(driver: Driver, params: any): Promise<void> {
        // Go to orders page
        await driver.goto('https://www.coursesu.com/mon-compte/mes-commandes');

        // Refuse cookies
        await driver.left_click(USelectors.BUTTON_REFUSE_COOKIES, false, 5000);

        // TODO : Implement the rest of the collector
    }

    async download(driver: Driver, invoice: Invoice): Promise<void> {
        // TODO : Implement the downloader
    }
}

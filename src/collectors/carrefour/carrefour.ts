import { ScrapperCollector } from '../scrapperCollector';
import { CarrefourSelectors } from './selectors';
import { Driver } from '../../driver';

export class CarrefourCollector extends ScrapperCollector {

    static CONFIG = {
        name: "Free",
        description: "i18n.collectors.free.description",
        version: "1",
        website: "https://www.carrefour.fr",
        logo: "https://upload.wikimedia.org/wikipedia/fr/3/3b/Logo_Carrefour.svg",
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
        entry_url: "https://www.carrefour.fr/mon-compte/login"
    }

    constructor() {
        super(CarrefourCollector.CONFIG);
    }

    async login(driver: Driver, params: any): Promise<string | void> {
        // Wait for captcha to be successful
        await driver.waitForCloudflareTurnstile()

        // Input email and password
        await driver.input_text(CarrefourSelectors.FIELD_EMAIL, params.id);
        await driver.input_text(CarrefourSelectors.FIELD_PASSWORD, params.password);
        await driver.left_click(CarrefourSelectors.BUTTON_SUBMIT);

        // Check if login alert exists
        const login_alert = await driver.wait_for_element(CarrefourSelectors.CONTAINER_LOGIN_ALERT, false, 2000)
        if (login_alert) {
            return await login_alert.evaluate(el => el.textContent || "i18n.collectors.all.password.error");
        }
    }

    async run(driver: Driver, params: any): Promise<void> {
        // Refuse cookies
        await driver.left_click(CarrefourSelectors.BUTTON_REFUSE_COOKIES, false, 5000);
        // TODO : Implement the rest of the collector
    }
}

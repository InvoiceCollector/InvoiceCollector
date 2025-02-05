import { ScrapperCollector } from '../scrapperCollector';
import { CarrefourSelectors } from './selectors';
import { Driver } from '../../driver';

export class CarrefourCollector extends ScrapperCollector {

    static CONFIG = {
        name: "Carrefour",
        description: "i18n.collectors.carrefour.description",
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
        entry_url: "https://www.carrefour.fr/mon-compte/mes-achats/en-ligne"
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

    async run(driver: Driver, params: any): Promise<any[]> {
        // Refuse cookies
        await driver.left_click(CarrefourSelectors.BUTTON_REFUSE_COOKIES, false, 5000);

        // Get invoices
        const online_orders = await driver.get_all_elements(CarrefourSelectors.CONTAINER_ORDER, false, 5000);
        
        // Build return array
        return await Promise.all(online_orders.map(async invoice => {
            const order_link = await invoice.get_attribute(CarrefourSelectors.CONTAINER_LINK, "href");
            const date = await invoice.get_attribute(CarrefourSelectors.CONTAINER_ORDER_DATE, "textContent");
            const amount = await invoice.get_attribute(CarrefourSelectors.CONTAINER_ORDER_AMOUNT, "textContent");
    
            const id = order_link.split("/").pop();
            const date_part = date.split('/');
            const year = parseInt(date_part[2]);
            const month = parseInt(date_part[1]) - 1;
            const day = parseInt(date_part[0]);
            const timestamp = Date.UTC(year, month, day);
            const link = `https://www.carrefour.fr/mon-compte/mes-achats/facture/${id}?invoiceType=Invoice`;

            return {
                id,
                type: "link",
                link,
                mime: 'application/pdf',
                timestamp,
                amount
            };
        }));
    }
}

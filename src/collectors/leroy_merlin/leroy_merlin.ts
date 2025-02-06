import { ScrapperCollector } from '../scrapperCollector';
import { LeroyMerlinSelectors } from './selectors';
import { Driver } from '../../driver';
import { delay } from '../../utils';

export class LeroyMerlinCollector extends ScrapperCollector {

    static CONFIG = {
        name: "Leroy Merlin",
        description: "i18n.collectors.leroy_merlin.description",
        version: "1",
        website: "https://www.leroymerlin.fr",
        logo: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Leroy_Merlin.svg",
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
        entry_url: "https://www.leroymerlin.fr/espace-perso/suivi-de-commande.html?auth-mode=login"
    }

    constructor() {
        super(LeroyMerlinCollector.CONFIG);
    }

    async login(driver, params){
        // Refuse cookies
        await driver.left_click(LeroyMerlinSelectors.BUTTON_REFUSE_COOKIES, false, 5000);

        // Close shop chooser
        await driver.left_click(LeroyMerlinSelectors.BUTTON_CLOSE_SHOP_CHOOSER, false, 10000);

        // Input email
        await driver.input_text(LeroyMerlinSelectors.INPUT_EMAIL, params.id);
        await driver.pressEnter();
                    
        // Check if email is incorrect
        const email_error = await driver.wait_for_element(LeroyMerlinSelectors.CONTAINER_EMAIL_ERROR, false, 2000);
        if (email_error) {
            return await email_error.evaluate(e => e.textContent);
        }

        // Input password
        await driver.input_text(LeroyMerlinSelectors.INPUT_PASSWORD, params.password);
        await driver.left_click(LeroyMerlinSelectors.BUTTON_PASSWORD_CONTINUE);
            
        // Check if password is incorrect
        const password_error = await driver.wait_for_element(LeroyMerlinSelectors.CONTAINER_PASSWORD_ERROR, false, 2000);
        if (password_error) {
            return await password_error.evaluate(e => e.textContent);
        }
    }

    async collect(driver: Driver, params: any) {    
        const data = await driver.goto('https://www.leroymerlin.fr/espace-perso/suivi-de-commande.html?auth-mode=login', 'https://www.leroymerlin.fr/order-followup/backend/v2/orders?');

        return data.map(order => { 
            return {
                id: order.orderPartNumber,
                amount: order.price.totalAmount,
                timestamp: order.parentOrder.createdAt || null,
                type: "leroy_merlin",
                mime: 'application/pdf',
                link: `https://www.leroymerlin.fr/espace-perso/suivi-de-commande.html?orderId=${order.orderPartNumber}&storeNumber=${order.storeCode}&customerNumber=${order.customer.id}`
            }
        });
    }

    // Define custom method to download invoice
    async download(driver: Driver, invoice: any): Promise<void> {
        await driver?.goto(invoice.link);
        await driver?.left_click(LeroyMerlinSelectors.BUTTON_DOWNLOAD);
        await delay(5000);
        await this.download_from_file(driver, invoice);
    }
}

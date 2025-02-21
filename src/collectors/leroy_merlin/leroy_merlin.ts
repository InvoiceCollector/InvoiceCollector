import { ScrapperCollector } from '../scrapperCollector';
import { LeroyMerlinSelectors } from './selectors';
import { Driver } from '../../driver';
import * as utils from '../../utils';
import { Invoice, DownloadedInvoice } from '../abstractCollector';

export class LeroyMerlinCollector extends ScrapperCollector {

    static CONFIG = {
        name: "Leroy Merlin",
        description: "i18n.collectors.leroy_merlin.description",
        version: "3",
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
        entryUrl: "https://www.leroymerlin.fr/espace-perso/suivi-de-commande.html?auth-mode=login"
    }

    constructor() {
        super(LeroyMerlinCollector.CONFIG);
    }

    async login(driver: Driver, params: any): Promise<string | void> {
        // Refuse cookies
        await driver.left_click(LeroyMerlinSelectors.BUTTON_REFUSE_COOKIES, false, 15000, 1000);

        // Close shop chooser
        const closeShopChooser = await driver.wait_for_element(LeroyMerlinSelectors.BUTTON_CLOSE_SHOP_CHOOSER, false, 10000);
        if(closeShopChooser) {
            await driver.pressEnter();
            await utils.delay(1000);
        }

        // Input email
        await driver.input_text(LeroyMerlinSelectors.INPUT_EMAIL, params.id);
        await utils.delay(1000);
        await driver.pressEnter();

        // Check if email is incorrect
        const email_error = await driver.wait_for_element(LeroyMerlinSelectors.CONTAINER_EMAIL_ERROR, false, 2000);
        if (email_error) {
            return await email_error.evaluate(e => e.textContent) || "i18n.collectors.all.email.error";
        }

        // Input password
        await driver.input_text(LeroyMerlinSelectors.INPUT_PASSWORD, params.password);
        await utils.delay(1000);
        await driver.left_click(LeroyMerlinSelectors.BUTTON_PASSWORD_CONTINUE);
            
        // Check if password is incorrect
        const password_error = await driver.wait_for_element(LeroyMerlinSelectors.CONTAINER_PASSWORD_ERROR, false, 2000);
        if (password_error) {
            return await password_error.evaluate(e => e.textContent) || "i18n.collectors.all.password.error";
        }
    }

    async collect(driver: Driver, params: any): Promise<Invoice[]> {    
        const data = await driver.goto('https://www.leroymerlin.fr/espace-perso/suivi-de-commande.html?auth-mode=login', 'https://www.leroymerlin.fr/order-followup/backend/v2/orders?');

        return data.map(order => { 
            return {
                id: order.orderPartNumber,
                amount: order.price.totalAmount,
                timestamp: order.parentOrder.createdAt || null,
                link: `https://www.leroymerlin.fr/espace-perso/suivi-de-commande.html?orderId=${order.orderPartNumber}&storeNumber=${order.storeCode}&customerNumber=${order.customer.id}`
            }
        });
    }

    // Define custom method to download invoice
    async download(driver: Driver, invoice: Invoice): Promise<DownloadedInvoice> {
        await driver.goto(invoice.link);
        // If the order is from a third party provider, clicking on the button will ask leroy merlin to request the invoice from the provider.
        // It can take few hours for the invoice to be available.
        // Next time the button will be clicked, the invoice will be effectively downloaded.
        await driver.left_click(LeroyMerlinSelectors.BUTTON_DOWNLOAD);
        return await this.download_from_file(driver, invoice);
    }
}

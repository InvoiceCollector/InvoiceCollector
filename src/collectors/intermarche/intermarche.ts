import { ScrapperCollector } from '../scrapperCollector';
import { IntermarcheSelectors } from './selectors';
import { Driver } from '../../driver';
import { Invoice } from '../abstractCollector';

export class IntermarcheCollector extends ScrapperCollector {

    static CONFIG = {
        name: "Intermarché",
        description: "i18n.collectors.intermarche.description",
        version: "1",
        website: "https://www.intermarche.com",
        logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Intermarch%C3%A9_logo_2009_classic.svg",
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
        entryUrl: "https://www.intermarche.com/gestion-de-compte/mes-courses?type=commandes"
    }

    constructor() {
        super(IntermarcheCollector.CONFIG);
    }

    async login(driver: Driver, params: any): Promise<string | void> {
        await driver.input_text(IntermarcheSelectors.FIELD_EMAIL, params.id);
        await driver.input_text(IntermarcheSelectors.FIELD_PASSWORD, params.password);
        
        // Check if email error exists
        const error_email = await driver.wait_for_element(IntermarcheSelectors.CONTAINER_ERROR_EMAIL, false, 1000)
        if (error_email) {
            return await error_email.evaluate(el => el.textContent || "i18n.collectors.all.email.error");
        }

        // Check if password error exists
        const error_password = await driver.wait_for_element(IntermarcheSelectors.CONTAINER_ERROR_PASSWORD, false, 1000)
        if (error_password) {
            return await error_password.evaluate(el => el.textContent || "i18n.collectors.all.password.error");
        }

        await driver.left_click(IntermarcheSelectors.BUTTON_SUBMIT);

        // Check if login error exists
        const error_login = await driver.wait_for_element(IntermarcheSelectors.CONTAINER_ERROR_PASSWORD, false, 2000)
        if (error_login) {
            return await error_login.evaluate(el => el.textContent || "i18n.collectors.all.password.error");
        }
    }

    async collect(driver: Driver, params: any): Promise<void> {
        await driver.left_click(IntermarcheSelectors.BUTTON_REFUSE_COOKIES, false, 5000);
        // TODO : Implement the rest of the collector
    }

    async download(driver: Driver, invoice: Invoice): Promise<void> {
        // TODO : Implement the downloader
    }
}

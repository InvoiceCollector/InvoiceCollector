import { ScrapperCollector } from '../scrapperCollector';
import { BureauValleeSelectors } from './selectors';
import { Driver } from '../../driver';
import { Invoice } from '../abstractCollector';

export class BureauValleeCollector extends ScrapperCollector {

    static CONFIG = {
        name: "Bureau Vallee",
        description: "i18n.collectors.bureau_vallee.description",
        version: "1",
        website: "https://www.bureau-vallee.fr",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Logo-bureau-vallee-2021.png/320px-Logo-bureau-vallee-2021.png",
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
        entryUrl: "https://www.bureau-vallee.fr/invoice/invoice/"
    }

    constructor() {
        super(BureauValleeCollector.CONFIG);
    }

    async login(driver: Driver, params: any): Promise<string | void> {
        // Refuse cookies
        await driver.left_click(BureauValleeSelectors.BUTTON_REFUSE_COOKIES, false, 5000);

        // Input email
        await driver.input_text(BureauValleeSelectors.FIELD_EMAIL, params.id);
        await driver.left_click(BureauValleeSelectors.BUTTON_CONTINUE);
    
        // Check if email is incorrect
        const email_alert = await driver.wait_for_element(BureauValleeSelectors.CONTAINER_LOGIN_ALERT, false, 2000);
        if (email_alert) {
            return await email_alert.evaluate(e => e.textContent) || "i18n.collectors.all.email_or_number.error";
        }
    
        // Check if signup form is displayed
        const signup_form = await driver.wait_for_element(BureauValleeSelectors.CONTAINER_SIGNUP_FORM, false, 2000);
        if (signup_form) {
            return "i18n.collectors.all.signup.error";
        }
    
        // Input password
        await driver.input_text(BureauValleeSelectors.FIELD_PASSWORD, params.password);
        await driver.left_click(BureauValleeSelectors.BUTTON_SUBMIT);
    
        // Check if password is incorrect
        const password_alert = await driver.wait_for_element(BureauValleeSelectors.CONTAINER_PASSWORD_ALERT, false, 2000);
        if (password_alert) {
            return await password_alert.evaluate(e => e.textContent) || "i18n.collectors.all.password.error";
        }
    }

    async collect(driver: Driver, params: any): Promise<void> {
        // TODO : Implement the rest of the collector
    }

    async download(driver: Driver, invoice: Invoice): Promise<void> {
        // TODO : Implement the downloader
    }
}

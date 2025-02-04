export const AmazonSelectors = {
    //LOGIN PAGE

    FIELD_EMAIL: {
        selector: "#ap_email",
        info: "login input field"
    },
    BUTTON_CONTINUE: {
        selector: "#continue",
        info: "continue button field"
    },
    FIELD_PASSWORD: {
        selector: "#ap_password",
        info: "password input field"
    },
    BUTTON_SUBMIT: {
        selector: "#signInSubmit",
        info: "submit form button"
    },
    CONTAINER_LOGIN_ALERT: {
        selector: "div[id='auth-error-message-box'] span",
        info: "login alert container"
    },
    CONTAINER_CAPTCHA: {
        selector: "img[alt='captcha'], #captcha-container",
        info: "captcha container"
    },

    //INVOICES PAGE

    CONTAINER_ORDERID: {
        selector: "div.yohtmlc-order-id > span.a-color-secondary:not([class*=' '])",
        info: "download invoice button"
    }
}

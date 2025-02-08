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

    CONTAINER_ORDER: {
        selector: ".order-card .order-header",
        info: "order container"
    },
    CONTAINER_DATE: {
        selector: ".a-span4 div:last-of-type span",
        info: "order date"
    },
    CONTAINER_AMOUNT: {
        selector: ".a-span2 div:last-of-type span",
        info: "order date"
    },
    CONTAINER_ID: {
        selector: "div.yohtmlc-order-id > span.a-color-secondary:not([class*=' '])",
        info: "download invoice button"
    }
}

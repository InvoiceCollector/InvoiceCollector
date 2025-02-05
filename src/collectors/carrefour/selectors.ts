export const CarrefourSelectors = {
    // COOKIES

    BUTTON_REFUSE_COOKIES: {
        selector: "#onetrust-reject-all-handler",
        info: "refuse cookies button"
    },
    BUTTON_ACCEPT_COOKIES: {
        selector: "#onetrust-accept-btn-handler",
        info: "accept cookies button"
    },

    //LOGIN PAGE

    FIELD_EMAIL: {
        selector: "#idToken1",
        info: "email input"
    },
    FIELD_PASSWORD: {
        selector: "#idToken2",
        info: "password input"
    },
    BUTTON_SUBMIT: {
        selector: "#loginButton_0",
        info: "submit button"
    },
    CONTAINER_LOGIN_ALERT: {
        selector: "#validation-message-0:not([style*='hidden']), #error-message-pwd:not([style*='hidden'])",
        info: "login alert container"
    },

    // ORDERS PAGE

    CONTAINER_ORDER: {
        selector: ".online-order-item__wrapper",
        info: "order container"
    },
    CONTAINER_LINK: {
        selector: ".order-item__summary .order-item__footer a",
        info: "order link container"
    },
    CONTAINER_ORDER_DATE: {
        selector: ".order-item__date",
        info: "order date container"
    },
    CONTAINER_ORDER_AMOUNT: {
        selector: ".order-item__summary .order-item__footer p",
        info: "order amount container"
    },
}

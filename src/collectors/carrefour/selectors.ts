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
}

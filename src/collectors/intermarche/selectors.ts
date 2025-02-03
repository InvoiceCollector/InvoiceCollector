export const IntermarcheSelectors = {
    // COOKIES

    BUTTON_REFUSE_COOKIES: {
        selector: "span.didomi-continue-without-agreeing",
        info: "refuse cookies button"
    },
    BUTTON_ACCEPT_COOKIES: {
        selector: "#didomi-notice-agree-button",
        info: "accept cookies button"
    },

    //LOGIN PAGE

    FIELD_EMAIL: {
        selector: "#username_display",
        info: "email input"
    },
    CONTAINER_ERROR_EMAIL: {
        selector: "#error-email:not(.hidden)",
        info: "email error"
    },
    FIELD_PASSWORD: {
        selector: "#password",
        info: "password input"
    },
    CONTAINER_ERROR_PASSWORD: {
        selector: "#error-label:not(.hidden)",
        info: "password error"
    },
    BUTTON_SUBMIT: {
        selector: "#kc-login",
        info: "submit button"
    }
}

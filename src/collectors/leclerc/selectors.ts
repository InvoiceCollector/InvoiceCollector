export const LeclercSelectors = {
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
        selector: "#login-email",
        info: "login input field"
    },
    BUTTON_LOGIN: {
        selector: "button.btn-primary",
        info: "next button field"
    },
    CONTAINER_EMAIL_ERROR: {
        selector: "#cs-auth-email-pattern-error",
        info: "email error container"
    },
    CONTAINER_SIGNUP: {
        selector: "div.content-ct-signup",
        info: "signup container"
    },
    FIELD_PASSWORD: {
        selector: "#login-password",
        info: "password input field"
    },
    CONTAINER_PASSWORD_ERROR: {
        selector: "div.notify",
        info: "password error field"
    }
}

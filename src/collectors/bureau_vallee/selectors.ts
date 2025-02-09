export const BureauValleeSelectors = {
    // COOKIES

    BUTTON_REFUSE_COOKIES: {
        selector: ".modal-inner-wrap button.-decline",
        info: "refuse cookies button"
    },
    BUTTON_ACCEPT_COOKIES: {
        selector: ".modal-inner-wrap button.-allow",
        info: "accept cookies button"
    },

    // LOGIN PAGE

    FIELD_EMAIL: {
        selector: "#login\\[email\\]",
        info: "email input"
    },
    BUTTON_CONTINUE: {
        selector: "#continue-login",
        info: "continue login button"
    },
    CONTAINER_LOGIN_ALERT: {
        selector: "#login\\[email\\]-error",
        info: "login alert container"
    },
    CONTAINER_SIGNUP_FORM: {
        selector: "#password-step",
        info: "signup form container"
    },
    FIELD_PASSWORD: {
        selector: "#login\\[password\\]",
        info: "password input"
    },
    BUTTON_SUBMIT: {
        selector: "#send2",
        info: "submit button"
    },
    CONTAINER_PASSWORD_ALERT: {
        selector: "#messages-container:not([style*='display']) .message.error div[data-bind*='html']",
        info: "password alert container"
    },
}

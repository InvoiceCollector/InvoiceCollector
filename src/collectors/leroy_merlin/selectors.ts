export const LeroyMerlinSelectors = {
    
    // COOKIES

    BUTTON_REFUSE_COOKIES: {
        selector: "div.is-open button.alt-modal__close",
        info: "refuse cookies button"
    },
    BUTTON_ACCEPT_COOKIES: {
        selector: "div.is-open button.js-modal-privacy-button-accept",
        info: "accept cookies button"
    },

    //LOGIN PAGE

    INPUT_EMAIL: {
        selector: "form#js-email-form input",
        info: "login input"
    },
    BUTTON_LOGIN_CONTINUE: {
        selector: "form#js-email-form button",
        info: "continue button"
    },
    CONTAINER_EMAIL_ERROR: {
        selector: "form#js-email-form span.js-form-error",
        info: "email error container"
    },
    INPUT_PASSWORD: {
        selector: "form#js-password-form input[type='password']",
        info: "password input"
    },
    BUTTON_PASSWORD_CONTINUE: {
        selector: "form#js-password-form button[type='submit']",
        info: "continue button"
    },
    CONTAINER_PASSWORD_ERROR: {
        selector: "form#js-password-form span.js-form-error",
        info: "password error container"
    },

    // ORDER PAGE

    BUTTON_DOWNLOAD: {
        selector: "#download-button",
        info: "download button"
    }
}

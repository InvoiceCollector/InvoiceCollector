export const FreeSelectors = {
    //LOGIN PAGE

    FIELD_USERNAME: {
        selector: "input[name='login']",
        info: "login input field"
    },
    FIELD_PASSWORD: {
        selector: "input[name='pass']",
        info: "password input field"
    },
    BUTTON_SUBMIT: {
        selector: "#ok",
        info: "submit form button"
    },
    CONTAINER_LOGIN_ALERT: {
        selector: "div[class='loginalert']",
        info: "login alert container"
    },
    
    //INDEX PAGE

    BUTTON_INVOICES: {
        selector: "a[title='Mes Factures']",
        info: "my invoices button"
    },

    //INVOICES PAGE
    
    CONTAINER_INVOICE: {
        selector: ".accordion li",
        info: "invoice container"
    },
    BUTTON_DOWNLOAD: {
        selector: ".btn_download",
        info: "download invoice button"
    },
    CONTAINER_AMOUNT: {
        selector: "span:last-of-type",
        info: "amount button"
    }
}

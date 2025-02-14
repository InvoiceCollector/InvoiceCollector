// API ERRORS

export class StatusError extends Error {
    status_code: number;

    constructor(message: string, status_code: number, opts) {
        super(message, opts);
        this.name = this.constructor.name;
        this.status_code = status_code;
    }
}

export class AuthenticationBearerError extends StatusError {
    constructor(opts = {}) {
        super("Invalid Bearer token", 401, opts);
        this.name = this.constructor.name;
    }
}

export class OauthError extends StatusError {
    constructor(opts = {}) {
        super("Invalid Oauth token", 401, opts);
        this.name = this.constructor.name;
    }
}

export class MissingField extends StatusError {
    constructor(field_name: string, opts = {}) {
        super(`The field "${field_name}" is missing.`, 400, opts);
        this.name = this.constructor.name;
    }
}


export class MissingParams extends StatusError {
    constructor(field_name: string[], opts = {}) {
        let message;
        if (field_name.length === 1) {
            message = `The param "${field_name[0]}" is missing`;
        } else {
            message = `The params "${field_name.join('", "')}" are missing`;
        }
        super(message, 400, opts);
        this.name = this.constructor.name;
    }
}

// COLLECTOR ERRORS

export class CollectorError extends Error {
    collector: string|null;
    version: string|null;

    constructor(message: string, collector: string|null, version: string|null, opts = {}) {
        super(message, opts);
        this.name = this.constructor.name;
        this.collector = collector;
        this.version = version;
    }
}

export class MaintenanceError extends CollectorError {
    constructor(collector: string, version: string, opts = {}) {
        super(
            `The website is in maintenance. Wait a moment and try again.`,
            collector,
            version,
            opts
        );
        this.name = this.constructor.name;
    }
}

export class AuthenticationError extends CollectorError {
    constructor(message: string, collector: string, version: string, opts = {}) {
        super(
            message.trim(),
            collector,
            version,
            opts
        );
        this.name = this.constructor.name;
    }
}

export class LoggableError extends CollectorError {
    url: string;
    source_code: string;
    screenshot: string;

    constructor(message: string, collector: string|null, version: string|null, url: string, source_code: string, screenshot: string, opts = {}) {
        super(
            message,
            collector,
            version,
            opts
        );
        this.name = this.constructor.name;
        this.url = url;
        this.source_code = source_code;
        this.screenshot = screenshot;
    }
}

export class ElementNotFoundError extends LoggableError {
    selector: any;

    constructor(collector: string|null, version: string|null, url: string, source_code: string, screenshot: string, selector: any, opts = {}) {
        super(
            `Could not find selector '${selector.selector}' corresponding to the "${selector.info}" on the page '${url}'. See the source code and the screenshot to find the issue.`,
            collector,
            version,
            url,
            source_code,
            screenshot,
            opts
    );
        this.name = this.constructor.name;
        this.selector = selector;
    }
}

export class UnfinishedCollectorError extends LoggableError {
    constructor(collector: string, version: string, url: string, source_code: string, screenshot: string, opts = {}) {
        super(
            `The collector is not finished`,
            collector,
            version,
            url,
            source_code,
            screenshot,
            opts
        );
        this.name = this.constructor.name;
    }
}

export class DesynchronizationError extends AuthenticationError {
    constructor(credential_id: string, collector: string, version: string, opts = {}) {
        super(`Desynchronization Error - We are sorry but something went wrong with the collector. Please remove it and add it again. (${credential_id})`, collector, version, opts);
        this.name = this.constructor.name;
    }
}

// OTHER ERRORS

export class TermsConditionsError extends Error {
    locale: string;

    constructor(locale: string, opts = {}) {
        super("The user did not accept the terms and conditions.", opts);
        this.name = this.constructor.name;
        this.locale = locale;
    }
}
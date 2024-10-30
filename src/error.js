class MissingField extends Error {
    constructor(field_name, opts) {
        super(`The field "${field_name}" is missing.`, opts);
        this.name = this.constructor.name;
    }
}

class ElementNotFoundError extends Error {
    constructor(url, source_code, screenshot, selector, opts) {
        super(`Could not find selector '${selector.selector}' corresponding to the "${selector.info}" on the page '${url}'. See the source code and the screenshot to find the issue.`, opts);
        this.name = this.constructor.name;
        this.url = url;
        this.source_code = source_code;
        this.screenshot = screenshot;
        this.selector = selector;
    }
}

class NotAuthenticatedError extends Error {
    constructor(collector, version, opts) {
        super(`Could not authenticate. Please verify your credentials.`, opts);
        this.name = this.constructor.name;
        this.collector = collector;
        this.version = version;
    }
}

class InMaintenanceError extends Error {
    constructor(collector, version, opts) {
        super(`The website is in maintenance. Wait a moment and try again.`, opts);
        this.name = this.constructor.name;
        this.collector = collector;
        this.version = version;
    }
}

class UnfinishedCollector extends Error {
    constructor(collector, version, url, source_code, screenshot, opts) {
        super(`The collector is not finished`, opts);
        this.name = this.constructor.name;
        this.collector = collector;
        this.version = version;
        this.url = url;
        this.source_code = source_code;
        this.screenshot = screenshot;
    }
}

module.exports = {
    MissingField,
	ElementNotFoundError,
	NotAuthenticatedError,
	InMaintenanceError,
    UnfinishedCollector
}

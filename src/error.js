class ElementNotFoundError extends Error {
    constructor(url, source_code, screenshot, selector, opts) {
        super(`Could not find selector '${selector.selector}' corresponding to the "${selector.info}" on the page '${url}'. See the source code and the screenshot to find the issue.`, opts);
        this.url = url;
        this.source_code = source_code;
        this.screenshot = screenshot;
        this.selector = selector;
        this.infos = infos;
    }
}

class NotAuthenticatedError extends Error {
    constructor(opts) {
        super(`Could not authenticate. Please verify your username and password.`, opts);
    }
}

class InMaintenanceError extends Error {
    constructor(opts) {
        super(`The website is in maintenance. Wait a moment and try again.`, opts);
    }
}

class UnfinishedCollector extends Error {
    constructor(url, source_code, screenshot, opts) {
        super(`The collector is not finished`, opts);
        this.url = url;
        this.source_code = source_code;
        this.screenshot = screenshot;
    }
}

module.exports = {
	ElementNotFoundError,
	NotAuthenticatedError,
	InMaintenanceError,
    UnfinishedCollector
}

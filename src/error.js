class ElementNotFoundError extends Error {
    constructor(selector, url, source_code, screenshot, infos, opts) {
        super(`Could not find selector '${selector}' corresponding to the "${infos.selector_info}" on the page '${url}'. See the source code (${source_code}) and the screenshot (${screenshot}) to find the issue.`, opts);
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

module.exports = {
	ElementNotFoundError,
	NotAuthenticatedError,
	InMaintenanceError
}

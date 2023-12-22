class ElementNotFoundError extends Error {
    constructor(selector, url, source_code, screenshot, infos, opts) {
        super(`Could not find selector '${selector}' corresponding to the "${infos.selector_info}" on the page '${url}'. See the source code (${source_code}) and the screenshot (${screenshot}) to find the issue.`, opts);
    }
}

module.exports = {
	ElementNotFoundError,
}

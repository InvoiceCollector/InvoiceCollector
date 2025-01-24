import axios, { AxiosInstance } from 'axios';
import { LoggableError } from './error'

export class RegistryServer {
    static VERSION = "v1"
    private client: AxiosInstance;

    constructor() {
        if (!process.env.REGISTRY_SERVER_ENDPOINT) {
            throw new Error("REGISTRY_SERVER_ENDPOINT environment variable is required");
        }

        this.client = axios.create({
            baseURL: `${process.env.REGISTRY_SERVER_ENDPOINT}/${RegistryServer.VERSION}`
        });

        if (process.env.REGISTRY_SERVER_ACCESS_TOKEN) {
            this.client.defaults.headers.common['Authorization'] = `Bearer ${process.env.REGISTRY_SERVER_ACCESS_TOKEN}`;
        }
        else {
            console.warn("No REGISTRY_SERVER_ACCESS_TOKEN environment variable found. Requests to log server will not be authenticated.");
        }
    }

    logSuccess(collector: string) {
        this.client.post("/log/success", {
            collector
        })
        .then(response => {
            console.log("Invoice-Collector server successfully reached");
        })
        .catch(error => {
            console.error(`Could not reach Invoice-Collector server at ${error.request.res.responseUrl}. Status code: ${error.response.status}`);
        });
    }

    logError(err: LoggableError) {
        this.client.post("/log/error", {
            collector: err.collector,
            version: err.version,
            error: err.name,
            traceback: err.stack,
            source_code: err.source_code,
            screenshot: err.screenshot
        })
        .then(response => {
            console.log("Invoice-Collector server successfully reached");
        })
        .catch(error => {
            console.error(`Could not reach Invoice-Collector server at ${error.request.res.responseUrl}. Status code: ${error.response.status}`);
        });
    }
}

import { AbstractProxy, Proxy, Location } from "./abstractProxy";

export class OxylabProxy extends AbstractProxy {

    static RADIUS_ACCURACIES = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]

    username: string;
    password: string;

    constructor() {
        if (!process.env.PROXY_OXYLAB_USERNAME) {
            throw new Error("PROXY_OXYLAB_USERNAME environment variable is required");
        }
        if (!process.env.PROXY_OXYLAB_PASSWORD) {
            throw new Error("PROXY_OXYLAB_PASSWORD environment variable is required");
        }

        super();
        this.username = process.env.PROXY_OXYLAB_USERNAME || "";
        this.password = process.env.PROXY_OXYLAB_PASSWORD || "";
    }

    async get(location: Location | null): Promise<Proxy | null> {
        if(location == null) {
            return null;
        }

        return {
            uri: `http://customer-${this.username}-cc-${location.country}:${this.password}@pr.oxylabs.io:7777`,
            host: "pr.oxylabs.io",
            port: 7777,
            username: `customer-${this.username}-cc-${location.country}`,
            password: this.password
        };
    }
}

import { AbstractProxy, Proxy } from "./abstractProxy";

type Location = {
    country: string;
    lat: string;
    lon: string;
};

export class OxylabProxy extends AbstractProxy<Location> {

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

    async get(location: Location): Promise<Proxy | null> {
        return {
            uri: `http://customer-${this.username}-cc-${location.country}:${this.password}@pr.oxylabs.io:7777`,
            host: "pr.oxylabs.io",
            port: 7777,
            username: `customer-${this.username}-cc-${location.country}`,
            password: this.password
        };
    }

    async locate(ip: string): Promise<Location | null> {
        const location = await super._locate(ip);
        if (!location) {
            return null;
        }
        return {
            country: location.countryCode,
            lat: location.lat,
            lon: location.lon
        }
    }
}

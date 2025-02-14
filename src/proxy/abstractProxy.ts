export type Proxy = {
    uri: string,
    host: string,
    port: number,
    username?: string,
    password?: string
}

export type Location = {
    country: string;
    lat: string;
    lon: string;
};

export abstract class AbstractProxy {
    abstract get(location: Location | null): Promise<Proxy | null>;

    async locate(ip: string): Promise<Location | null> {
        const response = await fetch(`http://ip-api.com/json/${ip}`);
        if (!response.ok) {
            return null;
        }
        const json = await response.json();
        if(json.status === "fail") {
            return null;
        }
        return {
            country: json.countryCode,
            lat: json.lat,
            lon: json.lon
        }
    }
}

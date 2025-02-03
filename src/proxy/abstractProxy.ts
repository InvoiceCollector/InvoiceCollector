
export class AbstractProxy<L> {
    async get(location: L): Promise<string | null> {
        throw new Error("Method 'get()' must be implemented.");
    }

    protected async _locate(ip: string): Promise<any | null> {
        const response = await fetch(`http://ip-api.com/json/${ip}`);
        if (!response.ok) {
            return null;
        }
        const json = await response.json();
        if(json.status === "fail") {
            return null;
        }
        return json;
    }

    async locate(ip: string): Promise<L | null> {
        throw new Error("Method 'locate()' must be implemented.");
    }
}

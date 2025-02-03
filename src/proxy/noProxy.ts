import { AbstractProxy } from "./abstractProxy";

export class NoProxy extends AbstractProxy<any> {
    async get(location: any): Promise<string | null> {
        return null;
    }

    async locate(ip: string): Promise<any | null> {
        return null;
    }
}

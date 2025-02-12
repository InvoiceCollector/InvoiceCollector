import { AbstractProxy, Proxy } from "./abstractProxy";

export class NoProxy extends AbstractProxy {
    async get(location: any): Promise<Proxy | null> {
        return null;
    }
}

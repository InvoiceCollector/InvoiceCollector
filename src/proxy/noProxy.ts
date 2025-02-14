import { AbstractProxy, Location, Proxy } from "./abstractProxy";

export class NoProxy extends AbstractProxy {
    async get(location: Location | null): Promise<Proxy | null> {
        return null;
    }
}

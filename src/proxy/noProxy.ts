import { AbstractProxy, Location, Proxy } from "./abstractProxy";

export class NoProxy extends AbstractProxy {
    get(location: Location | null): Proxy | null {
        return null;
    }
}

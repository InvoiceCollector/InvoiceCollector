import { AbstractProxy } from "./abstractProxy";
import { NoProxy } from "./noProxy";
import { OxylabProxy } from "./oxylabProxy";

export class ProxyFactory {
    static getProxy(): AbstractProxy<any> {
        const type = process.env.PROXY_TYPE;
        switch(type) {
            case 'oxylab':
                return new OxylabProxy();
            default:
                return new NoProxy();
        }
    }
}

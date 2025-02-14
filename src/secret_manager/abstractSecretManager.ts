export abstract class AbstractSecretManager {
    constructor() {
        if (new.target === AbstractSecretManager) {
            throw new TypeError("Cannot construct AbstractSecretManager instances directly");
        }
    }

    abstract connect(): Promise<void>;

    /*abstract disconnect(): Promise<void>;*/

    // SECRETS

    abstract addSecret(key: string, params: any): Promise<string>;

    abstract getSecret(id: string): Promise<any | null>;

    abstract deleteSecret(id: string): Promise<void>;

    abstract deleteSecrets(ids: string[]): Promise<void>;
}

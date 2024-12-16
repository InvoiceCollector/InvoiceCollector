import { Bitwarden } from './bitwarden';
import { AbstractSecretManager } from './abstractSecretManager';

export class SecretManagerFactory {
    static getSecretManager(): AbstractSecretManager {
        const type = process.env.SECRET_MANAGER_TYPE;
        switch(type) {
            case 'bitwarden':
                return new Bitwarden();
            default:
                throw new Error(`Unknown secret manager type: ${type}`);
        }
    }
}

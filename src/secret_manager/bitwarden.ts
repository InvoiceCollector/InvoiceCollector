import { BitwardenClient, ClientSettings, DeviceType, LogLevel } from "@bitwarden/sdk-napi";
import { AbstractSecretManager } from "./abstractSecretManager";

export class Bitwarden extends AbstractSecretManager {

    static stateFile: string = "./bitwarden/state";

    accessToken: string;
    organizationId: string;
    projectId: string;
    client: BitwardenClient;

    constructor() {
        if (!process.env.SECRET_MANAGER_BITWARDEN_API_URI) {
            throw new Error("SECRET_MANAGER_BITWARDEN_API_URI environment variable is required");
        }
        if (!process.env.SECRET_MANAGER_BITWARDEN_IDENTITY_URI) {
            throw new Error("SECRET_MANAGER_BITWARDEN_IDENTITY_URI environment variable is required");
        }
        if (!process.env.SECRET_MANAGER_BITWARDEN_ACCESS_TOKEN) {
            throw new Error("SECRET_MANAGER_BITWARDEN_ACCESS_TOKEN environment variable is required");
        }
        if (!process.env.SECRET_MANAGER_BITWARDEN_ORGANIZATION_ID) {
            throw new Error("SECRET_MANAGER_BITWARDEN_ORGANIZATION_ID environment variable is required");
        }
        if (!process.env.SECRET_MANAGER_BITWARDEN_PROJECT_ID) {
            throw new Error("SECRET_MANAGER_BITWARDEN_PROJECT_ID environment variable is required");
        }

        super();
        this.accessToken = process.env.SECRET_MANAGER_BITWARDEN_ACCESS_TOKEN || "";
        this.organizationId = process.env.SECRET_MANAGER_BITWARDEN_ORGANIZATION_ID || "";
        this.projectId = process.env.SECRET_MANAGER_BITWARDEN_PROJECT_ID || "";
        const settings: ClientSettings = {
            apiUrl: process.env.SECRET_MANAGER_BITWARDEN_API_URI,
            identityUrl: process.env.SECRET_MANAGER_BITWARDEN_IDENTITY_URI,
            userAgent: "Bitwarden SDK",
            deviceType: DeviceType.SDK,
        };
        this.client = new BitwardenClient(settings, 2);
        this.connect();
    }

    async connect(): Promise<void> {
        try {
            await this.client.auth().loginAccessToken(this.accessToken, Bitwarden.stateFile);
            console.log("Connected successfully to Bitwarden");
        }
        catch (err) {
            console.error("Connection to Bitwarden failed", err);
        }
    }

    // SECRETS

    async addSecret(key: string, params: any) {
        //JSON param before sending
        const stringParams: string = JSON.stringify(params);
        return await this.client.secrets().create(this.organizationId, key, stringParams, "", [this.projectId]);
    }

    async getSecret(id: string) {
        const secret = await this.client.secrets().get(id);
        secret.value = JSON.parse(secret.value);
        return secret
    }

    async deleteSecret(id: string) {
        return await this.deleteSecrets([id]);
    }

    async deleteSecrets(ids: string[]) {
        return await this.client.secrets().delete(ids);
    }
}

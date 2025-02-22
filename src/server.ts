import path from 'path';
import { DatabaseFactory } from './database/databaseFactory';
import { AbstractSecretManager } from './secret_manager/abstractSecretManager';
import { SecretManagerFactory } from './secret_manager/secretManagerFactory';
import { AuthenticationBearerError, OauthError, MissingField, MissingParams, StatusError } from './error';
import { generate_token } from './utils';
import { CollectorLoader } from './collectors/collectorLoader';
import { User } from './model/user';
import { Customer } from './model/customer';
import { IcCredential, State } from './model/credential';
import { CollectionTask } from './task/collectionTask';
import { I18n } from 'i18n';
import { ProxyFactory } from './proxy/proxyFactory';
import { AbstractCollector, Config } from './collectors/abstractCollector';
import { RegistryServer } from './registryServer';

export class Server {

    static OAUTH_TOKEN_VALIDITY_DURATION_MS = Number(process.env.OAUTH_TOKEN_VALIDITY_DURATION_MS) || 600000; // 10 minutes, in ms
    static LOCALES = ['en', 'fr'];
    static DEFAULT_LOCALE = 'en';
    static i18n = new I18n({
        locales: Server.LOCALES,
        directory: path.join(__dirname, '..', 'locales'),
        defaultLocale: Server.DEFAULT_LOCALE,
        retryInDefaultLocale: true,
        updateFiles: false,
        cookie: 'lang'
    });

    secret_manager: AbstractSecretManager;
    tokens: object;

    collection_task: CollectionTask;

    constructor() {
        // Connect to database
        DatabaseFactory.getDatabase().connect();

        this.secret_manager = SecretManagerFactory.getSecretManager();
        this.tokens = {}

        // Load collectors
        CollectorLoader.load();

        this.collection_task = new CollectionTask(this.secret_manager);
	}

    // ---------- BEARER TOKEN NEEDED ----------

    async get_customer(bearer: string | undefined): Promise<any> {
        // Get customer from bearer
        const customer = await Customer.fromBearer(bearer);

        // Check if customer exists
        if(!customer) {
            throw new AuthenticationBearerError();
        }

        return { name: customer.name, callback: customer.callback }
    }

    async post_authorize(bearer: string | undefined, remote_id: string | undefined, locale: string | undefined, email: string | undefined): Promise<{token: string}> {
        // Get customer from bearer
        const customer = await Customer.fromBearer(bearer);

        // Check if customer exists
        if(!customer) {
            throw new AuthenticationBearerError();
        }

        //Check if remote_id field is missing
        if(!remote_id) {
            throw new MissingField("remote_id");
        }

        //Check if locale field is missing
        if(!locale) {
            throw new MissingField("locale");
        }

        //Check if email field is missing
        if(!email) {
            throw new MissingField("email");
        }

        //Check if locale is supported
        if(locale && !Server.LOCALES.includes(locale)) {
            throw new StatusError(`Locale "${locale}" not supported. Available locales are: ${Server.LOCALES.join(", ")}.`, 400);
        }

        // Get user from remote_id
        let user = await customer.getUserFromRemoteId(remote_id);

        // If user does not exist, create it
        if(!user) {
            // Send terms and conditions email
            const termsConditions = await RegistryServer.getInstance().sendTermsConditionsEmail(customer.bearer, email, locale);
            // Create user
            user = new User(customer.id, remote_id, null, locale, termsConditions);
        }
        else {
            // Update user locale
            user.locale = locale;

            // Check if user has accepted terms and conditions
            if (!user.termsConditions.validTimestamp) {
                // Send terms and conditions email
                const termsConditions = await RegistryServer.getInstance().sendTermsConditionsEmail(customer.bearer, email, locale);
                // Update terms and conditions
                user.termsConditions = termsConditions;
            }
        }

        // Commit changes in database
        user.commit();

        // Generate oauth token
        const token = generate_token();

        // Map token with user
        this.tokens[token] = user;

        // Schedule token delete after 1 hour
        setTimeout(() => {
            delete this.tokens[token];
            console.log(`Token ${token} deleted`);
        }, Server.OAUTH_TOKEN_VALIDITY_DURATION_MS);

        return { token }
    }

    async delete_user(bearer: string |  undefined, remote_id: string |  undefined) {
        // Get customer from bearer
        const customer = await Customer.fromBearer(bearer);

        // Check if customer exists
        if(!customer) {
            throw new AuthenticationBearerError();
        }

        //Check if remote_id field is missing
        if(!remote_id) {
            throw new MissingField("remote_id");
        }

        // Get user from remote_id
        const user = await customer.getUserFromRemoteId(remote_id);

        // Check if user exists
        if (!user) {
            throw new StatusError(`User with remote_id "${remote_id}" not found.`, 400);
        }

        // Delete user and all its credentials
        await user.delete();

        // Delete user from token mapping
        for (let token in this.tokens) {
            if (this.tokens[token].id === user.id) {
                delete this.tokens[token];
                console.log(`Token ${token} deleted`);
            }
        }
    }

    async post_collect(bearer: string |  undefined, id: string |  undefined) {
        // Get customer from bearer
        const customer = await Customer.fromBearer(bearer);

        // Check if customer exists
        if(!customer) {
            throw new AuthenticationBearerError();
        }

        // Check if id field is missing
        if(!id) {
            throw new MissingField("id");
        }

        // Get credential from id
        const credential = await IcCredential.fromId(id);

        // Check if credential exists
        if (!credential) {
            throw new StatusError(`Credential with id "${id}" not found.`, 400);
        }

        // Get user from credential
        const user = await credential.getUser();

        // Check if user exists
        if (!user) {
            throw new StatusError(`Could not find user for credential with id "${credential.id}".`, 401);
        }

        // Check if user belongs to customer
        if (user.customer_id != customer.id) {
            throw new StatusError(`User with id "${user.id}" does not belong to customer with id "${customer.id}".`, 403);
        }

        // Schedule next collect now
        credential.next_collect_timestamp = Date.now()

        // Update credential in database
        await credential.commit();
    }

    // ---------- OAUTH TOKEN NEEDED ----------

    get_token_mapping(token: any): User {
        // Check if token is missing or incorrect
        if(!token || !this.tokens.hasOwnProperty(token) || typeof token !== 'string') {
            throw new OauthError();
        }
        return this.tokens[token];
    }

    async get_user(token: any, verificationCode: any): Promise<{locale: string}> {
        // Get user from token
        const user = this.get_token_mapping(token);

        // Check if verificationCode is valid
        if (verificationCode && user.termsConditions.verificationCode === verificationCode) {
            // Validate terms and conditions by setting validTimestamp to now
            user.termsConditions.validTimestamp = Date.now();
            // Commit changes
            await user.commit();
        }

        // Check if terms and conditions have been accepted
       user.checkTermsConditions();

        return { locale: user.locale }
    }

    async get_credentials(token: any): Promise<{collector: Config, id: string, note: string, state: State, error: string}[]> {
        // Get user from token
         const user = this.get_token_mapping(token);

         // Check if terms and conditions have been accepted
        user.checkTermsConditions();

        // Get credentials from user
        let credentials = await user.getCredentials();

        // Build response 
        return credentials.map((credential) => {
            const collector = this.get_collector(credential.collector_id);
            return {
                collector: collector.config,
                note: credential.note,
                id: credential.id,
                state: credential.state,
                error: credential.error
            }
        });
    }

    async post_credential(token: any, collector_id: string | undefined, params: any | undefined, ip: string | string[] | undefined): Promise<void> {
        // Get user from token
         const user = this.get_token_mapping(token);

         // Check if terms and conditions have been accepted
        user.checkTermsConditions();

        //Check if id field is missing
        if(!collector_id) {
            throw new MissingField("collector");
        }

        //Check if params field is missing
        if(!params) {
            throw new MissingField("params");
        }

        // Get collector from id
        const collector = this.get_collector(collector_id);

        // Get credential note
        let note = params.note;
        delete params.note;

        // Check if all mandatory params are present
        const missing_params = Object.keys(collector.config.params).filter((param) => collector.config.params[param].mandatory && !params.hasOwnProperty(param));
        if(missing_params.length > 0) {
            throw new MissingParams(missing_params);
        }

        // If no note, set it to collector description
        if(!note) {
            note = Server.i18n.__({ phrase: collector.config.description, locale: user.locale });
        }

        if (user.location === null) {
            console.log(`User location not found, trying to locate it`);

            // Update user with location
            user.location = await ProxyFactory.getProxy().locate(ip);

            if (user.location != null) {
                console.log('User location found');
                // Commit user
                await user.commit();
            }
            else {
                console.log('Could not find user location');
            }
        }

        // Add credential to Secure Storage
        const secret_manager_id = await this.secret_manager.addSecret(`${user.customer_id}_${user.id}_${collector_id}`, params);

        // Create credential
        let credential = new IcCredential(
            user.id,
            collector_id,
            note,
            secret_manager_id
        );

        // Compute next collect
        credential.computeNextCollect();

        // Create credential in database
        await credential.commit();
    }

    async delete_credential(token: any, id: string): Promise<void> {
        // Get user from token
         const user = this.get_token_mapping(token);

         // Check if terms and conditions have been accepted
        user.checkTermsConditions();

        // Get credential from id
        const credential = await user.getCredential(id);

        // Check if credential exists
        if (!credential) {
            throw new StatusError(`Credential with id "${id}" not found.`, 400);
        }

        // Check if credential belongs to user
        if (credential.user_id != user.id) {
            throw new StatusError(`Credential with id "${id}" does not belong to user.`, 403);
        }

        // Delete credential from Secure Storage
        await this.secret_manager.deleteSecret(credential.secret_manager_id);

        // Delete credential
        await credential.delete();
    }

    // ---------- NO OAUTH TOKEN NEEDED ----------

    public get_collectors(locale: any): Config[] {
        //Check if locale field is missing
        if(!locale || typeof locale !== 'string') {
            //Set default locale
            locale = Server.DEFAULT_LOCALE;
        }

        //Check if locale is supported
        if(locale && !Server.LOCALES.includes(locale)) {
            throw new StatusError(`Locale "${locale}" not supported. Available locales are: ${Server.LOCALES.join(", ")}.`, 400);
        }

        console.log(`Listing all collectors`);
        return CollectorLoader.getAll().map((collector): Config => {
            const name: string = Server.i18n.__({ phrase: collector.config.name, locale });
            const description: string = Server.i18n.__({ phrase: collector.config.description, locale });
            const instructions: string = Server.i18n.__({ phrase: collector.config.instructions, locale });
            const params = Object.keys(collector.config.params).reduce((acc, key) => {
                acc[key] = {
                    ...collector.config.params[key],
                    name: Server.i18n.__({ phrase: collector.config.params[key].name, locale }),
                    placeholder: Server.i18n.__({ phrase: collector.config.params[key].placeholder, locale })
                };
                return acc;
            }, {});
            return {
                ...collector.config,
                name,
                description,
                instructions,
                params
            };
        });
    }

    private get_collector(id: string): AbstractCollector {
        const collector = CollectorLoader.get(id);
        if(collector == null) {
            throw new StatusError(`No collector with id "${id}" found.`, 400);
        }
        return collector;
    }
}

import axios from 'axios';
import { CronJob } from 'cron';
import { IcCredential } from '../model/credential';
import { LoggableError, NotAuthenticatedError, InMaintenanceError } from '../error';
import { LogServer } from '../log_server';
import { AbstractSecretManager } from '../secret_manager/abstractSecretManager';
import { collectors } from '../collectors/collectors';
import { hash_string } from '../utils';
import e from 'express';

export class CollectionTask {
    private secret_manager: AbstractSecretManager;
    private log_server: LogServer;
    private job: CronJob;

    constructor(secret_manager: AbstractSecretManager) {
        this.secret_manager = secret_manager;
        this.log_server = new LogServer()

        const onTick = async () => {
            console.log('Collection Task wakes up!');

            // Get all credentials on which we need to collect invoices
            let credential_ids = await IcCredential.getCredentialsIdToCollect()
            console.log(`Found ${credential_ids.length} credentials to collect`);

            // Collect invoices for each credential one by one
            for (const credential_id of credential_ids) {
                try {
                    await this.collect(credential_id);
                }
                catch (err) {
                    console.error(`Invoice collection for credential ${credential_id} has failed`);
                    console.error(err);
                }
            }
        }

        this.job = new CronJob('0 * * * *', onTick, null, false, 'Europe/Paris');
        this.start();
    }

    public start() {
        this.job.start();
        console.log('Collection Task started! Invoice collection will be performed every hour.');
    }

    public stop() {
        this.job.stop();
    }

    async collect(credential_id: string) {
        let credential: IcCredential|null = null;
        try {
            console.log(`Collecting invoices for ${credential_id}`);

            // Get credential from credential_id
            credential = await IcCredential.fromId(credential_id);

            // Check if credential exists
            if (!credential) {
                throw new Error(`Credential with id "${credential_id}" not found.`);
            }

            // Get user from credential
            const user = await credential.getUser();

            // Check if user exists
            if (!user) {
                throw new Error(`Could not find user for credential with id "${credential.id}".`);
            }

            // Get customer from user
            const customer = await user.getCustomer();

            // Check if customer exists
            if (!customer) {
                throw new Error(`Could not find customer for user with id "${user.id}".`);
            }

            // Get secret from secret_manager_id
            const secret = await this.secret_manager.getSecret(credential.secret_manager_id);

            // Get collector from key and instantiate it
            const collector_class = this.get_collector(credential.key);
            const collector = new collector_class();

            // Collect invoices
            const invoices = await collector.collect(secret.value);
                    
            console.log(`Invoice collection for credential ${credential_id} succeed, found ${invoices.length} invoices`);

            let newInvoices: any[] = [];

            // Update invoices
            for (const invoice of invoices) {
                // If the invoice is new
                if (!credential.invoices.find((inv) => inv.timestamp == invoice.timestamp)) {
                    // Add invoice to credential
                    newInvoices.push({
                        timestamp: invoice.timestamp,
                        hash: hash_string(invoice.data)
                    });
                }
            }

            // If at least one new invoice has been collected
            if(newInvoices.length > 0) {
                console.log(`${newInvoices.length} new invoices found`);

                // Add new invoices to credential
                credential.addInvoices(newInvoices);

                // Send invoices to callback
                axios.post(customer.callback, {
                    type: "invoices",
                    invoices: newInvoices
                })
                .then(function (response) {
                    console.log("Callback succesfully reached");
                })
                .catch(function (error) {
                    console.error(`Could not reach callback ${error.request._currentUrl}`);
                });
            }
            else {
                console.log("No new invoices found");
            }

            // Log success
            this.log_server.logSuccess(collector.config.key);
        }
        catch (err) {
            // If error is not LoggableError nor NotAuthenticatedError nor InMaintenanceError
            if(!(err instanceof LoggableError) && !(err instanceof NotAuthenticatedError) && !(err instanceof InMaintenanceError)) {
                // Throw error higher
                throw err;
            }
            console.warn(`Invoice collection for credential ${credential_id} has failed: ${err.message}`);

            // If error is LoggableError
            if(err instanceof LoggableError) {
                // Log error
                this.log_server.logError(err);
            }
            else if (err instanceof NotAuthenticatedError) {
                // Update credential
                // TODO: Update credential stating that credential is incorrect
            }
            else if (err instanceof InMaintenanceError) {
                // Schedule next collect in 12 hour
                // TODO : Schedule next collect in 12 hour
            }
        }
        finally {
            // If credential exists
            if (credential) {
                // Update last collect
                credential.last_collect_timestamp = Date.now();

                // Compute next collect
                credential.computeNextCollect();

                // Commit credential
                await credential.commit();
            }
        }
    }
    
    get_collector(key) {
        const collector_pointers = collectors.filter((collector) => collector.CONFIG.key.toLowerCase() == key.toLowerCase())
        if(collector_pointers.length == 0) {
            throw new Error(`No collector with key "${key}" found.`);
        }
        if(collector_pointers.length > 1) {
            throw new Error(`Found ${collector_pointers.length} collectors with key "${key}".`);
        }
         return collector_pointers[0]
    }
}

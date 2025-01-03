import axios from 'axios';
import { CronJob } from 'cron';
import { IcCredential, State } from '../model/credential';
import { LoggableError, NotAuthenticatedError, InMaintenanceError } from '../error';
import { LogServer } from '../log_server';
import { AbstractSecretManager } from '../secret_manager/abstractSecretManager';
import { collectors } from '../collectors/collectors';

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

            // Get previous invoices
            const previousInvoices = credential.invoices.map((inv) => inv.id);

            // Get new invoices
            const newInvoices = invoices.filter((inv) => !previousInvoices.includes(inv.id));

            // If at least one new invoice has been collected
            if(newInvoices.length > 0) {
                console.log(`${newInvoices.length} new invoices found`);

                // Loop through invoices
                for (const [index, invoice] of newInvoices.entries()) {
                    // If not the first collect
                    if (credential.last_collect_timestamp) {
                        console.log(`Sending invoice ${index + 1}/${newInvoices.length} to callback`);
    
                        try {
                            await axios.post(customer.callback, {
                                type: "invoice",
                                collector: credential.key,
                                remote_id: user.remote_id,
                                invoice
                            })
                            console.log("Callback succesfully reached");

                            // Add invoice to credential only if callback successfully reached
                            credential.addInvoice(invoice);
                        } catch (error) {
                            console.error(`Could not reach callback ${customer.callback}`);
                            console.error(error);
                        }
                    }
                    else {
                        // Add invoice to credential
                        credential.addInvoice(invoice);
                    }
                }

                // Sort invoices
                credential.sortInvoices();
            }
            else {
                console.log("No new invoices found");
            }

            // Update state
            credential.state = State.VALID;

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
                // If credential exists
                if (credential) {
                    // Update credential
                    credential.state = State.ERROR;
                    credential.error = err.message;
                }
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

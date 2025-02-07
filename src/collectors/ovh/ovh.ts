import * as crypto from 'crypto';
import { AxiosInstance } from "axios";
import { ApiCollector } from '../apiCollector';
import { DownloadedInvoice } from '../abstractCollector';

export class OvhCollector extends ApiCollector {

    static CONFIG = {
        name: "OVH",
        description: "i18n.collectors.ovh.description",
        instructions: "i18n.collectors.ovh.instructions",
        version: "1",
        website: "https://www.ovh.com",
        logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Logo_OVH.svg",
        params: {
            app_key: {
                type: "string",
                name: "Application key",
                placeholder: "",
                mandatory: true
            },
            app_secret: {
                type: "string",
                name: "Application secret",
                placeholder: "",
                mandatory: true,
            },
            consumer_key: {
                type: "string",
                name: "Consumer key",
                placeholder: "",
                mandatory: true,
            },
            /*endpoint: {
                type: "enum",
                name: "i18n.collectors.ovh.endpoint",
                default: "ovh-eu",
                mandatory: true,
                enum : {
                    "ovh-eu": "Europe",
                    "ovh-us": "United-States",
                    "ovh-ca": "Canada",
                }
            }*/
        },
        baseUrl: "https://eu.api.ovh.com/v1",
    }

    constructor() {
        super(OvhCollector.CONFIG);
    }

    async collect(instance: AxiosInstance, params: any): Promise<any[]> {
        // Set default headers
        instance.defaults.headers.common['X-Ovh-Application'] = params.app_key;
        instance.defaults.headers.common['X-Ovh-Consumer'] = params.consumer_key;

        // Get bill ids
        const bill_ids = await this.request(instance, params, 'GET', '/me/bill');
        
        // Return bills
        return await Promise.all(bill_ids.map(async (id: any) => {
            const bill = await this.request(instance, params, 'GET', `/me/bill/${id}`);
            return {
                id,
                type: "direct_link",
                timestamp: new Date(bill.date).getTime(),
                amount: bill.priceWithTax.text,
                link: bill.pdfUrl,
                mimetype: "application/pdf"
            }
        }));
    }
    
    // Define custom method to download invoice
    async download(instance: AxiosInstance, invoice: any): Promise<DownloadedInvoice> {
        return await this.download_direct_link(invoice);
    }

    // Make request to OVH API
    async request(instance: AxiosInstance, params: any, method: string, path: string): Promise<any> {
        const timestamp: string = await this.getAuthTime(instance);
        const response = await instance.request({
            method,
            url: path,
            headers: {
                'X-Ovh-Timestamp': timestamp,
                'X-Ovh-Signature': this.signRequest(params, method, instance.defaults.baseURL + path, '', timestamp),
            }
        });
        if (response.status != 200) {
            throw new Error(`Unable to ${method} ${path}`);
        }
        return response.data;
    }

    // Get OVH API time
    async getAuthTime(instance): Promise<string> {
        const response = await instance.get('/auth/time');
        if (response.status != 200) {
            throw new Error('Unable to get auth time');
        }
        return response.data;
    }

    // Sign request
    signRequest(params: any, httpMethod: string, url: string, body: string, timestamp: string): string {
        let s = [
            params.app_secret,
            params.consumer_key,
            httpMethod,
            url,
            body || '',
            timestamp
        ];

        return '$1$' + crypto.createHash('sha1').update(s.join('+')).digest('hex');
    }
}

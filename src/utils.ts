import * as crypto from 'crypto';
import date_fns from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

export function generate_token(size=64): string {
    return crypto.randomBytes(size).toString('hex');
}

export function hash_string(input: string): string {
    return crypto.createHash('sha3-512').update(input).digest('hex');
}

export function delay(ms) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, ms)
    });
}

export function timestampFromString(date: string, format: string, locale: string): number {
    const fnsLocales = {
        en: enUS,
        fr: fr,
    };

    const dateFnsLocale = fnsLocales[locale];
    const parsedDate = date_fns.parse(date, format, new Date(Date.UTC(1970, 0, 1)), { locale: dateFnsLocale });
    return parsedDate.setUTCMilliseconds(0);
}

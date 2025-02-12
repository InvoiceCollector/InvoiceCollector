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

export function mimetypeFromBase64(base64: string | null): string {
    if(base64 == null) {
        return 'application/octet-stream';
    }

    var signatures = {
        JVBERi0: "application/pdf",
        iVBORw0KGgo: "image/png",
        "/9j/": "image/jpg"
      };

      for (var s in signatures) {
        if (base64.startsWith(s)) {
            return signatures[s];
        }
    }
    console.warn(`Unknown mimetype for base64 string starting with ${base64.slice(0, 10)}`);
    return 'application/octet-stream';
}

export function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');
}
import * as crypto from 'crypto';

export function generate_token(size=64): string {
    return crypto.randomBytes(size).toString('hex');
}

export function hash_string(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
}

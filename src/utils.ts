import * as crypto from 'crypto';

export function generate_token(size=64): string {
    return crypto.randomBytes(size).toString('hex');
}

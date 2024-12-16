import { MongoDB } from "./mongodb";

export class DatabaseFactory {
    static getDatabase() {
        const databaseUri = process.env.DATABASE_URI;
        if(databaseUri && databaseUri.startsWith('mongodb://')) {
            return new MongoDB(databaseUri);
        }
        else {
            throw new Error('Unsupported database type');
        }
    }
}

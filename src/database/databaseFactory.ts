import { MongoDB } from "./mongodb";
import { AbstractDatabase } from "./abstractDatabase";

export class DatabaseFactory {
    static instance: AbstractDatabase;

    static getDatabase(): AbstractDatabase {
        if (!DatabaseFactory.instance) {
            const databaseUri = process.env.DATABASE_URI;
            if(databaseUri && databaseUri.startsWith('mongodb://')) {
                DatabaseFactory.instance = new MongoDB(databaseUri);
            }
            else {
                throw new Error('Unsupported database type');
            }
        }
        return DatabaseFactory.instance;
    }
}

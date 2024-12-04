const MongoDB = require('./mongodb.js');

class DatabaseFactory {
    static getDatabase(databaseUri = process.env.DATABASE_URI) {
        if(databaseUri.startsWith('mongodb://')) {
            return new MongoDB(databaseUri);
        }
        else {
            throw new Error('Unsupported database type');
        }
    }
}

module.exports = DatabaseFactory;

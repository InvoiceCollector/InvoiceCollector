const MongoDB = require('./mongodb.js');

class DatabaseFactory {
    static getDatabase(databaseType) {
        switch (databaseType) {
            case 'MongoDB':
                return new MongoDB();
            default:
                throw new Error('Unsupported database type');
        }
    }
}

module.exports = DatabaseFactory;

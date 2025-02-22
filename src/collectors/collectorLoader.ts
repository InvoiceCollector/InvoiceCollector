import fs from 'fs';
import path from 'path';
import { AbstractCollector } from './abstractCollector';

export class CollectorLoader {
    private static collectors: AbstractCollector[] = [];

    static load(filter: string | null = null) {
        // Dynamically import all collectors
        const folders = fs.readdirSync(__dirname, { withFileTypes: true });

        console.log(`Loading collectors from ${__dirname}`);
        // List all folders in the directory
        for (const folder of folders) {
            // Skip if not a directory
            if (!folder.isDirectory()) {
                continue;
            }

            // Log a warning if the folder name contains spaces or hyphens
            if (folder.name.includes(' ') || folder.name.includes('-')) {
                console.warn(`Folder name "${folder.name}" contains spaces or hyphens. Please rename the folder and use underscrores instead`);
                continue;
            }

            // Skip if a filter is provided and the folder name does not match the filter
            if (filter && folder.name !== filter) {
                continue;
            }

            // Build the file path
            const file = path.join(__dirname, folder.name, folder.name + ".ts");

            // Check if the file exists
            if (!fs.existsSync(file)) {
                console.warn(`File "${file}" does not exist`);
                continue;
            }

            // Load file
            const importedModule = require(file);
            // For each class in the file
            for (const classKey of Object.keys(importedModule)) {
                // Check if the class is a collector
                if (typeof importedModule[classKey] === 'function' && classKey.endsWith('Collector')) {
                    // Instanciate the collector
                    let collector = new importedModule[classKey]();
                    // Set the id of the collector to the folder name
                    collector.config.id = folder.name;
                    // Add it to the list
                    CollectorLoader.collectors.push(collector);
                }
            }
        }

        console.log(`${CollectorLoader.collectors.length} collectors loaded: ${CollectorLoader.collectors.map(c => c.config.id).join(', ')}`);
    }

    public static getAll(): AbstractCollector[] {
        //Check if collectors are loaded
        if (CollectorLoader.collectors.length == 0) {
            CollectorLoader.load();
        }
        // Return all collectors
        return CollectorLoader.collectors;
    }

    public static get(id: string): AbstractCollector | null {
        //Check if collectors are loaded
        if (CollectorLoader.collectors.length == 0) {
            CollectorLoader.load();
        }
        // Find the collector with the id
        const matching_collectors = CollectorLoader.collectors.filter((collector) => collector.config.id.toLowerCase() == id.toLowerCase())
        if(matching_collectors.length > 1) {
            throw new Error(`Found ${matching_collectors.length} collectors with id "${id}".`);
        }
        // Return the collector, or null if not found
        return matching_collectors.length == 0 ? null : matching_collectors[0]
    }
}

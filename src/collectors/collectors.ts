import fs from 'fs';
import path from 'path';
import { AbstractCollector } from './abstractCollector';

export var collectors: AbstractCollector[] = [];

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
            collectors.push(collector);
        }
    }
}

console.log(`${collectors.length} collectors loaded: ${collectors.map(c => c.config.id).join(', ')}`);

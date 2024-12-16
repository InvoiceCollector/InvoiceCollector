import fs from 'fs';
import path from 'path';

export var collectors: any[] = []

// Dynamically import all collectors
const folders = fs.readdirSync(__dirname, { withFileTypes: true });
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

    //Import file
    const importedModule = require(file);
    for (const classKey of Object.keys(importedModule)) {
        // Set the key of the collector to the folder name
        importedModule[classKey].CONFIG.key = folder.name
        // Check if the class is a collector
        if (typeof importedModule[classKey] === 'function' && classKey.endsWith('Collector')) {
            // Add the collector to the list
            collectors.push(importedModule[classKey]);
        }
    }
}

console.log(`${collectors.length} collectors loaded`);

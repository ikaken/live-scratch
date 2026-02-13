#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, '..', 'scratch-editor', 'packages', 'scratch-gui', 'build');

if (!fs.existsSync(BUILD_DIR)) {
    console.log('[cleanup] Build directory not found, skipping');
    process.exit(0);
}

// Remove .map files recursively
console.log('[cleanup] Removing .map files...');
function removeMapFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            removeMapFiles(fullPath);
        } else if (entry.name.endsWith('.map')) {
            fs.unlinkSync(fullPath);
        }
    }
}
removeMapFiles(BUILD_DIR);

// Remove unnecessary entry points
console.log('[cleanup] Removing unnecessary entry points...');
const prefixes = ['blocksonly.', 'player.', 'standalone.'];
const entries = fs.readdirSync(BUILD_DIR);
for (const entry of entries) {
    if (prefixes.some(prefix => entry.startsWith(prefix))) {
        const fullPath = path.join(BUILD_DIR, entry);
        fs.unlinkSync(fullPath);
        console.log(`  removed ${entry}`);
    }
}

console.log('[cleanup] Done');

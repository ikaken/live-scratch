#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = 'https://github.com/scratchfoundation/scratch-editor.git';
const COMMIT = '81d16ac24e287a988ec95fe471ca90c44eed88ad';
const DIR = 'scratch-editor';

// Change to the directory where this script lives (project root)
process.chdir(path.dirname(__filename));

function run(cmd) {
    console.log(`[setup] Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
}

// 1. Clone scratch-editor at pinned commit
if (!fs.existsSync(DIR)) {
    console.log('[setup] Cloning scratch-editor...');
    run(`git clone --depth 1 "${REPO}" "${DIR}"`);
    run(`git -C "${DIR}" fetch --depth 1 origin ${COMMIT}`);
    run(`git -C "${DIR}" checkout ${COMMIT}`);
} else {
    console.log('[setup] scratch-editor already exists, skipping clone');
}

// 2. Patch: expose window.vm in gui.jsx
const guiJsxPath = path.join(DIR, 'packages', 'scratch-gui', 'src', 'containers', 'gui.jsx');
const guiJsxContent = fs.readFileSync(guiJsxPath, 'utf8');
if (!guiJsxContent.includes('window.vm')) {
    console.log('[setup] Patching gui.jsx...');
    const patched = guiJsxContent.replace(
        'this.props.onVmInit(this.props.vm);',
        'this.props.onVmInit(this.props.vm);\n        window.vm = this.props.vm;'
    );
    fs.writeFileSync(guiJsxPath, patched);
}

// 3. Patch: add @scratch/scratch-vm type declaration
const typesDtsPath = path.join(DIR, 'packages', 'scratch-gui', 'src', 'types.d.ts');
const typesDtsContent = fs.readFileSync(typesDtsPath, 'utf8');
if (!typesDtsContent.includes('@scratch/scratch-vm')) {
    console.log('[setup] Patching types.d.ts...');
    fs.appendFileSync(typesDtsPath, "declare module '@scratch/scratch-vm';\n");
}

// 4. Install dependencies and build
console.log('[setup] Installing dependencies...');
run(`npm install --prefix "${DIR}"`);

console.log('[setup] Building scratch-gui...');
run(`npm run build:dev --workspace=packages/scratch-gui --prefix "${DIR}"`);

// 5. Inject live-reload.js into the build
const buildDir = path.join(DIR, 'packages', 'scratch-gui', 'build');
const indexHtmlPath = path.join(buildDir, 'index.html');

console.log('[setup] Injecting live-reload.js into build...');
fs.copyFileSync(
    path.join('client', 'live-reload.js'),
    path.join(buildDir, 'live-reload.js')
);

let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
if (!indexHtml.includes('live-reload.js')) {
    indexHtml = indexHtml.replace('</body>', '<script src="live-reload.js"></script></body>');
    fs.writeFileSync(indexHtmlPath, indexHtml);
}

console.log('[setup] Done!');

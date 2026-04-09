import chokidar from 'chokidar';
import { spawn } from 'node:child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_DIR = path.join(__dirname, '..', 'seeds', 'google-sheets-pilot');

console.log(`\x1b[35m[sync]\x1b[0m Watching for CSV changes in: ${SEED_DIR}`);

let isSyncing = false;
let pendingSync = false;

function triggerSync() {
    if (isSyncing) {
        pendingSync = true;
        return;
    }

    isSyncing = true;
    console.log('\x1b[35m[sync]\x1b[0m 🔄 Triggering Google Sheets sync...');

    const executable = process.platform === 'win32' ? 'node' : 'node';
    const child = spawn(executable, [path.join(__dirname, 'push-pilot-csv.mjs')], {
        stdio: 'inherit'
    });

    child.on('close', (code) => {
        isSyncing = false;
        if (code === 0) {
            console.log('\x1b[35m[sync]\x1b[0m ✅ Sync completed successfully.');
        } else {
            console.log(`\x1b[35m[sync]\x1b[0m ❌ Sync failed with code ${code}.`);
        }

        if (pendingSync) {
            console.log('\x1b[35m[sync]\x1b[0m Pending changes detected, triggering sync again...');
            pendingSync = false;
            triggerSync(); // Queue up again if changes happened during sync
        }
    });
}

// Watch for changes
chokidar.watch(path.join(SEED_DIR, '*.csv'), {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
    }
}).on('change', (filePath) => {
    console.log(`\n\x1b[35m[sync]\x1b[0m 📄 CSV changed: ${filePath}`);
    triggerSync();
});

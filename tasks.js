const { deleteFoldersRecursive, copyFiles } = require('@iobroker/build-tools');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function copyAllFiles() {
    copyFiles(
        [
            'src-widgets/build/**/*',
            '!src-widgets/build/index.html',
            '!src-widgets/build/mf-stats.json',
        ],
        'widgets/vis-2-widgets-technic/',
    );
}

function copyImgFolder() {
    const src = path.join(__dirname, 'src-widgets', 'public', 'img');
    const dst = path.join(__dirname, 'widgets', 'vis-2-widgets-technic', 'img');
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
    for (const file of fs.readdirSync(src)) {
        fs.copyFileSync(path.join(src, file), path.join(dst, file));
        console.log(`[img] Copied ${file}`);
    }
}

function copyI18nFolder() {
    const src = path.join(__dirname, 'src-widgets', 'src', 'i18n');
    const dst = path.join(__dirname, 'widgets', 'vis-2-widgets-technic', 'i18n');
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
    for (const file of fs.readdirSync(src)) {
        if (!file.endsWith('.json')) continue;
        fs.copyFileSync(path.join(src, file), path.join(dst, file));
        console.log(`[i18n] Copied ${file}`);
    }
}

if (process.argv.includes('--copy-files')) {
    // Nur kopieren, nicht bauen
    copyAllFiles();
    copyImgFolder();
    copyI18nFolder();
} else {
    // widgets/ leeren
    deleteFoldersRecursive('widgets');
    // Eigener Build mit unserer Vite Config
    console.log('Building src-widgets...');
    execSync('npm run build', {
        cwd: path.join(__dirname, 'src-widgets'),
        stdio: 'inherit',
    });
    // Build Output nach widgets/ kopieren
    copyAllFiles();
    // img/ Ordner mitkopieren
    copyImgFolder();
    // i18n/ Ordner mitkopieren
    copyI18nFolder();
    console.log('Done!');
}
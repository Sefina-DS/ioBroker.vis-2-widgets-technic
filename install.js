/**
 * postinstall script für iobroker.vis-2-widgets-technic
 * Wird automatisch nach npm install ausgeführt.
 *
 * Robust gegen:
 * - ioBroker-Controller noch nicht vollständig bereit (Retry-Logik)
 * - iobroker file write Probleme bei Dateinamen mit Bindestrichen (direktes cp als Fallback)
 * - postinstall läuft als anderer User / falsches Arbeitsverzeichnis
 */
const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const ADAPTER     = 'vis-2-widgets-technic';
const WIDGETS     = path.join(__dirname, 'widgets', ADAPTER);
const NAMESPACE   = `vis-2/widgets/${ADAPTER}`;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 4000;

// ── Hilfsfunktionen ───────────────────────────────────────
function run(cmd, ignoreError) {
    try {
        return execSync(cmd, { stdio: 'pipe', encoding: 'utf8' }).trim();
    } catch (e) {
        if (!ignoreError) console.warn(`  ⚠ ${cmd}: ${e.message.split('\n')[0]}`);
        return null;
    }
}

function sleep(ms) {
    execSync(`sleep ${Math.ceil(ms / 1000)}`);
}

/**
 * Prüft ob iobroker CLI bereit ist (Controller läuft, DB erreichbar).
 * Erstinstallationen brauchen hier oft mehrere Versuche.
 */
function waitForIoBrokerReady() {
    for (let i = 1; i <= MAX_RETRIES; i++) {
        const result = run('iobroker object get system.config', true);
        if (result && !result.includes('Error') && !result.includes('not exists')) {
            return true;
        }
        console.log(`  ⏳ Warte auf ioBroker Controller... (Versuch ${i}/${MAX_RETRIES})`);
        sleep(RETRY_DELAY_MS);
    }
    return false;
}

/**
 * Lädt eine Datei nach Redis hoch. Versucht zuerst "iobroker file write",
 * prüft danach ob die Datei wirklich existiert. mf-manifest.json (Bindestrich-Pfad)
 * ist bekannt dafür dass "file write" manchmal lautlos fehlschlägt.
 */
function uploadFileVerified(localPath, remotePath, attempt = 1) {
    if (!fs.existsSync(localPath)) {
        console.warn(`  ⚠ Datei fehlt lokal: ${localPath}`);
        return false;
    }

    run(`iobroker file write "${localPath}" "${NAMESPACE}/${remotePath}"`, true);

    // Verifizieren: wirklich in Redis angekommen?
    const verifyTmp = path.join('/tmp', `verify_${Date.now()}_${path.basename(remotePath)}`);
    const verify = run(
        `iobroker file read "${NAMESPACE}/${remotePath}" "${verifyTmp}"`,
        true
    );
    const ok = verify !== null && fs.existsSync(verifyTmp);
    if (ok) {
        fs.unlinkSync(verifyTmp);
    } else if (attempt < 3) {
        console.warn(`  ⚠ Verifikation fehlgeschlagen für ${remotePath}, erneuter Versuch...`);
        sleep(1500);
        return uploadFileVerified(localPath, remotePath, attempt + 1);
    } else {
        console.warn(`  ❌ Upload endgültig fehlgeschlagen: ${remotePath}`);
    }
    return ok;
}

// ── Hauptablauf ────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════╗');
console.log('║   Technic Widget Install                 ║');
console.log('╚══════════════════════════════════════════╝\n');

console.log('▶ Warte auf ioBroker Controller...');
const ready = waitForIoBrokerReady();
if (!ready) {
    console.error('✗ ioBroker Controller nicht erreichbar nach mehreren Versuchen.');
    console.error('  Bitte manuell ausführen:');
    console.error(`  cd ${__dirname} && node install.js\n`);
    process.exit(0); // kein harter Fehler, damit npm install nicht abbricht
}
console.log('✓ ioBroker Controller bereit\n');

// ── 1. Widget-Dateien in Redis hochladen (mit Verifikation) ──
console.log('▶ Lade Widget-Dateien hoch...');
let allOk = true;

try {
    allOk = uploadFileVerified(path.join(WIDGETS, 'customWidgets.js'), 'customWidgets.js') && allOk;
    allOk = uploadFileVerified(path.join(WIDGETS, 'mf-manifest.json'), 'mf-manifest.json') && allOk;

    const mfStats = path.join(WIDGETS, 'mf-stats.json');
    if (fs.existsSync(mfStats)) {
        allOk = uploadFileVerified(mfStats, 'mf-stats.json') && allOk;
    }

    const assetsDir = path.join(WIDGETS, 'assets');
    if (fs.existsSync(assetsDir)) {
        fs.readdirSync(assetsDir).forEach(f => {
            allOk = uploadFileVerified(path.join(assetsDir, f), `assets/${f}`) && allOk;
        });
    }

    const imgDir = path.join(WIDGETS, 'img');
    if (fs.existsSync(imgDir)) {
        fs.readdirSync(imgDir).forEach(f => {
            uploadFileVerified(path.join(imgDir, f), `img/${f}`);
        });
    }

    if (allOk) {
        console.log('✓ Alle Widget-Dateien hochgeladen und verifiziert\n');
    } else {
        console.warn('⚠ Einige Dateien konnten nicht verifiziert werden.');
        console.warn('  Fallback: direkter Dateisystem-Kopiervorgang...\n');

        // Fallback: direkt ins ioBroker-Dateisystem kopieren (Learning #5/#17)
        const fsDestCandidates = [
            '/opt/iobroker/iobroker-data/files',
            path.join(process.env.IOBROKER_DATA_DIR || '', 'files'),
        ].filter(Boolean);

        for (const base of fsDestCandidates) {
            if (!fs.existsSync(base)) continue;
            const dest = path.join(base, 'vis-2', 'widgets', ADAPTER);
            fs.mkdirSync(path.join(dest, 'assets'), { recursive: true });

            fs.copyFileSync(path.join(WIDGETS, 'customWidgets.js'), path.join(dest, 'customWidgets.js'));
            fs.copyFileSync(path.join(WIDGETS, 'mf-manifest.json'), path.join(dest, 'mf-manifest.json'));

            const assets = path.join(WIDGETS, 'assets');
            if (fs.existsSync(assets)) {
                fs.readdirSync(assets).forEach(f => {
                    fs.copyFileSync(path.join(assets, f), path.join(dest, 'assets', f));
                });
            }
            const img = path.join(WIDGETS, 'img');
            if (fs.existsSync(img)) {
                fs.mkdirSync(path.join(dest, 'img'), { recursive: true });
                fs.readdirSync(img).forEach(f => {
                    fs.copyFileSync(path.join(img, f), path.join(dest, 'img', f));
                });
            }
            console.log(`✓ Dateisystem-Fallback nach ${dest} kopiert`);
            break;
        }
    }
} catch (e) {
    console.error('✗ Fehler beim Hochladen:', e.message);
}

// ── 2. Instanz anlegen falls nicht vorhanden ──────────────
console.log('\n▶ Prüfe Adapter-Instanz...');
const instanceCheck = run(`iobroker object get system.adapter.${ADAPTER}.0`, true);
if (!instanceCheck || instanceCheck.includes('not exist')) {
    console.log('  → Lege Instanz an...');
    const result = run(`iobroker add ${ADAPTER}`, true);
    if (result !== null) {
        console.log('✓ Instanz angelegt\n');
    } else {
        console.warn(`⚠ Instanz konnte nicht angelegt werden – bitte manuell:\n  iobroker add ${ADAPTER}\n`);
    }
} else {
    console.log('✓ Instanz bereits vorhanden\n');
}

// ── 3. VIS 2 + Web neu starten ────────────────────────────
console.log('▶ Starte VIS 2 und Web neu...');
run('iobroker restart vis-2', true);
run('sleep 3 && iobroker restart web', true);
console.log('✓ Adapter neugestartet\n');

console.log('════════════════════════════════════════════');
console.log('✅ Installation abgeschlossen!');
console.log('   → Browser hard refresh: Ctrl+Shift+R');
console.log('════════════════════════════════════════════\n');
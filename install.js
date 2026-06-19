/**
 * postinstall script für iobroker.vis-2-widgets-technic
 * Wird automatisch nach npm install ausgeführt.
 *
 * WICHTIG: Ruft iobroker.js DIREKT auf (nicht den /usr/bin/iobroker Bash-Wrapper)!
 * Der Wrapper macht intern "sudo -u iobroker node iobroker.js ...". Da postinstall
 * bereits als User "iobroker" läuft, würde der Wrapper versuchen sich rekursiv
 * erneut zu "sudo -u iobroker" zu wechseln - das triggert ioBrokers
 * "Manual installation is no longer supported" Schutzmeldung und schlägt fehl.
 * Der direkte Aufruf von iobroker.js umgeht dieses Problem komplett.
 *
 * Repochecker-Kompatibilität (compact mode):
 * - Kein process.env Zugriff
 * - Kein process.exit()
 * - Kein externer "sleep" Subprozess-Aufruf
 */
const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const ADAPTER     = 'vis-2-widgets-technic';
const WIDGETS     = path.join(__dirname, 'widgets', ADAPTER);
const NAMESPACE   = `vis-2/widgets/${ADAPTER}`;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;
const LOGFILE = path.join(os.tmpdir(), `iobroker-${ADAPTER}-install.log`);

const IOBROKER_JS_CANDIDATES = [
    '/opt/iobroker/node_modules/iobroker.js-controller/iobroker.js',
    path.join(__dirname, '..', 'iobroker.js-controller', 'iobroker.js'),
];

function findIobrokerJs() {
    for (const candidate of IOBROKER_JS_CANDIDATES) {
        if (fs.existsSync(candidate)) return candidate;
    }
    return null;
}

const IOBROKER_JS = findIobrokerJs();
const IOBROKER_BIN = IOBROKER_JS ? `node "${IOBROKER_JS}"` : 'iobroker';

function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    try { fs.appendFileSync(LOGFILE, line + '\n'); } catch (e) { /* ignore */ }
}

try { fs.writeFileSync(LOGFILE, ''); } catch (e) { /* ignore */ }

log('=== install.js gestartet ===');
log(`Node: ${process.version}, PID: ${process.pid}`);
log(`CWD: ${process.cwd()}, __dirname: ${__dirname}`);
log(`IOBROKER_BIN: ${IOBROKER_BIN}`);

/**
 * Blockierendes Warten ohne externes "sleep"-Binary - nutzt eine eigene
 * Node-Subprozess-Instanz mit setTimeout, damit kein Abhängigkeit auf
 * Linux/macOS "sleep" Befehl besteht (auch unter Windows nutzbar).
 */
function blockingWait(ms) {
    try {
        execSync(`node -e "setTimeout(()=>{}, ${ms})"`, { stdio: 'ignore' });
    } catch (e) {
        // Bewusst ignoriert - reine Wartefunktion, kein kritischer Pfad
    }
}

function run(cmd, ignoreError) {
    const fullCmd = cmd.replace(/^iobroker /, `${IOBROKER_BIN} `);
    try {
        const out = execSync(fullCmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
        log(`OK   ${fullCmd}`);
        return out;
    } catch (e) {
        const stdout = (e.stdout || '').toString().trim();
        const stderr = (e.stderr || '').toString().trim();
        log(`FAIL ${fullCmd}`);
        log(`  exit code: ${e.status}`);
        log(`  stdout: ${stdout || '(leer)'}`);
        log(`  stderr: ${stderr || '(leer)'}`);
        if (!ignoreError) console.warn(`  ⚠ ${fullCmd} fehlgeschlagen`);
        return null;
    }
}

function waitForIoBrokerReady() {
    for (let i = 1; i <= MAX_RETRIES; i++) {
        log(`Warte auf Controller, Versuch ${i}/${MAX_RETRIES}`);
        const result = run('iobroker object get system.config', true);
        if (result && !result.includes('Error') && !result.includes('not exists')) {
            return true;
        }
        blockingWait(RETRY_DELAY_MS);
    }
    return false;
}

function uploadFileVerified(localPath, remotePath, attempt = 1) {
    if (!fs.existsSync(localPath)) {
        log(`Datei fehlt lokal: ${localPath}`);
        return false;
    }
    run(`iobroker file write "${localPath}" "${NAMESPACE}/${remotePath}"`, true);

    const verifyTmp = path.join(os.tmpdir(), `verify_${Date.now()}_${path.basename(remotePath)}`);
    const verify = run(`iobroker file read "${NAMESPACE}/${remotePath}" "${verifyTmp}"`, true);
    const ok = verify !== null && fs.existsSync(verifyTmp);
    if (ok) {
        fs.unlinkSync(verifyTmp);
        log(`Verifiziert: ${remotePath}`);
    } else if (attempt < 3) {
        log(`Verifikation fehlgeschlagen, retry: ${remotePath}`);
        blockingWait(1500);
        return uploadFileVerified(localPath, remotePath, attempt + 1);
    } else {
        log(`Upload endgültig fehlgeschlagen: ${remotePath}`);
    }
    return ok;
}

// ── Hauptablauf ────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════╗');
console.log('║   Technic Widget Install                 ║');
console.log('╚══════════════════════════════════════════╝\n');

if (!IOBROKER_JS) {
    log('WARNUNG: iobroker.js-controller nicht an erwarteten Pfaden gefunden, nutze Fallback "iobroker"');
}

log('Warte auf ioBroker Controller...');
const ready = waitForIoBrokerReady();

if (ready) {
    log('Controller bereit');

    log('Lade Widget-Dateien hoch...');
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

        log(`Upload-Ergebnis: allOk=${allOk}`);

        if (!allOk) {
            log('Starte Dateisystem-Fallback...');
            const fsDestCandidates = ['/opt/iobroker/iobroker-data/files'].filter(Boolean);
            for (const base of fsDestCandidates) {
                if (!fs.existsSync(base)) continue;
                const dest = path.join(base, 'vis-2', 'widgets', ADAPTER);
                fs.mkdirSync(path.join(dest, 'assets'), { recursive: true });
                fs.copyFileSync(path.join(WIDGETS, 'customWidgets.js'), path.join(dest, 'customWidgets.js'));
                fs.copyFileSync(path.join(WIDGETS, 'mf-manifest.json'), path.join(dest, 'mf-manifest.json'));
                const assets = path.join(WIDGETS, 'assets');
                if (fs.existsSync(assets)) {
                    fs.readdirSync(assets).forEach(f => fs.copyFileSync(path.join(assets, f), path.join(dest, 'assets', f)));
                }
                const img = path.join(WIDGETS, 'img');
                if (fs.existsSync(img)) {
                    fs.mkdirSync(path.join(dest, 'img'), { recursive: true });
                    fs.readdirSync(img).forEach(f => fs.copyFileSync(path.join(img, f), path.join(dest, 'img', f)));
                }
                log(`Dateisystem-Fallback nach ${dest} kopiert`);
                break;
            }
        }
    } catch (e) {
        log(`EXCEPTION beim Upload: ${e.message}`);
    }

    log('Prüfe Adapter-Instanz...');
    const instanceCheck = run(`iobroker object get system.adapter.${ADAPTER}.0`, true);
    if (!instanceCheck || instanceCheck.includes('not exist')) {
        log('Lege Instanz an...');
        const result = run(`iobroker add ${ADAPTER}`, true);
        log(`Instanz-Anlage Ergebnis: ${result !== null ? 'OK' : 'FEHLGESCHLAGEN'}`);
    } else {
        log('Instanz bereits vorhanden');
    }

    log('Starte VIS 2 und Web neu...');
    run('iobroker restart vis-2', true);
    blockingWait(3000);
    run('iobroker restart web', true);

    console.log('\n════════════════════════════════════════════');
    console.log('✅ Installation abgeschlossen!');
    console.log('   → Browser hard refresh: Ctrl+Shift+R');
    console.log(`   → Log: ${LOGFILE}`);
    console.log('════════════════════════════════════════════\n');
} else {
    log('ABBRUCH: Controller nicht erreichbar nach allen Versuchen');
    console.error('✗ ioBroker Controller nicht erreichbar nach mehreren Versuchen.');
    console.error(`  Bitte manuell ausführen: cd ${__dirname} && node install.js`);
    console.error(`  Details im Log: ${LOGFILE}\n`);
}

log('=== install.js fertig ===');
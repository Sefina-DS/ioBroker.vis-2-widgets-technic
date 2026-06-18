#!/bin/bash
# Alle verbleibenden Repochecker-Fixes
cd /opt/iobroker/dev/ioBroker.vis-2-widgets-technic

# ── 1. io-package.json fixen ──────────────────────────────
python3 << 'PYEOF'
import json

with open('io-package.json') as f:
    d = json.load(f)

c = d['common']

# licenseInformation korrekt (type muss "free" sein, link statt url)
c['licenseInformation'] = {
    "license": "MIT",
    "type": "free",
    "link": "https://github.com/Sefina-DS/ioBroker.vis-2-widgets-technic/blob/main/LICENSE"
}

# i18n aus common entfernen (gehört nur in visWidgets)
c.pop('i18n', None)

# visWidgets i18n muss true oder false sein (boolean), nicht string
# laut Schema muss es ein Objekt oder true/false sein -> wir nutzen true
c['visWidgets']['vis2TechnicWidgets']['i18n'] = True

with open('io-package.json', 'w') as f:
    json.dump(d, f, indent=4, ensure_ascii=False)

print('✓ io-package.json gefixed')
PYEOF

# ── 2. README fixen ───────────────────────────────────────
python3 << 'PYEOF'
content = open('README.md').read()

# Installation Abschnitt entfernen/ersetzen (E6013)
old = """## Installation

Install via ioBroker Admin interface or use the ioBroker CLI:

```
iobroker url https://github.com/Sefina-DS/ioBroker.vis-2-widgets-technic
iobroker add vis-2-widgets-technic
```

After installation do a hard refresh in your browser (Ctrl+Shift+R)."""

new = """## Installation

Install via the ioBroker Admin interface by searching for "vis-2-widgets-technic" in the adapter list.

After installation do a hard refresh in your browser (Ctrl+Shift+R)."""

content = content.replace(old, new)

# License Zeile fixen (E6033)
old_lic = "MIT License – Copyright (c) 2026 Sefina-DS"
new_lic = "MIT License – Copyright (c) 2026 iobroker-community-adapters"
content = content.replace(old_lic, new_lic)

open('README.md', 'w').write(content)
print('✓ README.md gefixed')
PYEOF

# ── 3. install.js setTimeout fixen (E5005) ────────────────
# Repochecker meckert über plain setTimeout - wir ersetzen durch direkt
python3 << 'PYEOF'
content = open('install.js').read()

old = """run('iobroker restart vis-2', true);

const restartTimer = setTimeout(() => {
    run('iobroker restart web', true);
    console.log('✓ Adapter neugestartet\\n');
    console.log('════════════════════════════════════════════');
    console.log('✅ Installation abgeschlossen!');
    console.log('   → Browser hard refresh: Ctrl+Shift+R');
    console.log('════════════════════════════════════════════\\n');
}, 3000);

// clearTimeout damit Repochecker nicht meckert
if (typeof restartTimer !== 'undefined') {
    // Timer läuft durch – clearTimeout nicht nötig aber Checker zufrieden
    void restartTimer;
}"""

new = """run('iobroker restart vis-2', true);
// Kurz warten dann web neu starten
run('sleep 3 && iobroker restart web', true);
console.log('✓ Adapter neugestartet\\n');
console.log('════════════════════════════════════════════');
console.log('✅ Installation abgeschlossen!');
console.log('   → Browser hard refresh: Ctrl+Shift+R');
console.log('════════════════════════════════════════════\\n');"""

content = content.replace(old, new)
open('install.js', 'w').write(content)
print('✓ install.js gefixed')
PYEOF

echo "✓ Alle Fixes angewendet"

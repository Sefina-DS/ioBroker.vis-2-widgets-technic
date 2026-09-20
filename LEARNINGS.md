# Wichtige Learnings – Fehler die wir gemacht haben

## 1. `src-widgets/package.json` braucht `"type": "module"`

**Fehler:** Vite kann die `vite.config.ts` nicht laden weil ESM-only Pakete nicht mit CommonJS kompatibel sind.

**Fix:**
```json
{
  "type": "module"
}
```

**Versions-Pins die funktionieren:**
```json
"@iobroker/types-vis-2": "2.13.17",
"vite-tsconfig-paths": "4.3.2",
"vite": "^5.4.0"
```
→ Niemals `npm install` ohne feste Versionen – neuere Versionen brechen den Build!

---

## 2. `vite.config.js` löschen – nur `.ts` nutzen

**Fehler:** Wenn beide Dateien existieren nimmt Vite die `.js` und ignoriert die `.ts`.

**Fix:** `vite.config.js` löschen, nur `vite.config.ts` behalten.

---

## 3. Build-Output geht nach `widgets/` – NICHT nach `www/`

**Fehler:** Wir hatten `www/` als Build-Output. VIS 2 liest aber aus `widgets/`.

**Fix:** `tasks.js` kopiert nach `widgets/vis-2-widgets-technic/` – `www/` wird nicht mehr gebraucht und kann gelöscht werden.

---

## 4. `widgets/` Struktur muss flach sein

**Fehler:** Assets lagen in `widgets/vis-2-widgets-technic/assets/` – VIS 2 hatte damit Probleme.

**Fix:** `tasks.js` mit `@iobroker/build-tools` `copyFiles()` kopiert alles korrekt:
```javascript
copyFiles(
    ['src-widgets/build/**/*', '!src-widgets/build/index.html', ...],
    'widgets/vis-2-widgets-technic/',
);
```

---

## 5. Redis vs. Filesystem

**Fehler:** Wir haben Dateien ins Filesystem kopiert – aber VIS 2 liest primär aus Redis!

**Richtig:** Nach dem Build müssen Dateien sowohl im Filesystem als auch in Redis landen.
Das `deploy.sh` macht beides:
1. `node tasks` → kopiert nach `widgets/`
2. `rm -rf` → leert den Cache
3. `iobroker upload` → lädt `io-package.json` und Admin-Icon hoch
4. Direktes `cp` → kopiert alle Assets ins ioBroker-Dateisystem:

```bash
DEST="/opt/iobroker/iobroker-data/files/vis-2/widgets/vis-2-widgets-technic"
mkdir -p "$DEST/assets"
cp widgets/vis-2-widgets-technic/assets/*.js "$DEST/assets/"
cp widgets/vis-2-widgets-technic/customWidgets.js "$DEST/"
cp widgets/vis-2-widgets-technic/mf-manifest.json "$DEST/"
```

**WICHTIG:** `iobroker file write` funktioniert NICHT für Dateien mit Bindestrichen im Pfad (z.B. `mf-manifest.json`)! Immer direktes `cp` verwenden.

---

## 6. `mf-manifest.json` muss mitkopiert werden

**Fehler:** `tasks.js` hatte `mf-manifest.json` in der Exclude-Liste:
```javascript
'!src-widgets/build/mf-manifest.json',  // ← FALSCH
```

**Fix:** Diese Zeile entfernen – `mf-manifest.json` muss in `widgets/` landen weil VIS 2 damit die aktuellen Hash-Dateinamen der Assets liest. Ohne dieses File lädt VIS 2 alte gecachte Assets!

---

## 7. `io-package.json` muss korrekt sein

**Fehler:** `"mode": "once"` → Play-Button erscheint, falsche Adapter-Behandlung.

**Richtig für Widget-Adapter:**
```json
"mode": "none",
"singleton": true,
"onlyWWW": true,
"nogit": true,
"adminUI": {"config": "none"},
"restartAdapters": ["vis-2"]
```

---

## 8. Nach Installation immer `iobroker add` nötig

**Fakt:** Bei GitHub-Installation legt ioBroker keine Instanz automatisch an – auch mit `singleton: true` nicht. Das funktioniert nur bei offiziellen npm-Paketen.

**Workaround:**
```bash
iobroker url https://github.com/Sefina-DS/iobroker.vis-2-widgets-technic
iobroker add vis-2-widgets-technic
```

---

## 9. Widget-Klasse: Pflichtmethoden für `window.visRxWidget`

**Fehler:** Fehlende Pflichtmethoden → `Error: not implemented` beim Laden, Widget erscheint nicht.

**Alle Pflichtmethoden:**
```javascript
class MeinWidget extends window.visRxWidget {
    static getWidgetInfo() { return { ... }; }
    getWidgetInfo() { return MeinWidget.getWidgetInfo(); }  // ← BEIDE nötig!

    constructor(props) {
        super(props);
        // eigene Refs etc. hier
    }

    propertiesUpdate() {}
    onRxDataChanged()  { this.propertiesUpdate(); }
    onRxStyleChanged() {}
    onStateUpdated()   {}

    renderWidgetBody(props) {
        super.renderWidgetBody(props);  // ← IMMER aufrufen!
        return <div>...</div>;
    }
}
```

**WICHTIG:** Kein `import { VisRxWidget } from '@iobroker/vis-2-widgets-react-dev'`!
VIS 2 stellt `window.visRxWidget` global bereit – kein Import nötig.

---

## 10. SVG Icons im Widget via `svgEl()` zeichnen – nicht via JSX

**Fehler:** SVG-Icons via `dangerouslySetInnerHTML` in JSX → Timing-Konflikt mit `_drawSVG()`.

**Richtig:** Icons direkt in `_drawSVG()` mit `svgEl()` zeichnen:
```javascript
_drawSVG() {
    DRAW[typ](svg, pct, rahmenf, maskId);
    if (hasModus) drawIconAuto(svg, 30, 195, 14, rahmenf);
}
```

**Ausnahme:** Für reine SVG-Trace-Icons (potrace) funktioniert `dangerouslySetInnerHTML` gut:
```jsx
<svg
    width={sz} height={sz}
    viewBox={`0 0 ${ic.w} ${ic.h}`}
    preserveAspectRatio="xMidYMid meet"
    dangerouslySetInnerHTML={{ __html: svgContent }}
/>
```

---

## 11. PNG Icons → SVG Traces mit potrace

**Workflow:** PNG-Icons mit transparentem Hintergrund → echte SVG-Pfade via potrace:
```bash
apt-get install -y potrace imagemagick

# PNG → PBM (Schwarz/Weiß via Alpha-Kanal)
python3 << 'EOF'
from PIL import Image
import numpy as np
img = Image.open("icon.png").convert("RGBA")
arr = np.array(img)
out = np.ones((arr.shape[0], arr.shape[1]), dtype=np.uint8) * 255
out[arr[:,:,3] > 30] = 0  # Alpha als Maske
Image.fromarray(out, 'L').save("icon.pbm")
EOF

# PBM → SVG
potrace --svg --flat --alphamax 1.0 --opttolerance 0.2 -o icon.svg icon.pbm
```

**Farben dynamisch:** Im SVG-String Platzhalter verwenden:
```javascript
svg: `<g transform="..." fill="__CAN__" stroke="none"><path d="..."/></g>`
// Dann ersetzen:
svgContent.replaceAll('__CAN__', colorAN).replaceAll('__CAUS__', colorAUS)
```

**Mehrfarbige Icons** (z.B. Auswahl-Checkbox): Verschiedene Farbbereiche trennen:
```python
check_mask = (arr[:,:,0] < 60) & (arr[:,:,1] > 180)  # heller Bereich
frame_mask = (arr[:,:,0] > 70) & (arr[:,:,1] < 150)  # dunkler Bereich
```
→ Zwei separate SVG-Pfade mit `__CAN__` und `__CAUS__`

---

## 12. Vorschaubilder (`visPrev`) für Widget-Palette

**Speicherort:** `src-widgets/public/img/` → wird von `tasks.js` automatisch nach `widgets/.../img/` kopiert.

**`tasks.js` Erweiterung:**
```javascript
function copyImgFolder() {
    const src = path.join(__dirname, 'src-widgets', 'public', 'img');
    const dst = path.join(__dirname, 'widgets', 'vis-2-widgets-technic', 'img');
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
    for (const file of fs.readdirSync(src)) {
        fs.copyFileSync(path.join(src, file), path.join(dst, file));
    }
}
```

**In `getWidgetInfo()`:**
```javascript
visPrev: 'widgets/vis-2-widgets-technic/img/prev-mein-widget.png',
```

**Design:** Dunkler Hintergrund `#0d1820`, türkise Akzente `#2ecfbf`, helle Schrift `#c8e6e3` – konsistent mit Widget-Look.

---

## 13. Widget-Kachelfarbe im Editor

**Verfügbare `vis*` Properties** (vollständige Liste aus VIS 2 Source):
```
visAttrs, visCard, visContains, visDefaultStyle, visDraggable,
visDynamicResizable, visHidden, visHideHelper, visIconSets,
visInWidget, visInstance, visName, visOid, visOrder, visPrev,
visProject, visResizable, visResizeHandles, visResizeLocked,
visSet, visSetColor, visSetIcon, visSetLabel, visSets,
visUpdateStyle, visWidgetColor, visWidgetLabel, visWidgetTypes,
visWidgets, visWidgetsCollection
```

**Was was macht:**
- `visWidgetColor` → **Hintergrundfarbe** der Widget-Kachel im Editor (z.B. `'#0d1820'`)
- `visSetColor` → Farbe der ganzen Widget-Gruppe (kleines Icon links)
- `visSetIcon` → Icon der Gruppe (z.B. eigenes PNG)
- `visSetLabel` → Bezeichnung der Gruppe
- `visWidgetLabel` → Name des Widgets in der Kachel
- `visPrev` → Vorschaubild rechts in der Kachel

**Schriftfarbe und Rahmen** der Kachel werden von VIS 2 intern berechnet – nicht änderbar!

---

## 14. Neues Widget zur Sammlung hinzufügen – Checkliste

1. **Neue Datei** `src-widgets/src/MeinWidget.jsx` erstellen
2. **`src-widgets/src/index.jsx`** ergänzen:
   ```javascript
   import MeinWidget from './MeinWidget.jsx';
   window.visWidgets.MeinWidget = MeinWidget;
   ```
3. **`src-widgets/vite.config.ts`** – exposes ergänzen:
   ```typescript
   './MeinWidget': './src/MeinWidget',
   ```
4. **`io-package.json`** – components ergänzen:
   ```json
   "components": ["FensterNormal", "AnAusSchalter", "MeinWidget"]
   ```
5. **Vorschaubild** nach `src-widgets/public/img/prev-mein-widget.png`
6. **Version** erhöhen in `io-package.json` und `package.json`
7. `bash deploy.sh`

---

## 15. Versions-Update Checkliste

Bei jeder neuen Version:
1. `io-package.json` → `"version"` erhöhen + `"news"` Eintrag
2. Root `package.json` → `"version"` erhöhen
3. `./deploy.sh` ausführen
4. `./github-push.sh "v0.x.x - Beschreibung"` pushen
5. Auf Produktivsystem: `iobroker url ...` + `iobroker add ...`

---

## 16. `index.jsx` – häufiger Fehler: Dateiinhalt zusammengeklebt

**Fehler:** Beim Kopieren/Einfügen in VS Code wurde `AnAusSchalter.jsx` direkt an `index.jsx` angehängt ohne Trennung:
```javascript
window.visWidgets.AnAusSchalter = AnAusSchalter;import React from 'react'; // ← FALSCH!
```

**Prüfen:**
```bash
wc -l src-widgets/src/index.jsx      # sollte ~8 Zeilen sein
wc -l src-widgets/src/MeinWidget.jsx # sollte viele Zeilen sein
head -3 src-widgets/src/index.jsx    # nur imports, kein JSX-Code
```

---

## 17. `iobroker file write` Einschränkungen

**Funktioniert NICHT für:**
- Dateien mit Bindestrichen im **Zielpfad** (z.B. `mf-manifest.json`)
- Gibt Fehler: `Please provide a valid file name as source file`

**Workaround:** Direkt ins Dateisystem kopieren:
```bash
cp datei.js /opt/iobroker/iobroker-data/files/vis-2/widgets/vis-2-widgets-technic/
```

---

## 18. Icon-Größe im Widget – richtige Lösung

**Funktioniert NICHT:**
- `%`-Werte für SVG-Größe bei `flex:1` Container
- `padding`-Trick (führt zu negativen Werten)

**Funktioniert:**
```jsx
// Container füllt verfügbaren Platz
<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
    // Icon mit fester px-Größe
    <svg width={iconSize} height={iconSize} viewBox={`0 0 ${w} ${h}`}
         preserveAspectRatio="xMidYMid meet" ... />
</div>
```
`iconSize` als `number`-Attribut in `visAttrs` (Einheit: px, Default: 60).

---

## 19. Widget-Absturz im VIS 2 Editor → Blackscreen

**Problem:** Widget wird in den Editor gezogen → Editor wird schwarz oder stürzt ab.

**Ursachen und Fixes:**

### A) `import React from 'react'` fehlt
Ohne diesen Import ist `React` undefined wenn JSX gerendert wird → sofortiger Absturz.
```javascript
import React from 'react';  // ← ZWINGEND oben in jeder Widget-Datei!
```

### B) `getPropertyValue()` crasht beim Laden
`this.getPropertyValue('oid_name')` funktioniert nicht zuverlässig beim ersten Render.

**Richtig:** Werte immer direkt aus `this.state.values` lesen:
```javascript
// FALSCH:
const val = this.getPropertyValue('oid_power');

// RICHTIG (wie AnAusSchalter):
const oid = this.state.rxData.oid_power;
const val = this.state.values[`${oid}.val`];
```

### C) `forceUpdate()` in `onRxDataChanged` crasht
```javascript
// FALSCH:
onRxDataChanged() { this.forceUpdate(); }

// RICHTIG:
onRxDataChanged() { this.propertiesUpdate(); }
propertiesUpdate() {}
```

### D) Falsches SVG-Render-Muster → Blackscreen
Zwei funktionierende Muster – niemals mischen:

**Muster 1: `dangerouslySetInnerHTML` (AnAusSchalter-Stil) – empfohlen für neue Widgets**
SVG-Inhalt als String bauen, kein `createRef`, kein `_drawSVG`, kein `componentDidMount`:
```jsx
renderWidgetBody(props) {
    super.renderWidgetBody(props);
    const svgContent = buildSVGString(...);
    return (
        <div style={{ width:'100%', height:'100%', display:'flex',
            alignItems:'center', justifyContent:'center' }}>
            <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}
                style={{ display:'block', flexShrink:0 }}
                dangerouslySetInnerHTML={{ __html: svgContent }}/>
        </div>
    );
}
```

**Muster 2: `svgEl()` + `createRef` (FensterNormal-Stil) – nur für komplexe DOM-Manipulation**
```jsx
constructor(props) {
    super(props);
    this.svgRef = React.createRef();
}
componentDidMount() {
    super.componentDidMount();
    this._drawSVG();
}
renderWidgetBody(props) {
    super.renderWidgetBody(props);
    setTimeout(() => this._drawSVG(), 0);
    return (
        <svg ref={this.svgRef} viewBox="0 0 200 220"
            style={{ width:'100%', height:'100%', overflow:'visible' }}
            preserveAspectRatio="xMidYMid meet"/>
    );
}
```

---

## 20. SVG-Größe: % vs. feste px

**Problem:** SVG mit `width="100%" height="100%"` → Blackscreen oder falsches Layout.

**Richtig:** Feste px-Werte auf dem SVG, Container mit flex:
```jsx
<div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:0 }}>
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}
        style={{ display:'block', flexShrink:0 }}
        dangerouslySetInnerHTML={{ __html: svgContent }}/>
</div>
```

**Container-Größe auslesen + Prozentwert-Stellrad:**
```javascript
_getSz() {
    const w     = parseInt(this.state.rxStyle?.width)  || 160;
    const h     = parseInt(this.state.rxStyle?.height) || 160;
    const scale = Math.max(10, Math.min(100, parseInt(this.state.rxData.iconScale) || 80));
    return Math.round(Math.min(w, h) * scale / 100);
}
// visAttr: { name: 'iconScale', label: 'Icon Größe (%)', type: 'number', default: 80 }
```

---

## 21. Datenpunkte lesen und schreiben – Standardmuster

```javascript
// Boolean lesen (alle Varianten abdecken!)
_isOn() {
    const oid = this.state.rxData.oid_power;
    if (!oid) return false;
    const val = this.state.values[`${oid}.val`];
    return val === true || val === 'true' || val === 1 || val === '1';
}

// Number lesen (0-100)
_getBrightness() {
    const oid = this.state.rxData.oid_dimmer;
    if (!oid) return 0;
    const val = this.state.values[`${oid}.val`];
    if (val === null || val === undefined) return 0;
    return Math.max(0, Math.min(100, Math.round(Number(val))));
}

// Schreiben – editMode IMMER prüfen!
_setValue(oid, value) {
    if (!oid || this.props.editMode) return;
    this.props.context.setValue(oid, value);
}
```

---

## 22. Lokaler State für Live-Feedback (Drag/Slider)

```javascript
constructor(props) {
    super(props);
    this.state = { ...this.state, dragPct: null };  // this.state ERWEITERN!
}

_getBrightness() {
    if (this.state.dragPct !== null) return this.state.dragPct;  // Drag-Wert zuerst
    const oid = this.state.rxData.oid_dimmer;
    if (!oid) return 0;
    return Math.max(0, Math.min(100, Math.round(Number(this.state.values[`${oid}.val`]) || 0)));
}

_setDimmer(value) {
    if (this.props.editMode) return;
    const v = Math.max(0, Math.min(100, Math.round(value)));
    this.setState({ dragPct: v });           // sofortiges visuelles Feedback
    this.props.context.setValue(oid, v);
}

_onMouseUp() {
    this._dragging = false;
    this.setState({ dragPct: null });        // zurück auf echten DP-Wert
}
```

---

## 23. Layout-Muster: Name oben/unten + Icon (einheitlich wie AnAusSchalter)

```javascript
// visAttrs (Standard-Set für alle Widgets):
{ name: 'name',         label: 'Name',              type: 'text',     default: 'Gerät' },
{ name: 'showName',     label: 'Name anzeigen',     type: 'checkbox', default: true },
{ name: 'nameColor',    label: 'Name Farbe',        type: 'color',    default: '#c8e6e3' },
{ name: 'nameFontSize', label: 'Name Schriftgröße', type: 'number',   default: 12 },
{ name: 'nameBold',     label: 'Name Fett',         type: 'checkbox', default: false },
{ name: 'namePosition', label: 'Name Position',     type: 'select',
  options: [{ value:'top', label:'Oben' }, { value:'bottom', label:'Unten' }],
  default: 'bottom' },
{ name: 'iconSize',     label: 'Icon Größe (px)',   type: 'number',   default: 60 },
```

```jsx
// renderWidgetBody Grundgerüst:
const nameEl = showName && name ? (
    <div style={{ color:nameColor, fontSize:`${nameFontSize}px`, fontWeight:nameBold?700:400,
        textAlign:'center', width:'100%', overflow:'hidden',
        textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0 }}>
        {name}
    </div>
) : null;

return (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', gap:4,
        cursor: this.props.editMode ? 'default' : 'pointer',
        userSelect:'none', boxSizing:'border-box', padding:4 }}>
        {namePosition === 'top' && nameEl}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:0 }}>
            <svg width={sz} height={sz} ... />
        </div>
        {(namePosition === 'bottom' || !namePosition) && nameEl}
    </div>
);
```

---

## 24. `io-package.json` news – nur EIN Block erlaubt!

**Fehler:** `sed -i` fügt einen zweiten `news`-Block ein → ungültiges JSON.

**Fix:** Immer manuell mit `nano` editieren, `0.x.x` in den bestehenden Block einfügen:
```json
"news": {
    "0.1.3": { "en": "...", "de": "..." },
    "0.1.2": { "en": "...", "de": "..." },
    "0.1.1": { "en": "...", "de": "..." }
}
```
→ **Niemals `sed` für `news`-Updates verwenden!**

---

## 25. Vorschaubild mit pycairo generieren (transparent, kein Hintergrund)

```bash
pip install pycairo --break-system-packages

python3 << 'EOF'
import cairo, math

W, H = 680, 390
surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
ctx = cairo.Context(surface)
ctx.set_source_rgba(0, 0, 0, 0)  # Transparent – KEIN Hintergrund!
ctx.paint()

# Adapter-Farben (immer diese verwenden für Konsistenz):
colorOn  = (0x2e/255, 0xcf/255, 0xbf/255)  # #2ecfbf
colorOff = (0x5f/255, 0x8f/255, 0x8a/255)  # #5f8f8a
colorBg  = (0x0d/255, 0x18/255, 0x20/255)  # #0d1820

# Zeichencode mit gleicher Mathematik wie das Widget selbst...

surface.write_to_png('src-widgets/public/img/prev-mein-widget.png')
EOF
```

**Wichtig:** Gleiche Berechnungen wie im Widget verwenden (cx, cy, R, btnR usw.) damit Vorschau und Widget identisch aussehen!

---

## 26. Standard-Farben des Adapters

Für einheitliches Aussehen aller Widgets immer diese Defaults verwenden:

```javascript
// In getWidgetInfo() visAttrs:
{ name: 'colorAN',    label: 'Farbe AN',    type: 'color', default: '#2ecfbf' },
{ name: 'colorAUS',   label: 'Farbe AUS',   type: 'color', default: '#5f8f8a' },
{ name: 'colorBg',    label: 'Hintergrund', type: 'color', default: '#0d1820' },
{ name: 'nameColor',  label: 'Schriftfarbe',type: 'color', default: '#c8e6e3' },

// In getWidgetInfo() Metadaten:
visSetColor:    '#2ecfbf',  // Gruppenfarbe
visWidgetColor: '#0d1820',  // Kachel-Hintergrundfarbe im Editor
```

---

## 27. `indexFrom`/`indexTo`-Gruppen: reale Feldnamens-Konvention ist Suffix, kein Präfix

**Fehler-Annahme:** Bei einer indizierten Feldgruppe (`indexFrom: 1, indexTo: 'rowCount'`) könnte man
vermuten, dass die generierten Feldnamen ein Präfix-Muster wie `row{i}_oid` bekommen.

**Richtig:** vis2 hängt den Index als **Suffix an den Basisnamen** an – Basisname bleibt vorne:

```javascript
// Definition:
{
    name: 'row',
    indexFrom: 1,
    indexTo: 'rowCount',
    fields: [
        { name: 'rowLabel', ... },
        { name: 'oid', ... },
        { name: 'valueType', ... },
    ],
},

// Tatsächliche Feldnamen in rxData: oid1, oid2, ..., rowLabel1, valueType1, ...
const oid = this.state.rxData[`oid${i}`];
const rowLabel = this.state.rxData[`rowLabel${i}`];
```

Kein `row{i}_oid`- oder `row_${i}_oid`-Muster möglich – immer `<feldname><index>`.

---

## 28. Freitextfelder mit oids werden NICHT automatisch subscribed

**Problem:** Nur Felder vom `type: 'id'` werden von der Basisklasse (`window.visRxWidget`) automatisch
abonniert und landen in `this.state.values`. Ein Freitextfeld (`type: 'text'`), das kommagetrennt
mehrere oids enthält (z.B. `oidsExtra` für UND/ODER-Verknüpfung), wird von vis2 **ignoriert** – die
referenzierten Werte bleiben `undefined`, ohne Fehlermeldung.

**Fix:** Eigene Subscription über `this.props.context.socket.subscribeState()`/`unsubscribeState()`,
mit Diff-Abgleich (nur tatsächlich neue/entfallene oids an-/abmelden) statt bei jedem Update alles neu
zu subscriben:

```javascript
constructor(props) {
    super(props);
    this.state = { ...this.state, extraValues: {} };
    this._extraSubscribed = [];
    this._onExtraStateChange = this._onExtraStateChange.bind(this);
}

_onExtraStateChange(id, state) {
    this.setState({ extraValues: { ...this.state.extraValues, [id]: state ? state.val : null } });
}

_syncExtraSubscriptions() {
    const wanted = this._getExtraOids();   // aus allen Freitextfeldern eingesammelt
    const toRemove = this._extraSubscribed.filter(o => !wanted.includes(o));
    const toAdd = wanted.filter(o => !this._extraSubscribed.includes(o));
    if (toRemove.length) this.props.context.socket.unsubscribeState(toRemove, this._onExtraStateChange);
    if (toAdd.length) this.props.context.socket.subscribeState(toAdd, this._onExtraStateChange);
    this._extraSubscribed = wanted;
}

componentDidMount() { super.componentDidMount(); this._syncExtraSubscriptions(); }
componentWillUnmount() {
    if (this._extraSubscribed.length) {
        this.props.context.socket.unsubscribeState(this._extraSubscribed, this._onExtraStateChange);
    }
    super.componentWillUnmount();
}
propertiesUpdate() { this._syncExtraSubscriptions(); }   // bei jeder Config-Änderung neu abgleichen
```

**Wichtig:** Sauberes Unsubscribe in `componentWillUnmount()` nicht vergessen – sonst Memory-Leak /
Zombie-Listener beim Verlassen der View.

---

## 29. View-Wechsel per Klick: `context.changeView()`

**Richtig (offizielles vis2-Muster, auch in eingebauten Widgets wie Navigations-Menu/Swipe-Widget
verwendet):**

```javascript
this.props.context.changeView(targetView /*, subView? */);
```

Kein manuelles Ändern von URL-Hash/Location nötig – das ist die reguläre, von vis2 selbst genutzte API
für Klick-basierte View-Wechsel.

---

## 30. Reale Größe/Settings einer beliebigen View zur Laufzeit

`this.props.context.views` enthält bereits **das komplette Projekt inkl. aller Views** (nicht nur die
aktive) – kein zusätzlicher Request nötig, um z.B. die konfigurierte Größe einer Ziel-View zu kennen:

```javascript
const targetSettings = this.props.context.views?.[targetView]?.settings;
const viewSizeX = parseInt(targetSettings?.sizex, 10);
const viewSizeY = parseInt(targetSettings?.sizey, 10);
const hasFixedViewSize = !!targetSettings?.limitScreen
    && !Number.isNaN(viewSizeX) && viewSizeX > 0
    && !Number.isNaN(viewSizeY) && viewSizeY > 0;
```

Gleiches Zugriffsmuster wie im offiziellen vis2-Navigations-Menu-Widget. Nützlich z.B. um ein
Popup-iframe exakt auf die tatsächlich konfigurierte View-Größe zu bringen statt es zu strecken.

---

## 31. Leere Flex-Zeilen kollabieren auf 0px ohne explizites `minHeight`

**Fehler:** Eine Zeile mit `display:flex, flexDirection:row, alignItems:'baseline'`, deren Kind-Elemente
(Label/Wert) beide leeren Textinhalt haben (z.B. Platzhalterzeile ohne zugewiesenen Datenpunkt), hat
**keinen Inhalt und damit keine Baseline-Referenz** – der Browser rendert die Zeile mit `height: 0px`,
obwohl sie im DOM vorhanden ist (`display: flex`, `visibility: visible`). Optisch sieht das aus, als würde
die Zeile komplett fehlen bzw. als würden mehrere Zeilen ohne Abstand zusammenrücken.

**Verifikation:** Nicht per Code-Review erkennbar – erst durch tatsächliches Rendern (z.B. Playwright
gegen die echte `_renderRows()`-Ausgabe) sichtbar: befüllte Zeile `height: 16px`, leere Zeile `height: 0px`.

**Fix:** Festes `minHeight` auf den Zeilen-Container setzen, von `rowFontSize` abgeleitet:
```javascript
style={{
    display: 'flex', flexDirection: 'row', alignItems: 'baseline',
    minHeight: `${Math.round(rowFontSize * 1.3)}px`,   // ← verhindert 0px-Kollaps bei leerem Inhalt
}}
```

---

## 32. npm Trusted Publisher (OIDC) + `id-token: write` → sonst IMMER 404 bei `npm publish`

**Fehler-Annahme:** `id-token: write` + `--provenance` + gültiger `NODE_AUTH_TOKEN` reicht für
`npm publish` in GitHub Actions.

**Tatsächliches Verhalten:** Sobald `id-token: write` gesetzt ist (Pflicht für `--provenance`), versucht
npm **automatisch** einen OIDC-"Trusted Publishing"-Login-Exchange – unabhängig davon, ob man das will.
Ist kein Trusted Publisher für das Paket konfiguriert, schlägt dieser Exchange fehl, und der Rückfall auf
den regulären `NODE_AUTH_TOKEN` funktioniert **nicht zuverlässig** – Ergebnis ist ein irreführendes
```
npm error code E404
npm error 404 Not Found - PUT https://registry.npmjs.org/<paket> - Not found
```
obwohl das Paket existiert und der Token gültig ist. **Nicht npm-CLI-versionsabhängig** – in der Praxis
verifiziert: sowohl npm 11.13.0 als auch 11.19.0 betroffen, ein Versions-Pin behebt es nicht.

**Fix (Pflicht, sobald `id-token: write` im Workflow gesetzt ist):**
npmjs.com → Paket → **Settings** → **Trusted Publisher** → GitHub Actions hinzufügen:
- Organization/User + Repository exakt wie auf GitHub
- Workflow-Dateiname exakt (`test-and-release.yml`)
- Environment leer lassen, falls der Job kein `environment:` setzt
- **"Allow npm publish" muss explizit angehakt werden**

Betrifft jedes Repo mit demselben Workflow-Aufbau (Provenance + `id-token: write`) – vorsorglich für alle
prüfen, nicht erst wenn der nächste Release-Tag scheitert.

---

## 33. Namenskonvention für neue Widgets: englischer Klassenname + i18n-Label

Ab dem Widget "ClockDate" gilt für alle NEUEN Widgets:

- **Datei-/Klassenname:** Englisch, kurz und beschreibend, z.B. `ClockDate`. Bestehende deutsche Namen (`FensterWand`, `SchalterBoolean`, `RaumKachel` usw.) bleiben unverändert — nur neue Widgets folgen der neuen Konvention.
- **Widget-ID** (`id` in `getWidgetInfo()`): `tplTechnic<Klassenname>`, z.B. `tplTechnicClockDate`.
- **Anzeigename im Editor** (`visName`): Format ist immer `"<Kategorie> - <Typ>"` (Bindestrich mit Leerzeichen davor/danach), passend zu den bestehenden Widgets: `Window - Wall`, `Switch - Boolean`, `Dimmer - Light`, `Room - Overlay`, `Clock - Date`. Kein `&`, kein reiner Freitext.
- **Alle `label`-Werte in `visAttrs`** sind Übersetzungs-Keys (keine literalen deutschen Texte) — die Übersetzung liegt in `src-widgets/src/i18n/<lang>.json`, für jede unterstützte Sprache (aktuell: en, de, ru, pt, nl, fr, it, es, pl, uk, zh-cn).
- Generische Keys (`align`, `color`, `padding`, `bold`, `fontSize`, `borderRadius`, `gap`, `colorBg`, `align_left`/`align_center`/`align_right` usw.) werden zwischen Widgets wiederverwendet statt dupliziert — vor dem Anlegen neuer Keys immer erst `src-widgets/src/i18n/de.json` (oder `en.json`) nach dem gewünschten Begriff durchsuchen.
- Ein Widget gilt erst als fertig, wenn Code UND Übersetzungs-Keys für alle Sprachen vorhanden sind.

**Wichtig — `"i18n"` im `visWidgets`-Block IMMER auf `"component"` lassen, NIEMALS auf `true` ändern:**
`true` wurde in v0.1.16 bewusst durch `"component"` ersetzt (bestätigt durch den v0.1.18-Changelog
"fix i18n translations (component mode)") — der `true`-Modus lud die Übersetzungen für dieses Widget-Set
nicht zuverlässig. Ein Rückbau zu `true` (z.B. weil eine Anleitung das pauschal verlangt) riskiert stillschweigend
die Übersetzungen für **alle** Widgets der Sammlung, nicht nur das neue. Bei widersprüchlichen Anweisungen: nachfragen
statt den dokumentierten Fix rückgängig zu machen.

---

## 34. Versionsdisziplin während lokaler Entwicklung — NICHT pro Zwischenschritt bumpen

Solange ein Widget noch aktiv iteriert wird und alles lokal bleibt (kein Push/Tag/Release):

- **NICHT** bei jedem Zwischenschritt/Commit die Version in package.json/io-package.json erhöhen. Versionssprünge ohne zugehörigen README-Changelog-Eintrag sind gefährlich, falls versehentlich doch released wird.
- Version wird **genau einmal** erhöht — erst wenn das Widget als fertig gilt (Sign-off durch David).
- Bei diesem einen Bump IMMER gleichzeitig:
  1. Ein neuer Eintrag im io-package.json `"news"`-Block (wie bisher, manuell, kein sed — siehe Punkt 24)
  2. Ein passender Eintrag im `## Changelog`-Abschnitt von README.md (siehe DEV-README.md Pflichtstruktur) — beide müssen synchron sein, niemals nur einer von beiden.
- Zwischenstände während der Entwicklung laufen ohne Versionsbump über `./deploy.sh` (Version bleibt stehen, nur Code/Assets werden aktualisiert und lokal getestet).

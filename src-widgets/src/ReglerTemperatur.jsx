import React from 'react';
import { createPortal } from 'react-dom';
import { I18n } from '@iobroker/adapter-react-v5';
import translations from './translations.js';

I18n.extendTranslations(translations);

// ═══════════════════════════════════════════════════════
//  DIAL GEOMETRY
//  300° Bogen, 60° Lücke unten-mitte (analog ReglerLicht,
//  dort 270°/90° Lücke – gleiche Formel, schmalere Lücke)
// ═══════════════════════════════════════════════════════
const DIAL_START = 120;
const DIAL_TOTAL = 300;

function describeArc(cx, cy, r, startDeg, endDeg) {
    const toRad = d => d * Math.PI / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = (endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`;
}

// ── Aktor-Icons: Flamme (Heizen) / Schneeflocke (Kühlen) / Kreis (Aus) ────
// Kein Vorentwurf im Git-Verlauf gefunden (geprüft) – neu gezeichnet.
function buildOffDot(cx, cy, size, color) {
    const r  = size * 0.28;
    const sw = Math.max(1.4, size * 0.09);
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(1)}"/>`;
}

function buildFlameIcon(cx, cy, size, color) {
    const s  = size / 100;
    const ox = cx - size / 2;
    const oy = cy - size / 2;
    return `<g transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${s.toFixed(4)})">
        <path d="M50 4 C32 22 21 42 21 60 C21 81 34 96 50 96 C66 96 79 81 79 60
            C79 47 70 36 63 26 C64 43 54 49 49 41 C55 29 50 14 50 4 Z" fill="${color}"/>
    </g>`;
}

function buildSnowIcon(cx, cy, size, color) {
    const r  = size / 2;
    const sw = Math.max(1.2, size * 0.09);
    const branchLen = r * 0.35;
    let out = '';
    for (let i = 0; i < 3; i++) {
        const rad = i * 60 * Math.PI / 180;
        const dx = Math.cos(rad) * r, dy = Math.sin(rad) * r;
        out += `<line x1="${(cx - dx).toFixed(1)}" y1="${(cy - dy).toFixed(1)}" x2="${(cx + dx).toFixed(1)}" y2="${(cy + dy).toFixed(1)}" stroke="${color}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round"/>`;
        [0.6, -0.6].forEach(t => {
            const bx = cx + dx * t, by = cy + dy * t;
            const bRad1 = rad + Math.PI / 4, bRad2 = rad - Math.PI / 4;
            out += `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${(bx + Math.cos(bRad1) * branchLen).toFixed(1)}" y2="${(by + Math.sin(bRad1) * branchLen).toFixed(1)}" stroke="${color}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round"/>`;
            out += `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${(bx + Math.cos(bRad2) * branchLen).toFixed(1)}" y2="${(by + Math.sin(bRad2) * branchLen).toFixed(1)}" stroke="${color}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round"/>`;
        });
    }
    return `<g>${out}</g>`;
}

function buildDialSVG(sz, tempSoll, tempIst, humidity, motor, min, max, colorAN, colorAUS, colorKuehlen, cooling) {
    const cx = sz / 2, cy = sz / 2;
    const R  = sz * 0.43;
    const sw = Math.max(3, sz * 0.055);
    const knobR = Math.max(5, sz * 0.06);

    const pct = max > min ? Math.max(0, Math.min(1, (tempSoll - min) / (max - min))) : 0;
    const kDeg = DIAL_START + DIAL_TOTAL * pct;
    const kRad = kDeg * Math.PI / 180;
    const kx = cx + R * Math.cos(kRad);
    const ky = cy + R * Math.sin(kRad);

    const fillPath = pct > 0
        ? `<path d="${describeArc(cx, cy, R, DIAL_START, DIAL_START + DIAL_TOTAL * pct)}" fill="none" stroke="${colorAN}" stroke-width="${sw}" stroke-linecap="round"/>`
        : '';

    // Zentrums-Layout, drei Zeilen übereinander:
    //   1. Soll-Temperatur (groß, höher gerückt)
    //   2. Ist-Temperatur [+ Feuchtigkeit] (mittig, Schriftgröße hängt davon ab
    //      ob beide Werte sich die Zeile teilen)
    //   3. Aktor-Icon [+ %-Wert] – deutlich unterhalb Zeile 2, nicht mehr auf
    //      gleicher Höhe wie die Ist-Temperatur
    const sollSize = Math.max(15, sz * 0.20);
    const sollY = cy - sollSize * 0.08;

    const hasHumidity = humidity !== null;
    const subSize = hasHumidity ? Math.max(9, sz * 0.075) : Math.max(12, sz * 0.11);
    const subY = sollY + sollSize * 0.78;

    const sollText = `<text x="${cx}" y="${sollY.toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="${sollSize.toFixed(1)}" font-weight="700" fill="${colorAN}">${tempSoll.toFixed(1)}°</text>`;

    let subContent = '';
    if (tempIst !== null && hasHumidity) {
        subContent = `${tempIst.toFixed(1)}° · ${humidity}%`;
    } else if (tempIst !== null) {
        subContent = `${tempIst.toFixed(1)}°`;
    } else if (hasHumidity) {
        subContent = `${humidity}%`;
    }
    const subText = subContent
        ? `<text x="${cx}" y="${subY.toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="${subSize.toFixed(1)}" fill="${colorAUS}">${subContent}</text>`
        : '';

    const iconSize = sz * 0.15;
    const iconY = subY + subSize * 0.95 + iconSize * 0.42;

    let motorEl = '';
    if (motor) {
        if (motor.type === 'bool') {
            if (!motor.value) {
                motorEl = buildOffDot(cx, iconY, iconSize, colorAUS);
            } else if (cooling) {
                motorEl = buildSnowIcon(cx, iconY, iconSize, colorKuehlen);
            } else {
                motorEl = buildFlameIcon(cx, iconY, iconSize, colorAN);
            }
        } else {
            // 0-100%: passendes Icon davor (Flamme/Schneeflocke), kein Icon bei 0%
            const pctIconSize = iconSize * 0.8;
            const pctTextY = iconY + pctIconSize * 0.12;
            if (motor.value > 0) {
                const iconCx = cx - pctIconSize * 0.9;
                const iconSvg = cooling
                    ? buildSnowIcon(iconCx, iconY, pctIconSize, colorKuehlen)
                    : buildFlameIcon(iconCx, iconY, pctIconSize, colorAN);
                motorEl = `${iconSvg}<text x="${(cx - pctIconSize * 0.15).toFixed(1)}" y="${pctTextY.toFixed(1)}" text-anchor="start" font-family="sans-serif" font-size="${subSize.toFixed(1)}" fill="${colorAUS}">${motor.value}%</text>`;
            } else {
                motorEl = `<text x="${cx.toFixed(1)}" y="${pctTextY.toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="${subSize.toFixed(1)}" fill="${colorAUS}">0%</text>`;
            }
        }
    }

    return `
        <path d="${describeArc(cx, cy, R, DIAL_START, DIAL_START + DIAL_TOTAL)}"
            fill="none" stroke="${colorAUS}" stroke-width="${sw}" stroke-linecap="round" opacity="0.45"/>
        ${fillPath}
        <circle cx="${kx.toFixed(2)}" cy="${ky.toFixed(2)}" r="${knobR}" fill="transparent" stroke="${colorAN}" stroke-width="2.4"/>
        ${sollText}
        ${subText}
        ${motorEl}
    `;
}

// Liefert eine gut lesbare Icon-Farbe (dunkel oder hell) für einen gegebenen
// Hintergrund-Hex-Wert, damit der Lupe-Button unabhängig vom gewählten colorAN
// immer klaren Kontrast hat (nicht nur bei den Standardfarben).
function pickIconContrastColor(hex) {
    const h = (hex || '').replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    if (full.length !== 6) return '#ffffff';
    const r = parseInt(full.substring(0, 2), 16);
    const g = parseInt(full.substring(2, 4), 16);
    const b = parseInt(full.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#0d1820' : '#ffffff';
}

// ═══════════════════════════════════════════════════════
//  VERLAUFS-CHART (S2b) – handgezeichnetes SVG, kein Chart-Framework
// ═══════════════════════════════════════════════════════
function historyToBool(v) {
    return v === true || v === 'true' || v === 1 || v === '1';
}

// Reduziert clientseitig auf max. `max` Punkte (Fallback falls die Server-Antwort
// trotz count/step-Vorgabe mehr liefert) – erster/letzter Punkt bleiben erhalten,
// damit der Linienverlauf an den Fensterrändern nicht abgeschnitten wirkt.
function capHistoryPoints(points, max) {
    if (points.length <= max) return points;
    const result = [];
    const stepIdx = (points.length - 1) / (max - 1);
    for (let i = 0; i < max; i++) result.push(points[Math.round(i * stepIdx)]);
    return result;
}

// onchange-Punkte (Zeitpunkt + boolean) → An-Zeiträume als [t0,t1]-Paare.
// Vor dem ersten bekannten Punkt ist der Zustand unbekannt und wird nicht
// gezeichnet; der letzte bekannte Zustand wird bis `end` verlängert.
function buildBoolSegments(raw, start, end) {
    const pts = (raw || [])
        .filter(p => p && p.val !== null && p.val !== undefined)
        .map(p => ({ t: p.ts, v: historyToBool(p.val) }))
        .sort((a, b) => a.t - b.t);
    const segs = [];
    for (let i = 0; i < pts.length; i++) {
        if (!pts[i].v) continue;
        const t0 = Math.max(pts[i].t, start);
        const t1 = Math.min(i + 1 < pts.length ? pts[i + 1].t : end, end);
        if (t1 > t0) segs.push({ t0, t1 });
    }
    return segs;
}

function formatHistoryTick(ts, rangeKey) {
    const d = new Date(ts);
    return rangeKey === '7d'
        ? d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })
        : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function buildHistorySVG(vbW, vbH, data, colorAN, colorAUS, colorKuehlen, colorLine, colorLineIst, cooling, rangeKey) {
    const marginL = 36, marginR = 10, marginT = 10, marginB = 20;
    const plotW = vbW - marginL - marginR;
    const plotH = vbH - marginT - marginB;
    const { soll, ist, motor, start, end } = data;

    // Y-Skala muss Soll UND Ist gemeinsam abdecken, sonst kann die Ist-Linie
    // oben/unten abgeschnitten werden.
    const allTempValues = ist?.length ? soll.map(p => p.v).concat(ist.map(p => p.v)) : soll.map(p => p.v);
    let yMin = Math.min(...allTempValues);
    let yMax = Math.max(...allTempValues);
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    const pad = (yMax - yMin) * 0.15;
    yMin -= pad; yMax += pad;

    const xScale = t => marginL + ((t - start) / (end - start || 1)) * plotW;
    const yScale = v => marginT + (1 - (v - yMin) / (yMax - yMin)) * plotH;
    const baseline = marginT + plotH;

    // Hintergrund: Stellmotor-Aktivität (falls oid_stellmotor gesetzt)
    let motorSvg = '';
    const motorColor = cooling ? colorKuehlen : colorAN;
    if (motor?.type === 'bool' && motor.points?.length) {
        motorSvg = buildBoolSegments(motor.points, start, end).map(s => {
            const x1 = xScale(s.t0), x2 = xScale(s.t1);
            return `<rect x="${x1.toFixed(1)}" y="${marginT}" width="${Math.max(0.5, x2 - x1).toFixed(1)}" height="${plotH.toFixed(1)}" fill="${motorColor}" opacity="0.18"/>`;
        }).join('');
    } else if (motor?.type === 'num' && motor.points?.length) {
        const pts = motor.points
            .filter(p => p && p.val !== null && p.val !== undefined)
            .map(p => ({ t: p.ts, v: Math.max(0, Math.min(100, Number(p.val))) }))
            .sort((a, b) => a.t - b.t);
        if (pts.length) {
            const yMotor = v => marginT + (1 - v / 100) * plotH;
            let d = `M ${xScale(pts[0].t).toFixed(1)} ${baseline.toFixed(1)} `;
            d += pts.map(p => `L ${xScale(p.t).toFixed(1)} ${yMotor(p.v).toFixed(1)}`).join(' ');
            d += ` L ${xScale(pts[pts.length - 1].t).toFixed(1)} ${baseline.toFixed(1)} Z`;
            motorSvg = `<path d="${d}" fill="${motorColor}" opacity="0.18" stroke="none"/>`;
        }
    }

    // Y-Achse: Temperaturskala + horizontale Hilfslinien
    let yAxisSvg = '';
    const yTickCount = 4;
    for (let i = 0; i <= yTickCount; i++) {
        const v = yMin + (yMax - yMin) * (i / yTickCount);
        const y = yScale(v);
        yAxisSvg += `<line x1="${marginL}" y1="${y.toFixed(1)}" x2="${(marginL + plotW).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${colorAUS}" stroke-width="0.5" opacity="0.22"/>`;
        yAxisSvg += `<text x="${(marginL - 5).toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-family="sans-serif" font-size="9" fill="${colorAUS}">${v.toFixed(1)}°</text>`;
    }

    // X-Achse: Zeit – bei 24h alle ~4h ein Label, bei 7 Tage eins pro Tag
    let xAxisSvg = '';
    const xTickCount = rangeKey === '7d' ? 7 : 6;
    for (let i = 0; i <= xTickCount; i++) {
        const t = start + (end - start) * (i / xTickCount);
        const x = xScale(t);
        xAxisSvg += `<text x="${x.toFixed(1)}" y="${(baseline + 13).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="9" fill="${colorAUS}">${formatHistoryTick(t, rangeKey)}</text>`;
    }

    // Soll-Temperatur-Linie - eigene Farbe statt colorAN, sonst kaum von den
    // Stellmotor-Hintergrundstreifen (die auch colorAN nutzen) zu unterscheiden.
    const linePath = soll.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.t).toFixed(1)} ${yScale(p.v).toFixed(1)}`).join(' ');
    const lineSvg = `<path d="${linePath}" fill="none" stroke="${colorLine}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;

    // Ist-Temperatur-Linie (optional, nur wenn oid_temp_ist gesetzt). Eigenes
    // festes Farbfeld statt colorAUS: colorAUS ist eine frei wählbare Dial-Farbe,
    // die Nutzer oft bewusst hell einstellen - das kollidierte mit der ebenfalls
    // hellen Soll-Linie (siehe Fix-Notiz in der Commit-Historie).
    let istLineSvg = '';
    if (ist?.length) {
        const istPath = ist.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.t).toFixed(1)} ${yScale(p.v).toFixed(1)}`).join(' ');
        istLineSvg = `<path d="${istPath}" fill="none" stroke="${colorLineIst}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    }

    return `${yAxisSvg}${motorSvg}${lineSvg}${istLineSvg}${xAxisSvg}`;
}

function rangeButtonStyle(active, color) {
    return {
        padding: '3px 10px',
        fontSize: 12,
        borderRadius: 4,
        cursor: 'pointer',
        border: `1px solid ${color}`,
        background: active ? color : 'transparent',
        color: active ? '#0d1820' : color,
    };
}

// ═══════════════════════════════════════════════════════
//  WIDGET KLASSE
// ═══════════════════════════════════════════════════════
class ReglerTemperatur extends window.visRxWidget {

    static getWidgetInfo() {
        return {
            id: 'tplTechnicReglerTemperatur',
            visSet:          'vis-2-widgets-technic',
            visSetLabel:     'Technic Widgets',
            visSetColor:     '#2ecfbf',
            visWidgetColor:  '#0d1820',
            visName:         'Regler - Temperatur',
            visWidgetLabel:  'Regler - Temperatur',
            visPrev:         'widgets/vis-2-widgets-technic/img/prev-regler-temperatur.png',
            visDefaultStyle: { width: 220, height: 220 },
            vis2: true,
            visAttrs: [
                {
                    name: 'common',
                    label: 'general',
                    fields: [
                        { name: 'ueberschrift', label: 'heading', type: 'text', default: 'Temperatur' },
                        { name: 'showName', label: 'show_heading', type: 'checkbox', default: true },
                        {
                            name: 'namePosition', label: 'heading_position', type: 'select',
                            options: [
                                { value: 'top',    label: 'pos_top' },
                                { value: 'bottom', label: 'pos_bottom' },
                            ],
                            default: 'bottom',
                        },
                        { name: 'iconScale', label: 'icon_size_pct', type: 'number', default: 80 },
                    ],
                },
                {
                    name: 'ids',
                    label: 'data_points',
                    fields: [
                        { name: 'oid_temp_soll', label: 'oid_temp_soll', type: 'id' },
                        { name: 'oid_temp_ist', label: 'oid_temp_ist', type: 'id' },
                        { name: 'oid_feuchtigkeit', label: 'oid_feuchtigkeit', type: 'id' },
                        { name: 'oid_stellmotor', label: 'oid_stellmotor', type: 'id' },
                        { name: 'oid_kuehlmodus', label: 'oid_kuehlmodus', type: 'id' },
                    ],
                },
                {
                    name: 'dial',
                    label: 'dial_group',
                    fields: [
                        { name: 'tempMin', label: 'temp_min', type: 'number', default: 15 },
                        { name: 'tempMax', label: 'temp_max', type: 'number', default: 28 },
                        { name: 'tempStep', label: 'temp_step', type: 'number', default: 0.5 },
                    ],
                },
                {
                    name: 'colors',
                    label: 'colors_group',
                    fields: [
                        { name: 'colorAN', label: 'color_on', type: 'color', default: '#2ecfbf' },
                        { name: 'colorAUS', label: 'color_off', type: 'color', default: '#5f8f8a' },
                        { name: 'colorKuehlen', label: 'color_cooling', type: 'color', default: '#4aa8ff' },
                    ],
                },
                {
                    name: 'history',
                    label: 'history_group',
                    fields: [
                        { name: 'influxInstance', label: 'influx_instance', type: 'text', default: 'influxdb.0' },
                        { name: 'colorVerlaufSoll', label: 'history_line_color', type: 'color', default: '#ffffff' },
                        { name: 'colorVerlaufIst', label: 'history_line_color_ist', type: 'color', default: '#ffb347' },
                    ],
                },
            ],
        };
    }

    getWidgetInfo() { return ReglerTemperatur.getWidgetInfo(); }

    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dragTemp: null,
            historyOpen: false,
            historyRange: '24h',
            historyData: null,
            historyLoading: false,
            historyError: null,
        };
        this._svgRef = React.createRef();
        this._rootRef = React.createRef();
        this._mounted = false;
        // Wird bei jedem neuen Abruf hochgezählt – ein noch laufender älterer
        // Abruf (z.B. durch schnellen Zeitraum-Wechsel oder Schließen+Neuöffnen
        // überholt) erkennt daran, dass sein Ergebnis veraltet ist, und darf dann
        // keinen State mehr setzen.
        this._historyFetchToken = 0;

        // Fensterweite Resize/Scroll-Events ändern nicht rxStyle und lösen daher
        // keinen normalen Re-Render aus - der per Portal aus dem geclippten
        // Widget-Container ausgelagerte Lupe-Button muss seine Position (aus
        // getBoundingClientRect() des Widget-Roots) trotzdem nachziehen.
        // rAF-Throttle, damit Scroll-Storms nicht bei jedem Event ein forceUpdate
        // auslösen.
        this._reflowScheduled = false;
        this._onWindowReflow = () => {
            if (this._reflowScheduled) return;
            this._reflowScheduled = true;
            requestAnimationFrame(() => {
                this._reflowScheduled = false;
                this.forceUpdate();
            });
        };
    }

    componentDidMount() {
        super.componentDidMount();
        this._mounted = true;
        window.addEventListener('resize', this._onWindowReflow);
        window.addEventListener('scroll', this._onWindowReflow, true);
        // Beim ersten Mount ist this._rootRef.current erst nach dem Commit gesetzt -
        // ein Nachschlag sorgt dafür, dass der Lupe-Button sofort (statt erst beim
        // nächsten Datenupdate) korrekt positioniert erscheint.
        this.forceUpdate();
    }

    componentWillUnmount() {
        this._mounted = false;
        window.removeEventListener('resize', this._onWindowReflow);
        window.removeEventListener('scroll', this._onWindowReflow, true);
        super.componentWillUnmount();
    }

    propertiesUpdate() {}
    onRxDataChanged()  { this.propertiesUpdate(); }
    onRxStyleChanged() {}
    onStateUpdated()   {}

    // ── Min/Max/Step ──────────────────────────────────
    _getRange() {
        const { tempMin, tempMax, tempStep } = this.state.rxData;
        let min = Number(tempMin); if (Number.isNaN(min)) min = 15;
        let max = Number(tempMax); if (Number.isNaN(max)) max = 28;
        let step = Number(tempStep); if (Number.isNaN(step) || step <= 0) step = 0.5;
        if (max <= min) max = min + step;
        return { min, max, step };
    }

    // ── Werte lesen ───────────────────────────────────
    _getTempSoll() {
        if (this.state.dragTemp !== null) return this.state.dragTemp;
        const { min, max } = this._getRange();
        const oid = this.state.rxData.oid_temp_soll;
        if (!oid) return min;
        const raw = this.state.values[`${oid}.val`];
        const n = Number(raw);
        if (raw === null || raw === undefined || Number.isNaN(n)) return min;
        return Math.max(min, Math.min(max, n));
    }

    _getTempIst() {
        const oid = this.state.rxData.oid_temp_ist;
        if (!oid) return null;
        const raw = this.state.values[`${oid}.val`];
        if (raw === null || raw === undefined) return null;
        const n = Number(raw);
        return Number.isNaN(n) ? null : n;
    }

    _getFeuchtigkeit() {
        const oid = this.state.rxData.oid_feuchtigkeit;
        if (!oid) return null;
        const raw = this.state.values[`${oid}.val`];
        if (raw === null || raw === undefined) return null;
        const n = Number(raw);
        return Number.isNaN(n) ? null : Math.max(0, Math.min(100, Math.round(n)));
    }

    // Typ-Erkennung zur Laufzeit über typeof – boolean → AN/AUS, number → 0-100%
    _getStellmotor() {
        const oid = this.state.rxData.oid_stellmotor;
        if (!oid) return null;
        const raw = this.state.values[`${oid}.val`];
        if (raw === null || raw === undefined) return null;
        if (typeof raw === 'boolean') return { type: 'bool', value: raw };
        if (typeof raw === 'number') return { type: 'num', value: Math.max(0, Math.min(100, Math.round(raw))) };
        if (raw === 'true' || raw === 'false') return { type: 'bool', value: raw === 'true' };
        const n = Number(raw);
        if (!Number.isNaN(n)) return { type: 'num', value: Math.max(0, Math.min(100, Math.round(n))) };
        return null;
    }

    _getKuehlmodus() {
        const oid = this.state.rxData.oid_kuehlmodus;
        if (!oid) return false;
        const val = this.state.values[`${oid}.val`];
        return val === true || val === 'true' || val === 1 || val === '1';
    }

    // ── Lokales Live-Feedback (Anzeige + Kugel) ────────
    // Schreibt NUR den lokalen Drag-State, damit Text/Kugel während des
    // Ziehens sofort folgen. Der eigentliche OID-Write passiert erst in
    // _onPointerUp() – vorher wurde hier bei jedem Move bereits geschrieben,
    // was der Vorgabe "erst bei mouseup/touchend" widersprach.
    _setTempSoll(value) {
        if (this.props.editMode) return;
        const { min, max, step } = this._getRange();
        let v = Math.round(value / step) * step;
        v = Math.max(min, Math.min(max, v));
        v = Math.round(v * 100) / 100;
        this.setState({ dragTemp: v });
    }

    // ── Layout-Größe (voll dynamisch aus rxStyle) ─────
    _getSz() {
        const pad = 4;
        const w = parseInt(this.state.rxStyle?.width)  || 220;
        const h = parseInt(this.state.rxStyle?.height) || 220;
        const { showName, ueberschrift } = this.state.rxData;
        const fs = parseInt(this.state.rxStyle?.['font-size'] ?? this.state.rxStyle?.fontSize) || 12;
        const nameH = (showName && ueberschrift) ? Math.ceil(fs * 1.4) + 4 : 0;
        return Math.max(60, Math.min(w - pad * 2, h - pad * 2 - nameH));
    }

    // ── Winkel → Temperatur mit Totzone (analog ReglerLicht _angleToPercent) ─
    _angleToTemp(mx, my, sz) {
        const { min, max, step } = this._getRange();
        const cx = sz / 2, cy = sz / 2;
        const startA = DIAL_START * Math.PI / 180;
        const sweep  = DIAL_TOTAL * Math.PI / 180;

        let angle = Math.atan2(my - cy, mx - cx);
        let rel = angle - startA;
        if (rel < 0) rel += Math.PI * 2;

        if (rel > sweep) {
            const gapMid = sweep + (Math.PI * 2 - sweep) / 2;
            return rel < gapMid ? max : min;
        }

        const snapDeg = sweep * 0.08;
        let pct;
        if (rel < snapDeg) pct = 0;
        else if (rel > sweep - snapDeg) pct = 1;
        else pct = rel / sweep;

        let temp = min + pct * (max - min);
        temp = Math.round(temp / step) * step;
        return Math.max(min, Math.min(max, Math.round(temp * 100) / 100));
    }

    _relCoords(clientX, clientY, sz) {
        const svgEl = this._svgRef?.current;
        if (!svgEl) return { mx: sz / 2, my: sz / 2 };
        const rect  = svgEl.getBoundingClientRect();
        const scale = Math.min(rect.width / sz, rect.height / sz);
        const ox    = (rect.width  - sz * scale) / 2;
        const oy    = (rect.height - sz * scale) / 2;
        return {
            mx: (clientX - rect.left - ox) / scale,
            my: (clientY - rect.top  - oy) / scale,
        };
    }

    // ── Maus + Touch gemeinsam ────────────────────────
    _extractPoint(e) {
        if (e.touches && e.touches.length) return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
        if (e.changedTouches && e.changedTouches.length) return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
        return { clientX: e.clientX, clientY: e.clientY };
    }

    _onPointerDown(e, sz) {
        if (this.props.editMode) return;
        const { clientX, clientY } = this._extractPoint(e);
        const { mx, my } = this._relCoords(clientX, clientY, sz);
        const cx = sz / 2, cy = sz / 2;
        const R  = sz * 0.42;
        const sw = Math.max(3, sz * 0.06);
        const knobR = Math.max(6, sz * 0.075);
        const dist = Math.hypot(mx - cx, my - cy);
        const innerR = R - sw * 1.5;
        const outerR = R + knobR + 6;

        if (dist >= innerR && dist <= outerR) {
            this._dragging = true;
            this._setTempSoll(this._angleToTemp(mx, my, sz));
        }
    }

    _onPointerMove(e, sz) {
        if (!this._dragging || this.props.editMode) return;
        const { clientX, clientY } = this._extractPoint(e);
        const { mx, my } = this._relCoords(clientX, clientY, sz);
        this._setTempSoll(this._angleToTemp(mx, my, sz));
    }

    _onPointerUp() {
        if (this._dragging && !this.props.editMode && this.state.dragTemp !== null) {
            const oid = this.state.rxData.oid_temp_soll;
            if (oid) this.props.context.setValue(oid, this.state.dragTemp);
        }
        this._dragging = false;
        this.setState({ dragTemp: null });
    }

    // ── Verlaufs-Overlay: Öffnen/Schließen/Zeitraum ────
    _openHistory() {
        if (this.props.editMode) return;
        this.setState({ historyOpen: true });
        this._fetchHistoryData(this.state.historyRange);
    }

    _closeHistory() {
        this.setState({ historyOpen: false });
    }

    _setHistoryRange(range) {
        if (range === this.state.historyRange) return;
        this.setState({ historyRange: range });
        this._fetchHistoryData(range);
    }

    // this.props.context.socket ist eine @iobroker/socket-client Connection
    // (LegacyConnection) - deren getHistory(id, options) ist bereits Promise-
    // basiert (KEIN Callback-Parameter, s. Connection.d.ts: "getHistory(id: string,
    // options: GetHistoryOptions): Promise<GetHistoryResult>"). Ein früherer Versuch
    // hier rief sie fälschlich mit einem dritten Callback-Argument auf - das wurde
    // von der Implementierung stillschweigend ignoriert, die zurückgegebene Promise
    // nie ausgewertet, wodurch JEDE Historien-Abfrage immer erst nach dem eigenen
    // 15s-Timeout mit history_error endete, obwohl die Daten in InfluxDB korrekt
    // vorlagen. Fix: Promise direkt verwenden. Der 15s-Timeout bleibt sinnvoll,
    // da die Bibliothek für getHistory selbst explizit commandTimeout:false setzt,
    // also keinen eigenen Timeout mitbringt.
    _getHistory(oid, options) {
        const request = this.props.context.socket.getHistory(oid, options);
        const timeout = new Promise((_resolve, reject) => {
            setTimeout(() => reject(new Error('history request timeout')), 15000);
        });
        return Promise.race([request, timeout]).then(result => result || []);
    }

    // onchange-Rohpunkte (nur echte Änderungszeitpunkte) → durchgehende Linie:
    // erster/letzter Punkt wird bis an den Fensterrand (start/end) verlängert,
    // sonst würde die Linie mitten im Chart beginnen/enden. Für Soll- UND Ist-
    // Temperatur gleichermaßen genutzt.
    _normalizePoints(raw, start, end) {
        const pts = (raw || [])
            .filter(p => p && p.val !== null && p.val !== undefined && !Number.isNaN(Number(p.val)))
            .map(p => ({ t: p.ts, v: Number(p.val) }))
            .sort((a, b) => a.t - b.t);
        if (!pts.length) return [];
        if (pts[0].t > start) pts.unshift({ t: start, v: pts[0].v });
        if (pts[pts.length - 1].t < end) pts.push({ t: end, v: pts[pts.length - 1].v });
        return capHistoryPoints(pts, 200);
    }

    _fetchHistoryData(range) {
        const { influxInstance, oid_temp_soll, oid_temp_ist, oid_stellmotor } = this.state.rxData;
        if (!influxInstance || !oid_temp_soll) {
            this.setState({ historyLoading: false, historyError: I18n.t('history_error') });
            return;
        }

        const token = ++this._historyFetchToken;
        this.setState({ historyLoading: true, historyError: null });

        const end = Date.now();
        const start = end - (range === '7d' ? 7 * 24 * 3600 * 1000 : 24 * 3600 * 1000);

        const sollPromise = this._getHistory(oid_temp_soll, {
            instance: influxInstance, start, end, aggregate: 'onchange', count: 200,
        });

        // Ist-Temp ist optional - gleiche aggregate-Logik wie Soll, aber nur
        // abgefragt wenn oid_temp_ist überhaupt gesetzt ist (Konsistenz mit dem
        // Rest des Widgets, wo alles optional ein-/ausgeblendet wird).
        const istPromise = oid_temp_ist
            ? this._getHistory(oid_temp_ist, {
                instance: influxInstance, start, end, aggregate: 'onchange', count: 200,
            })
            : Promise.resolve(null);

        // Typ des Stellmotor-Datenpunkts ist erst durch echte Daten sicher bekannt,
        // aber der aktuelle Live-Wert (typeof-Erkennung wie in _getStellmotor()) ist
        // ein zuverlässiger Hinweis, welches Aggregat sinnvoll ist - boolean →
        // onchange (An/Aus-Zeitpunkte exakt), 0-100% → Zeitraster-Average.
        let motorPromise = Promise.resolve(null);
        if (oid_stellmotor) {
            const liveMotor = this._getStellmotor();
            if (liveMotor?.type === 'num') {
                const step = range === '7d' ? 60 * 60 * 1000 : 10 * 60 * 1000;
                motorPromise = this._getHistory(oid_stellmotor, {
                    instance: influxInstance, start, end, aggregate: 'average', step,
                }).then(points => ({ type: 'num', points }));
            } else {
                motorPromise = this._getHistory(oid_stellmotor, {
                    instance: influxInstance, start, end, aggregate: 'onchange', count: 200,
                }).then(points => ({ type: 'bool', points: capHistoryPoints(points, 200) }));
            }
        }

        Promise.all([sollPromise, istPromise, motorPromise])
            .then(([sollRaw, istRaw, motor]) => {
                if (!this._mounted || token !== this._historyFetchToken) return;
                const soll = this._normalizePoints(sollRaw, start, end);
                if (!soll.length) {
                    this.setState({ historyLoading: false, historyError: I18n.t('history_error') });
                    return;
                }
                const ist = istRaw ? this._normalizePoints(istRaw, start, end) : null;
                this.setState({
                    historyLoading: false,
                    historyError: null,
                    historyData: { soll, ist, motor, start, end },
                });
            })
            .catch(() => {
                if (!this._mounted || token !== this._historyFetchToken) return;
                this.setState({ historyLoading: false, historyError: I18n.t('history_error') });
            });
    }

    // Frei konfigurierbarer Widget-Rahmen (Breite/Farbe/Radius aus rxStyle) sitzt
    // auf einem Container mit overflow: hidden (für Dial/abgerundete Ecken nötig)
    // - alles was über die Padding-Box hinausragt wird dort abgeschnitten, auch
    // bei hohem z-index (der wirkt nur innerhalb desselben Stacking-Contexts,
    // überwindet aber kein overflow:hidden der Eltern-Box). Lösung wie beim
    // Overlay in S2a: per Portal nach document.body rendern, Position aus
    // getBoundingClientRect() des Widget-Root-Elements statt aus fixen Werten.
    _renderHistoryButton() {
        const { influxInstance, colorAN = '#2ecfbf' } = this.state.rxData;
        if (!influxInstance || !String(influxInstance).trim()) return null;
        // Während das Overlay offen ist, liegt dessen Backdrop (zIndex 100000)
        // ohnehin über dem gesamten Viewport - Button hier zusätzlich gar nicht
        // erst rendern, statt mich auf reine z-index-Reihenfolge zu verlassen.
        if (this.state.historyOpen) return null;

        const rootEl = this._rootRef.current;
        if (!rootEl) return null; // erster Render vor dem Mount - componentDidMount holt das per forceUpdate nach
        const rect = rootEl.getBoundingClientRect();

        // Gefüllter Kreis statt reinem Stroke-Icon: Sichtbarkeit darf nicht vom
        // zufälligen Kontrast zum jeweiligen Hintergrund abhängen (siehe Fix-Notiz
        // zu diesem Button in der Commit-Historie).
        const iconColor = pickIconContrastColor(colorAN);
        const btnSize = 22;
        const outset = 5; // leichter Versatz nach außen, damit der Button sichtbar über dem Rahmen liegt

        return createPortal(
            <div
                onClick={e => { e.stopPropagation(); this._openHistory(); }}
                title={I18n.t('history_group')}
                style={{
                    position: 'fixed',
                    top: rect.top - outset,
                    left: rect.right - btnSize + outset,
                    width: btnSize, height: btnSize,
                    borderRadius: '50%',
                    background: colorAN,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: this.props.editMode ? 'default' : 'pointer',
                    zIndex: 99998, // unterhalb des Overlays (100000), oberhalb anderer Widgets in der View
                }}
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <circle cx="10" cy="10" r="7" stroke={iconColor} strokeWidth="2.4" />
                    <line x1="15.5" y1="15.5" x2="21" y2="21" stroke={iconColor} strokeWidth="2.4" strokeLinecap="round" />
                </svg>
            </div>,
            document.body,
        );
    }

    // Portal nach document.body: das Widget selbst kann in Editor UND Runtime
    // durch overflow/Größe des Containers geclippt werden – ein Overlay im
    // normalen Render-Baum wäre davon betroffen, ein Portal nicht.
    _renderHistoryOverlay() {
        if (!this.state.historyOpen || this.props.editMode) return null;

        const {
            colorAN = '#2ecfbf', colorAUS = '#5f8f8a', colorKuehlen = '#4aa8ff',
            colorVerlaufSoll = '#ffffff', colorVerlaufIst = '#ffb347', ueberschrift,
        } = this.state.rxData;
        const cooling = this._getKuehlmodus();
        const range = this.state.historyRange || '24h';
        const title = ueberschrift ? `${ueberschrift} – ${I18n.t('history_group')}` : I18n.t('history_group');

        return createPortal(
            <div
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 100000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onClick={() => this._closeHistory()}
            >
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        width: 'min(90vw, 700px)', height: 'min(80vh, 400px)',
                        background: '#0d1820', border: `1px solid ${colorAN}`,
                        borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                        display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                        padding: 12, color: '#c8e6e3', fontFamily: 'sans-serif',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button onClick={() => this._setHistoryRange('24h')} style={rangeButtonStyle(range === '24h', colorAN)}>
                                {I18n.t('range_24h')}
                            </button>
                            <button onClick={() => this._setHistoryRange('7d')} style={rangeButtonStyle(range === '7d', colorAN)}>
                                {I18n.t('range_7d')}
                            </button>
                            <button
                                onClick={() => this._closeHistory()}
                                style={{
                                    marginLeft: 8, width: 26, height: 26, borderRadius: '50%', border: 'none',
                                    background: 'rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer',
                                    fontSize: 15, lineHeight: '26px', padding: 0,
                                }}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 6, fontSize: 11, color: colorAUS }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ display: 'inline-block', width: 14, height: 2.5, background: colorVerlaufSoll, borderRadius: 1 }} />
                            {I18n.t('legend_soll')}
                        </div>
                        {this.state.rxData.oid_temp_ist && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ display: 'inline-block', width: 14, height: 2.5, background: colorVerlaufIst, borderRadius: 1 }} />
                                {I18n.t('legend_ist')}
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ display: 'inline-block', width: 10, height: 10, background: colorAN, opacity: 0.5, borderRadius: 2 }} />
                            {I18n.t('legend_aktor')}
                        </div>
                    </div>
                    {this._renderHistoryBody(colorAN, colorAUS, colorKuehlen, colorVerlaufSoll, colorVerlaufIst, cooling)}
                </div>
            </div>,
            document.body,
        );
    }

    // Chart-Bereich innerhalb des Overlays: Ladehinweis / Fehlermeldung / SVG-Chart.
    // Beim Zeitraum-Wechsel bleibt ein bereits vorhandener Chart sichtbar (kein
    // Flackern) - Lade-/Fehlerzustand erscheint dann nur als kleines Badge oben
    // rechts über dem weiterhin sichtbaren alten Chart.
    _renderHistoryBody(colorAN, colorAUS, colorKuehlen, colorVerlaufSoll, colorVerlaufIst, cooling) {
        const { historyData, historyLoading, historyError, historyRange } = this.state;

        if (!historyData) {
            return (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colorAUS, fontSize: 13, textAlign: 'center', padding: 12 }}>
                    {historyError || I18n.t('history_loading')}
                </div>
            );
        }

        const svgContent = buildHistorySVG(640, 260, historyData, colorAN, colorAUS, colorKuehlen, colorVerlaufSoll, colorVerlaufIst, cooling, historyRange);

        return (
            <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                <svg
                    width="100%" height="100%"
                    viewBox="0 0 640 260"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ display: 'block' }}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                />
                {(historyLoading || historyError) && (
                    <div style={{
                        position: 'absolute', top: 4, right: 4,
                        fontSize: 10, padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(0,0,0,0.55)',
                        color: historyError ? '#ff8a80' : colorAUS,
                    }}>
                        {historyError || I18n.t('history_loading')}
                    </div>
                )}
            </div>
        );
    }

    renderWidgetBody(props) {
        super.renderWidgetBody(props);

        const {
            ueberschrift  = 'Temperatur',
            showName      = true,
            namePosition  = 'bottom',
            colorAN       = '#2ecfbf',
            colorAUS      = '#5f8f8a',
            colorKuehlen  = '#4aa8ff',
        } = this.state.rxData;

        const { min, max } = this._getRange();
        const tempSoll = this._getTempSoll();
        const tempIst  = this._getTempIst();
        const humidity = this._getFeuchtigkeit();
        const motor    = this._getStellmotor();
        const cooling  = this._getKuehlmodus();
        const sz       = this._getSz();
        const iconScale = Math.max(10, Math.min(100, parseInt(this.state.rxData.iconScale) || 80));

        const svgContent = buildDialSVG(sz, tempSoll, tempIst, humidity, motor, min, max, colorAN, colorAUS, colorKuehlen, cooling);

        const nameEl = showName && ueberschrift ? (
            <div style={{
                color:        this.state.rxStyle?.color || '#c8e6e3',
                fontSize:     this.state.rxStyle?.['font-size'] || this.state.rxStyle?.fontSize || 12,
                fontWeight:   this.state.rxStyle?.['font-weight'] || this.state.rxStyle?.fontWeight || 400,
                textAlign:    'center',
                lineHeight:   1.2,
                wordBreak:    'break-word',
                width:        '100%',
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap',
                flexShrink:   0,
            }}>
                {ueberschrift}
            </div>
        ) : null;

        return (
            <div
                ref={this._rootRef}
                style={{
                    position: 'relative',
                    width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 4,
                    cursor: this.props.editMode ? 'default' : 'pointer',
                    userSelect: 'none',
                    touchAction: 'none',
                    boxSizing: 'border-box',
                    padding: 1,
                }}
                onMouseDown={e   => this._onPointerDown(e, sz)}
                onMouseMove={e   => this._onPointerMove(e, sz)}
                onMouseUp={()    => this._onPointerUp()}
                onMouseLeave={() => this._onPointerUp()}
                onTouchStart={e  => this._onPointerDown(e, sz)}
                onTouchMove={e   => { e.preventDefault(); this._onPointerMove(e, sz); }}
                onTouchEnd={()   => this._onPointerUp()}
            >
                {this._renderHistoryButton()}
                {this._renderHistoryOverlay()}

                {namePosition === 'top' && nameEl}

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
                    <div style={{ width: `${iconScale}%`, height: `${iconScale}%` }}>
                        <svg
                            ref={this._svgRef}
                            width="100%" height="100%"
                            viewBox={`0 0 ${sz} ${sz}`}
                            preserveAspectRatio="xMidYMid meet"
                            style={{ display: 'block' }}
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                        />
                    </div>
                </div>

                {(namePosition === 'bottom' || !namePosition) && nameEl}
            </div>
        );
    }
}

export default ReglerTemperatur;

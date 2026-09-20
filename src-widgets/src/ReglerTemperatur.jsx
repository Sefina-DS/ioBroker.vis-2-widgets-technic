import React from 'react';
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

function buildDialSVG(sz, tempSoll, tempIst, motor, min, max, colorAN, colorAUS, colorKuehlen, cooling) {
    const cx = sz / 2, cy = sz / 2;
    const R  = sz * 0.42;
    const sw = Math.max(3, sz * 0.06);
    const knobR = Math.max(6, sz * 0.075);

    const pct = max > min ? Math.max(0, Math.min(1, (tempSoll - min) / (max - min))) : 0;
    const kDeg = DIAL_START + DIAL_TOTAL * pct;
    const kRad = kDeg * Math.PI / 180;
    const kx = cx + R * Math.cos(kRad);
    const ky = cy + R * Math.sin(kRad);

    const fillPath = pct > 0
        ? `<path d="${describeArc(cx, cy, R, DIAL_START, DIAL_START + DIAL_TOTAL * pct)}" fill="none" stroke="${colorAN}" stroke-width="${sw}" stroke-linecap="round"/>`
        : '';

    const sollSize = Math.max(12, sz * 0.16);
    const subSize  = Math.max(9, sz * 0.075);
    const sollY = cy + sollSize * 0.12;
    const subY  = sollY + sollSize * 0.62;
    const gap   = sz * 0.05;   // deutlich mehr Abstand als vorher (war 0.018) – behebt "zu eng/verschachtelt"

    const sollText = `<text x="${cx}" y="${sollY.toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="${sollSize.toFixed(1)}" font-weight="700" fill="${colorAN}">${tempSoll.toFixed(1)}°</text>`;

    const istText = tempIst !== null
        ? `<text x="${(cx - gap).toFixed(1)}" y="${subY.toFixed(1)}" text-anchor="end" font-family="sans-serif" font-size="${subSize.toFixed(1)}" fill="${colorAUS}">${tempIst.toFixed(1)}°</text>`
        : '';

    // Größe/Abstand wie in der vorigen Runde (deutlich größer als der ursprüngliche
    // Punkt-Indikator, mehr Luft zur Ist-Temperatur) – nur das Symbol wechselt.
    const iconSize = sz * 0.13;
    const iconCx = cx + gap + iconSize / 2;
    const iconCy = subY - iconSize * 0.38;

    let motorEl = '';
    if (motor) {
        if (motor.type === 'bool') {
            if (!motor.value) {
                motorEl = buildOffDot(iconCx, iconCy, iconSize, colorAUS);
            } else if (cooling) {
                motorEl = buildSnowIcon(iconCx, iconCy, iconSize, colorKuehlen);
            } else {
                motorEl = buildFlameIcon(iconCx, iconCy, iconSize, colorAN);
            }
        } else {
            // 0-100%: passendes Icon davor (Flamme/Schneeflocke), kein Icon bei 0%
            const pctIconSize = iconSize * 0.8;
            const iconSvg = motor.value > 0
                ? (cooling
                    ? buildSnowIcon(iconCx, iconCy, pctIconSize, colorKuehlen)
                    : buildFlameIcon(iconCx, iconCy, pctIconSize, colorAN))
                : '';
            const textX = cx + gap + (motor.value > 0 ? iconSize * 0.9 : 0);
            motorEl = `${iconSvg}<text x="${textX.toFixed(1)}" y="${subY.toFixed(1)}" text-anchor="start" font-family="sans-serif" font-size="${subSize.toFixed(1)}" fill="${colorAUS}">${motor.value}%</text>`;
        }
    }

    return `
        <path d="${describeArc(cx, cy, R, DIAL_START, DIAL_START + DIAL_TOTAL)}"
            fill="none" stroke="${colorAUS}" stroke-width="${sw}" stroke-linecap="round" opacity="0.45"/>
        ${fillPath}
        <circle cx="${kx.toFixed(2)}" cy="${ky.toFixed(2)}" r="${knobR}" fill="transparent" stroke="${colorAN}" stroke-width="2.4"/>
        ${sollText}
        ${istText}
        ${motorEl}
    `;
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
                        { name: 'ueberschrift', label: 'heading', type: 'text', default: 'Heating' },
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
            ],
        };
    }

    getWidgetInfo() { return ReglerTemperatur.getWidgetInfo(); }

    constructor(props) {
        super(props);
        this.state = { ...this.state, dragTemp: null };
        this._svgRef = React.createRef();
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

    renderWidgetBody(props) {
        super.renderWidgetBody(props);

        const {
            ueberschrift  = 'Heating',
            showName      = true,
            namePosition  = 'bottom',
            colorAN       = '#2ecfbf',
            colorAUS      = '#5f8f8a',
            colorKuehlen  = '#4aa8ff',
        } = this.state.rxData;

        const { min, max } = this._getRange();
        const tempSoll = this._getTempSoll();
        const tempIst  = this._getTempIst();
        const motor    = this._getStellmotor();
        const cooling  = this._getKuehlmodus();
        const sz       = this._getSz();
        const iconScale = Math.max(10, Math.min(100, parseInt(this.state.rxData.iconScale) || 80));

        const svgContent = buildDialSVG(sz, tempSoll, tempIst, motor, min, max, colorAN, colorAUS, colorKuehlen, cooling);

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
                style={{
                    width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 4,
                    cursor: this.props.editMode ? 'default' : 'pointer',
                    userSelect: 'none',
                    touchAction: 'none',
                    boxSizing: 'border-box',
                    padding: 4,
                }}
                onMouseDown={e   => this._onPointerDown(e, sz)}
                onMouseMove={e   => this._onPointerMove(e, sz)}
                onMouseUp={()    => this._onPointerUp()}
                onMouseLeave={() => this._onPointerUp()}
                onTouchStart={e  => this._onPointerDown(e, sz)}
                onTouchMove={e   => { e.preventDefault(); this._onPointerMove(e, sz); }}
                onTouchEnd={()   => this._onPointerUp()}
            >
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

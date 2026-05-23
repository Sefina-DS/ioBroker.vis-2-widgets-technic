import React from 'react';

function describeArc(cx, cy, r, startDeg, endDeg) {
    const toRad = d => d * Math.PI / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = (endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`;
}

function buildSVGContent(pct, isOn, colorOn, colorOff, colorBg, sz) {
    const cx = sz / 2, cy = sz / 2;
    const R     = sz * 0.40;
    const btnR  = sz * 0.20;
    const sw    = Math.max(3, sz * 0.055);
    const knobR = Math.max(5, sz * 0.075);

    const startDeg = 135, totalDeg = 270;
    const activeColor = isOn ? colorOn : colorOff;

    const kDeg = startDeg + totalDeg * (pct / 100);
    const kRad = kDeg * Math.PI / 180;
    const kx   = cx + R * Math.cos(kRad);
    const ky   = cy + R * Math.sin(kRad);

    const fillPath = pct > 0
        ? `<path d="${describeArc(cx, cy, R, startDeg, startDeg + totalDeg * (pct / 100))}" fill="none" stroke="${colorOn}" stroke-width="${sw}" stroke-linecap="round"/>`
        : '';

    const iconCY     = cy - btnR * 0.10;
    const iconR      = btnR * 0.30;
    const tick       = sz * 0.028;
    const rayOriginY = iconCY + iconR - tick * 2;
    const margin     = sz * 0.04;

    let iconHTML = `
        <path d="${describeArc(cx, iconCY, iconR, 200, 340)}" fill="none" stroke="${activeColor}" stroke-width="${sz*0.025}" stroke-linecap="round"/>
        <line x1="${cx}" y1="${(iconCY - iconR).toFixed(2)}" x2="${cx}" y2="${(iconCY - iconR * 1.6).toFixed(2)}" stroke="${activeColor}" stroke-width="${sz*0.025}" stroke-linecap="round"/>
    `;

    if (isOn && pct > 0) {
        const allAngles = [0, -28, 28, -56, 56];
        const count     = pct < 20 ? 1 : pct < 60 ? 3 : 5;
        const lenFactor = 0.35 + 0.65 * (pct / 100);
        for (let i = 0; i < count; i++) {
            const aRad = allAngles[i] * Math.PI / 180;
            const sinA = Math.sin(aRad), cosA = Math.cos(aRad);
            let maxLen = 0;
            for (let l = 0; l < btnR * 2; l += 0.5) {
                const ex = cx + sinA * l;
                const ey = rayOriginY + cosA * l;
                if (Math.sqrt((ex - cx)**2 + (ey - cy)**2) > btnR - margin) break;
                maxLen = l;
            }
            const len = maxLen * lenFactor;
            let alpha = 1;
            if (i === 0)            alpha = Math.min(1, pct / 15);
            if (i === 1 || i === 2) alpha = Math.min(1, (pct - 20) / 15);
            if (i === 3 || i === 4) alpha = Math.min(1, (pct - 60) / 15);
            iconHTML += `<line
                x1="${(cx + sinA).toFixed(2)}" y1="${(rayOriginY + cosA).toFixed(2)}"
                x2="${(cx + sinA * (len + 1)).toFixed(2)}" y2="${(rayOriginY + cosA * (len + 1)).toFixed(2)}"
                stroke="${colorOn}" stroke-width="${sz*0.022}" stroke-linecap="round"
                opacity="${Math.max(0, alpha).toFixed(2)}"/>`;
        }
    }

    const pctSize = Math.max(10, sz * 0.13);
    const pctY    = cy + btnR + sz * 0.16;

    return `
        <path d="${describeArc(cx, cy, R, startDeg, startDeg + totalDeg)}"
            fill="none" stroke="${colorOff}" stroke-width="${sw}" stroke-linecap="round"/>
        ${fillPath}
        <circle cx="${kx.toFixed(2)}" cy="${ky.toFixed(2)}" r="${knobR}" fill="${colorBg}" stroke="${activeColor}" stroke-width="2.2"/>
        <circle cx="${cx}" cy="${cy}" r="${btnR}" fill="transparent" stroke="${activeColor}" stroke-width="${sz*0.018}"/>
        ${iconHTML}
        <text x="${cx}" y="${pctY.toFixed(1)}" text-anchor="middle"
            font-family="sans-serif" font-size="${pctSize.toFixed(1)}" font-weight="600"
            fill="${activeColor}">${pct} %</text>
    `;
}

// ═══════════════════════════════════════════════════════
//  WIDGET KLASSE
// ═══════════════════════════════════════════════════════
class BeleuchtungDimmer extends window.visRxWidget {

    static getWidgetInfo() {
        return {
            id: 'tplTechnicBeleuchtungDimmer',
            visSet:          'vis-2-widgets-technic',
            visSetLabel:     'Technic Widgets',
            visSetColor:     '#2ecfbf',
            visWidgetColor:  '#0d1820',
            visName:         'Beleuchtung Dimmer',
            visWidgetLabel:  'Beleuchtung Dimmer',
            visDefaultStyle: { width: 160, height: 200 },
            vis2: true,
            visPrev: 'widgets/vis-2-widgets-technic/img/prev-beleuchtung-dimmer.png',
            visAttrs: [
                {
                    name: 'common',
                    label: 'Allgemein',
                    fields: [
                        { name: 'name',         label: 'Name',                   type: 'text',     default: 'Licht' },
                        { name: 'showName',     label: 'Name anzeigen',          type: 'checkbox', default: true },
                        { name: 'nameColor',    label: 'Name Farbe',             type: 'color',    default: '#c8e6e3' },
                        { name: 'nameFontSize', label: 'Name Schriftgröße (px)', type: 'number',   default: 12 },
                        { name: 'nameBold',     label: 'Name Fett',              type: 'checkbox', default: false },
                        {
                            name: 'namePosition', label: 'Name Position', type: 'select',
                            options: [
                                { value: 'top',    label: 'Oben' },
                                { value: 'bottom', label: 'Unten' },
                            ],
                            default: 'bottom',
                        },
                        { name: 'iconScale', label: 'Icon Größe (%)', type: 'number', default: 80 },
                    ],
                },
                {
                    name: 'ids',
                    label: 'Datenpunkte',
                    fields: [
                        { name: 'oid_power',         label: 'Ein/Aus (boolean)',                    type: 'id' },
                        { name: 'oid_dimmer',         label: 'Helligkeit (0–100)',                   type: 'id' },
                        { name: 'linkPowerDimmer',    label: 'Ein/Aus mit Helligkeit verknüpfen',    type: 'checkbox', default: true },
                    ],
                },
                {
                    name: 'colors',
                    label: 'Farben',
                    fields: [
                        { name: 'colorAN',  label: 'Farbe AN',          type: 'color', default: '#2ecfbf' },
                        { name: 'colorAUS', label: 'Farbe AUS',         type: 'color', default: '#5f8f8a' },
                        { name: 'colorBg',  label: 'Kugel Hintergrund', type: 'color', default: '#0d1820' },
                    ],
                },
            ],
        };
    }

    getWidgetInfo() { return BeleuchtungDimmer.getWidgetInfo(); }

    constructor(props) {
        super(props);
        this.state = { ...this.state, dragPct: null };
    }

    propertiesUpdate() {}
    onRxDataChanged()  { this.propertiesUpdate(); }
    onRxStyleChanged() {}
    onStateUpdated()   {}

    _isOn() {
        const oid = this.state.rxData.oid_power;
        if (!oid) return false;
        const val = this.state.values[`${oid}.val`];
        return val === true || val === 'true' || val === 1 || val === '1';
    }

    _getBrightness() {
        if (this.state.dragPct !== null) return this.state.dragPct;
        const oid = this.state.rxData.oid_dimmer;
        if (!oid) return 0;
        const val = this.state.values[`${oid}.val`];
        if (val === null || val === undefined) return 0;
        return Math.max(0, Math.min(100, Math.round(Number(val))));
    }

    _getSz() {
        const w     = parseInt(this.state.rxStyle?.width)  || 160;
        const h     = parseInt(this.state.rxStyle?.height) || 200;
        const min   = Math.min(w, h);
        const scale = Math.max(10, Math.min(100, parseInt(this.state.rxData.iconScale) || 80));
        return Math.round(min * scale / 100);
    }

    _setPower(on) {
        const oidP   = this.state.rxData.oid_power;
        const oidD   = this.state.rxData.oid_dimmer;
        const linked = this.state.rxData.linkPowerDimmer !== false;
        if (this.props.editMode) return;
        if (oidP) this.props.context.setValue(oidP, on);
        if (linked && oidD) this.props.context.setValue(oidD, on ? 100 : 0);
        this.setState({ dragPct: on ? 100 : 0 });
    }

    _setDimmer(value) {
        const oidD   = this.state.rxData.oid_dimmer;
        const oidP   = this.state.rxData.oid_power;
        const linked = this.state.rxData.linkPowerDimmer !== false;
        if (this.props.editMode) return;
        const v = Math.max(0, Math.min(100, Math.round(value)));
        this.setState({ dragPct: v });
        if (oidD) this.props.context.setValue(oidD, v);
        if (linked && oidP) this.props.context.setValue(oidP, v > 0);
    }

    // ── Winkel → Prozentwert mit Totzone ──────────────
    // Der 270°-Bogen geht von 135° bis 405° (=45°)
    // Die Lücke (Totzone) liegt von 45° bis 135° (unterer Bereich, 90°)
    // Wenn der Mauswinkel in diese Lücke fällt → null (nichts tun)
    _angleToPercent(mx, my, sz) {
        const cx = sz / 2, cy = sz / 2;
        const startA = 135 * Math.PI / 180;
        const sweep  = 270 * Math.PI / 180;

        let angle = Math.atan2(my - cy, mx - cx);
        let rel   = angle - startA;
        if (rel < 0) rel += Math.PI * 2;

        // Totzone (90° Lücke unten): ignorieren
        if (rel > sweep) {
            // Snap: nah am Start (0%) oder nah am Ende (100%)?
            // Lücke geht von sweep bis 2π
            // Mitte der Lücke: sweep + (2π - sweep) / 2
            const gapMid = sweep + (Math.PI * 2 - sweep) / 2;
            if (rel < gapMid) return 100; // näher am Ende → 100%
            return 0;                      // näher am Start → 0%
        }

        // Snap-Zonen: erste/letzte 8% des Bogens → einrasten auf 0 / 100
        const snapDeg = sweep * 0.08;
        if (rel < snapDeg)          return 0;
        if (rel > sweep - snapDeg)  return 100;

        return Math.round((rel / sweep) * 100);
    }

    _relCoords(e, sz) {
        const rect = e.currentTarget.getBoundingClientRect();
        return {
            mx: (e.clientX - rect.left) * (sz / rect.width),
            my: (e.clientY - rect.top)  * (sz / rect.height),
        };
    }

    _onMouseDown(e, sz) {
        if (this.props.editMode) return;
        const { mx, my } = this._relCoords(e, sz);
        const cx = sz / 2, cy = sz / 2;
        const R    = sz * 0.40;
        const btnR = sz * 0.20;
        const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);

        if (dist < btnR) {
            // Power-Button
            this._setPower(!this._isOn());
        } else if (dist >= btnR + 4 && dist <= R + 14) {
            const pct = this._angleToPercent(mx, my, sz);
            this._dragging = true;
            this._setDimmer(pct);
        }
    }

    _onMouseMove(e, sz) {
        if (!this._dragging || this.props.editMode) return;
        const { mx, my } = this._relCoords(e, sz);
        const pct = this._angleToPercent(mx, my, sz);
        this._setDimmer(pct);
    }

    _onMouseUp() {
        this._dragging = false;
        this.setState({ dragPct: null });
    }

    renderWidgetBody(props) {
        super.renderWidgetBody(props);

        const {
            name         = 'Licht',
            showName     = true,
            namePosition = 'bottom',
            nameColor    = '#c8e6e3',
            nameFontSize = 12,
            nameBold     = false,
            colorAN      = '#2ecfbf',
            colorAUS     = '#5f8f8a',
            colorBg      = '#0d1820',
        } = this.state.rxData;

        const isOn = this._isOn();
        const pct  = this._getBrightness();
        const sz   = this._getSz();

        const svgContent = buildSVGContent(pct, isOn, colorAN, colorAUS, colorBg, sz);

        const nameEl = showName && name ? (
            <div style={{
                color:        nameColor    || '#c8e6e3',
                fontSize:     `${nameFontSize || 12}px`,
                fontWeight:   nameBold ? 700 : 400,
                textAlign:    'center',
                lineHeight:   1.2,
                wordBreak:    'break-word',
                width:        '100%',
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap',
                flexShrink:   0,
            }}>
                {name}
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
                    boxSizing: 'border-box',
                    padding: 4,
                }}
                onMouseDown={e  => this._onMouseDown(e, sz)}
                onMouseMove={e  => this._onMouseMove(e, sz)}
                onMouseUp={()   => this._onMouseUp()}
                onMouseLeave={()=> this._onMouseUp()}
            >
                {namePosition === 'top' && nameEl}

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
                    <svg
                        width={sz}
                        height={sz}
                        viewBox={`0 0 ${sz} ${sz}`}
                        preserveAspectRatio="xMidYMid meet"
                        style={{ display: 'block', flexShrink: 0 }}
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                </div>

                {(namePosition === 'bottom' || !namePosition) && nameEl}
            </div>
        );
    }
}

export default BeleuchtungDimmer;

import React from 'react';
import { I18n } from '@iobroker/adapter-react-v5';
import translations from './translations.js';

I18n.extendTranslations(translations);

// ═══════════════════════════════════════════════════════
//  SVG HILFSFUNKTIONEN
// ═══════════════════════════════════════════════════════
function svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    return el;
}

function rolloStripes(svg, pct, rahmenf) {
    const h = 180 * ((100 - pct) / 100);
    if (h < 1) return;
    svg.appendChild(svgEl('rect', { x: 20, y: 20, width: 160, height: h, fill: '#1e2a2a' }));
    for (let y = 26; y < 20 + h; y += 6)
        svg.appendChild(svgEl('line', { x1: 20, y1: y, x2: 180, y2: y, stroke: rahmenf, 'stroke-width': 0.9, opacity: 0.5 }));
    svg.appendChild(svgEl('line', { x1: 20, y1: 20 + h, x2: 180, y2: 20 + h, stroke: rahmenf, 'stroke-width': 1.5 }));
}

function addMask(svg, id) {
    const defs = svgEl('defs', {});
    const mask = svgEl('mask', { id });
    mask.appendChild(svgEl('rect', { x: 10, y: 10, width: 180, height: 200, rx: 4, fill: 'white' }));
    mask.appendChild(svgEl('rect', { x: 20, y: 20, width: 160, height: 180, rx: 2, fill: 'black' }));
    defs.appendChild(mask);
    svg.appendChild(defs);
}

// ── Icon Zahnrad (Automatik) ──────────────────────────
function drawIconAuto(svg, cx, cy, r, farbe) {
    const g = svgEl('g', { class: 'mode-icon' });
    g.appendChild(svgEl('circle', { cx, cy, r, fill: '#0d1820', stroke: farbe, 'stroke-width': 1.5 }));
    g.appendChild(svgEl('circle', { cx, cy, r: r * 0.29, fill: 'none', stroke: farbe, 'stroke-width': 1.5 }));
    g.appendChild(svgEl('circle', { cx, cy, r: r * 0.57, fill: 'none', stroke: farbe, 'stroke-width': 2, 'stroke-dasharray': '3 2' }));
    svg.appendChild(g);
}

// ── Icon Hand (Manuell) ───────────────────────────────
function drawIconHand(svg, cx, cy, r, farbe) {
    const s = r / 14;
    const g = svgEl('g', { class: 'mode-icon' });
    g.appendChild(svgEl('circle', { cx, cy, r, fill: '#0d1820', stroke: farbe, 'stroke-width': 1.5 }));
    // Finger
    g.appendChild(svgEl('rect', { x: cx - 9*s, y: cy - 3*s, width: 3.5*s, height: 11*s, rx: 1.5*s, fill: farbe }));
    g.appendChild(svgEl('rect', { x: cx - 4.5*s, y: cy - 7*s, width: 3.5*s, height: 15*s, rx: 1.5*s, fill: farbe }));
    g.appendChild(svgEl('rect', { x: cx + 0*s, y: cy - 5*s, width: 3.5*s, height: 13*s, rx: 1.5*s, fill: farbe }));
    g.appendChild(svgEl('rect', { x: cx + 4.5*s, y: cy - 3*s, width: 3.5*s, height: 11*s, rx: 1.5*s, fill: farbe }));
    // Handfläche
    g.appendChild(svgEl('rect', { x: cx - 9*s, y: cy + 4*s, width: 17*s, height: 3*s, rx: 1.5*s, fill: farbe }));
    svg.appendChild(g);
}

// ═══════════════════════════════════════════════════════
//  ZEICHENFUNKTIONEN
// ═══════════════════════════════════════════════════════
const DRAW = {
    LZ(svg, pct, rahmenf, maskId) {
        svg.innerHTML = '';
        addMask(svg, maskId);
        svg.appendChild(svgEl('rect', { x: 10, y: 10, width: 180, height: 200, rx: 4, fill: 'rgba(0,0,0,0.60)', mask: `url(#${maskId})` }));
        svg.appendChild(svgEl('rect', { x: 20, y: 20, width: 160, height: 180, rx: 2, fill: 'rgba(0,0,0,0.30)' }));
        rolloStripes(svg, pct, rahmenf);
        svg.appendChild(svgEl('rect', { x: 10, y: 10, width: 180, height: 200, rx: 4, fill: 'none', stroke: rahmenf, 'stroke-width': 2.5 }));
        svg.appendChild(svgEl('rect', { x: 20, y: 20, width: 160, height: 180, rx: 2, fill: 'none', stroke: rahmenf, 'stroke-width': 1 }));
        svg.appendChild(svgEl('rect', { x: 25, y: 98, width: 6, height: 24, rx: 3, fill: rahmenf }));
        svg.appendChild(svgEl('rect', { x: 20, y: 108, width: 16, height: 6, rx: 3, fill: rahmenf }));
    },
    LA(svg, pct, rahmenf, maskId) {
        svg.innerHTML = '';
        addMask(svg, maskId);
        svg.appendChild(svgEl('rect', { x: 10, y: 10, width: 180, height: 200, rx: 4, fill: 'rgba(0,0,0,0.60)', mask: `url(#${maskId})` }));
        rolloStripes(svg, pct, rahmenf);
        svg.appendChild(svgEl('polygon', { points: '180,20 180,200 125,207 125,27', fill: 'rgba(0,0,0,0.30)', stroke: rahmenf, 'stroke-width': 1.5 }));
        svg.appendChild(svgEl('line', { x1: 180, y1: 20, x2: 180, y2: 200, stroke: rahmenf, 'stroke-width': 2 }));
        svg.appendChild(svgEl('rect', { x: 10, y: 10, width: 180, height: 200, rx: 4, fill: 'none', stroke: rahmenf, 'stroke-width': 2.5 }));
        svg.appendChild(svgEl('rect', { x: 20, y: 20, width: 160, height: 180, rx: 2, fill: 'none', stroke: rahmenf, 'stroke-width': 1 }));
        svg.appendChild(svgEl('rect', { x: 128, y: 98, width: 6, height: 24, rx: 3, fill: rahmenf }));
        svg.appendChild(svgEl('rect', { x: 123, y: 108, width: 16, height: 6, rx: 3, fill: rahmenf }));
    },
    RZ(svg, pct, rahmenf, maskId) {
        svg.innerHTML = '';
        addMask(svg, maskId);
        svg.appendChild(svgEl('rect', { x: 10, y: 10, width: 180, height: 200, rx: 4, fill: 'rgba(0,0,0,0.60)', mask: `url(#${maskId})` }));
        svg.appendChild(svgEl('rect', { x: 20, y: 20, width: 160, height: 180, rx: 2, fill: 'rgba(0,0,0,0.30)' }));
        rolloStripes(svg, pct, rahmenf);
        svg.appendChild(svgEl('rect', { x: 10, y: 10, width: 180, height: 200, rx: 4, fill: 'none', stroke: rahmenf, 'stroke-width': 2.5 }));
        svg.appendChild(svgEl('rect', { x: 20, y: 20, width: 160, height: 180, rx: 2, fill: 'none', stroke: rahmenf, 'stroke-width': 1 }));
        svg.appendChild(svgEl('rect', { x: 169, y: 98, width: 6, height: 24, rx: 3, fill: rahmenf }));
        svg.appendChild(svgEl('rect', { x: 164, y: 108, width: 16, height: 6, rx: 3, fill: rahmenf }));
    },
    RA(svg, pct, rahmenf, maskId) {
        svg.innerHTML = '';
        addMask(svg, maskId);
        svg.appendChild(svgEl('rect', { x: 10, y: 10, width: 180, height: 200, rx: 4, fill: 'rgba(0,0,0,0.60)', mask: `url(#${maskId})` }));
        rolloStripes(svg, pct, rahmenf);
        svg.appendChild(svgEl('polygon', { points: '20,20 20,200 75,207 75,27', fill: 'rgba(0,0,0,0.30)', stroke: rahmenf, 'stroke-width': 1.5 }));
        svg.appendChild(svgEl('line', { x1: 20, y1: 20, x2: 20, y2: 200, stroke: rahmenf, 'stroke-width': 2 }));
        svg.appendChild(svgEl('rect', { x: 10, y: 10, width: 180, height: 200, rx: 4, fill: 'none', stroke: rahmenf, 'stroke-width': 2.5 }));
        svg.appendChild(svgEl('rect', { x: 20, y: 20, width: 160, height: 180, rx: 2, fill: 'none', stroke: rahmenf, 'stroke-width': 1 }));
        svg.appendChild(svgEl('rect', { x: 56, y: 98, width: 6, height: 24, rx: 3, fill: rahmenf }));
        svg.appendChild(svgEl('rect', { x: 51, y: 108, width: 16, height: 6, rx: 3, fill: rahmenf }));
    },
};

const VIEWBOX = '0 0 200 220';

// ═══════════════════════════════════════════════════════
//  WIDGET
// ═══════════════════════════════════════════════════════
class FensterWand extends window.visRxWidget {

    static getWidgetInfo() {
        return {
            id: 'tplTechnicFensterWand',
            visSet: 'vis-2-widgets-technic',
            visSetLabel: 'Technic Widgets',
            visName: 'Window - Wall',
            visWidgetLabel: 'Window - Wall',
            visSetColor:    '#2ecfbf',   // Gruppenfarbe (das Icon links)
            visWidgetColor: '#0d1820',   // Kachelfarbe des einzelnen Widgets ← NEU
            visDefaultStyle: { width: 120, height: 160 },
            vis2: true,
            visAttrs: [
                {
                    name: 'common',
                    label: 'general',
                    fields: [
                        { name: 'ueberschrift', label: 'heading', type: 'text', default: '' },
                        { name: 'showName', label: 'show_heading', type: 'checkbox', default: false },
                        {
                            name: 'namePosition', label: 'heading_position', type: 'select',
                            options: [{ value: 'top', label: 'pos_top' }, { value: 'bottom', label: 'pos_bottom' }],
                            default: 'bottom',
                        },
                        { name: 'iconScale', label: 'icon_size_pct', type: 'number', default: 80 },
                        {
                            name: 'griff', label: 'handle', type: 'select',
                            options: [{ value: 'links', label: 'handle_left' }, { value: 'rechts', label: 'handle_right' }],
                            default: 'links',
                        },
                        { name: 'iconFarbe', label: 'icon_color', type: 'color', default: '#13c540' },
                    ],
                },
                {
                    name: 'ids',
                    label: 'data_points',
                    fields: [
                        { name: 'oid_kontakt', label: 'oid_contact', type: 'id', default: '' },
                        { name: 'oid_kontakt_inv', label: 'invert_contact', type: 'checkbox', default: false },
                        { name: 'oid_rollo', label: 'oid_blind_pos', type: 'id', default: '' },
                        { name: 'oid_rollo_inv', label: 'invert_blind', type: 'checkbox', default: false },
                        { name: 'oid_modus', label: 'oid_mode', type: 'id', default: '' },
                        { name: 'oid_modus_inv', label: 'invert_mode', type: 'checkbox', default: false },
                    ],
                },
            ],
            visPrev: 'widgets/vis-2-widgets-technic/img/prev-fenster-normal.png',
        };
    }

    getWidgetInfo() { return FensterWand.getWidgetInfo(); }

    constructor(props) {
        super(props);
        this.svgRef  = React.createRef();
        this.menuRef = React.createRef();
        this._maskId = `mask_fn_${Math.random().toString(36).slice(2, 7)}`;
        this.state   = { ...this.state, menuOpen: false, menuX: 0, menuY: 0 };
    }

    propertiesUpdate() {}

    componentDidMount() {
        super.componentDidMount();
        document.addEventListener('click', this._closeMenu);
    }

    componentWillUnmount() {
        super.componentWillUnmount && super.componentWillUnmount();
        document.removeEventListener('click', this._closeMenu);
    }

    onRxDataChanged()  { this.propertiesUpdate(); }
    onRxStyleChanged() {}
    onStateUpdated()   {}

    _getIconSize() {
        const pad = 4, gap = 3;
        const w   = parseInt(this.state.rxStyle?.width)  || 120;
        const h   = parseInt(this.state.rxStyle?.height) || 160;
        const { showName, ueberschrift } = this.state.rxData;
        const fs  = parseInt(this.state.rxStyle?.['font-size'] ?? this.state.rxStyle?.fontSize) || 12;
        const nameH = (showName && ueberschrift) ? Math.ceil(fs * 1.4) + gap : 0;
        const scale = Math.max(10, Math.min(100, parseInt(this.state.rxData.iconScale) || 80));
        return Math.max(20, Math.round(Math.min(w - pad * 2, h - pad * 2 - nameH) * scale / 100));
    }

    _getRolloVal() {
        const oid = this.state.rxData.oid_rollo;
        if (!oid) return 0;
        const raw = Math.round(parseFloat(this.state.values[`${oid}.val`]) || 0);
        return this.state.rxData.oid_rollo_inv ? (100 - raw) : raw;
    }

    _getKontaktVal() {
        const oid = this.state.rxData.oid_kontakt;
        if (!oid) return false;
        const raw = !!this.state.values[`${oid}.val`];
        return this.state.rxData.oid_kontakt_inv ? !raw : raw;
    }

    _getModusVal() {
        const oid = this.state.rxData.oid_modus;
        if (!oid) return null;
        const raw = !!this.state.values[`${oid}.val`];
        return this.state.rxData.oid_modus_inv ? !raw : raw;
    }

    _setRollo(val) {
        const oid = this.state.rxData.oid_rollo;
        if (!oid || this.props.editMode) return;
        const write = this.state.rxData.oid_rollo_inv ? (100 - val) : val;
        this.props.context.setValue(oid, write);
    }

    _setModus(isHand) {
        const oid = this.state.rxData.oid_modus;
        if (!oid || this.props.editMode) return;
        const write = this.state.rxData.oid_modus_inv ? !isHand : isHand;
        this.props.context.setValue(oid, write);
    }

    _closeMenu = (e) => {
        if (this.menuRef.current && !this.menuRef.current.contains(e?.target))
            this.setState({ menuOpen: false });
    };

    _onSvgClick = (e) => {
        if (this.props.editMode) return;
        if (!this.state.rxData.oid_rollo && !this.state.rxData.oid_modus) return;
        e.stopPropagation();
        this.setState({ menuOpen: true, menuX: e.clientX, menuY: e.clientY });
    };

    _drawSVG() {
        if (!this.svgRef.current) return;
        const svg     = this.svgRef.current;
        const rxData  = this.state.rxData;
        const griff   = rxData.griff || 'links';
        const offen   = this._getKontaktVal();
        const pct     = this._getRolloVal();
        const rahmenf = rxData.iconFarbe || '#13c540';
        const typ     = griff === 'links' ? (offen ? 'LA' : 'LZ') : (offen ? 'RA' : 'RZ');
        const modus   = this._getModusVal();
        const hasModus = !!rxData.oid_modus;

        // Fenster zeichnen
        DRAW[typ](svg, pct, rahmenf, this._maskId);

        // Icon ins SVG zeichnen (unten links)
        if (hasModus) {
            if (modus === true) {
                drawIconHand(svg, 30, 195, 14, rahmenf);
            } else {
                drawIconAuto(svg, 30, 195, 14, rahmenf);
            }

            // Click-Handler auf Icon
            const icon = svg.querySelector('.mode-icon');
            if (icon && !this.props.editMode) {
                icon.style.cursor = 'pointer';
                icon._clickHandler = (e) => {
                    e.stopPropagation();
                    this._setModus(!modus);
                };
                icon.addEventListener('click', icon._clickHandler);
            }
        }
    }

    renderWidgetBody(props) {
        super.renderWidgetBody(props);
        setTimeout(() => this._drawSVG(), 0);

        const rxData       = this.state.rxData;
        const showName     = rxData.showName && rxData.ueberschrift;
        const namePosition = rxData.namePosition || 'bottom';
        const hasModus     = !!rxData.oid_modus;
        const hasRollo = !!rxData.oid_rollo;
        const iconPx = this._getIconSize();
        const modus    = this._getModusVal();
        const rolloVal = this._getRolloVal();
        const rahmenf  = rxData.iconFarbe || '#13c540';
        const { menuOpen, menuX, menuY } = this.state;

        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', boxSizing: 'border-box', padding: 4 }}>

                {/* Name oben */}
                {namePosition === 'top' && showName && (
                    <div style={{
                        fontSize:     this.state.rxStyle?.['font-size'] || this.state.rxStyle?.fontSize || 12,
                        color:        this.state.rxStyle?.color || '#c8e6e3',
                        fontWeight:   this.state.rxStyle?.['font-weight'] || this.state.rxStyle?.fontWeight || 400,
                        marginBottom: 3,
                        textAlign:    'center',
                        width:        '100%',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                    }}>
                        {rxData.ueberschrift}
                    </div>
                )}

                {/* SVG Fenster */}
                <div
                    style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (hasRollo || hasModus) && !this.props.editMode ? 'pointer' : 'default' }}
                    onClick={this._onSvgClick}
                >
                    <div style={{ width: iconPx, height: iconPx }}>
                        <svg
                            ref={this.svgRef}
                            viewBox={VIEWBOX}
                            style={{ width: '100%', height: '100%', overflow: 'hidden' }}
                            preserveAspectRatio="xMidYMid meet"
                        />
                    </div>
                </div>

                {/* Name unten */}
                {(namePosition === 'bottom' || !namePosition) && showName && (
                    <div style={{
                        fontSize:     this.state.rxStyle?.['font-size'] || this.state.rxStyle?.fontSize || 12,
                        color:        this.state.rxStyle?.color || '#c8e6e3',
                        fontWeight:   this.state.rxStyle?.['font-weight'] || this.state.rxStyle?.fontWeight || 400,
                        marginTop:    3,
                        textAlign:    'center',
                        width:        '100%',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                    }}>
                        {rxData.ueberschrift}
                    </div>
                )}

                {/* Kontextmenü */}
                {menuOpen && (
                    <div
                        ref={this.menuRef}
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'fixed',
                            left: menuX + 8,
                            top: menuY + 8,
                            background: '#161c24',
                            border: `1.5px solid ${rahmenf}`,
                            borderRadius: 10,
                            padding: '8px 0',
                            zIndex: 99999,
                            minWidth: 200,
                            boxShadow: '0 6px 28px rgba(0,0,0,0.6)',
                        }}
                    >
                        {hasRollo && (<>
                            <div
                                style={{ padding: '8px 16px', fontSize: 13, color: rolloVal === 100 ? rahmenf : '#c8e6e3', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontWeight: rolloVal === 100 ? 600 : 400 }}
                                onMouseEnter={e => e.currentTarget.style.background = '#1e2a2a'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                onClick={() => { this._setRollo(100); this.setState({ menuOpen: false }); }}
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,1 13,11 1,11" fill={rahmenf}/></svg>
                                Open
                            </div>
                            <div
                                style={{ padding: '8px 16px', fontSize: 13, color: rolloVal === 0 ? rahmenf : '#c8e6e3', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontWeight: rolloVal === 0 ? 600 : 400 }}
                                onMouseEnter={e => e.currentTarget.style.background = '#1e2a2a'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                onClick={() => { this._setRollo(0); this.setState({ menuOpen: false }); }}
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,13 13,3 1,3" fill={rahmenf}/></svg>
                                Close
                            </div>

                            <div style={{ height: 1, background: `${rahmenf}33`, margin: '4px 10px' }} />

                            <div style={{ padding: '4px 16px 8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: 11, color: '#5a7a78' }}>Position</span>
                                    <span style={{ fontSize: 13, color: rahmenf, fontWeight: 700 }}>{rolloVal}%</span>
                                </div>
                                <input
                                    type="range" min={0} max={100} step={1} value={rolloVal}
                                    style={{ width: '100%', accentColor: rahmenf, cursor: 'pointer' }}
                                    onChange={e => this._setRollo(parseInt(e.target.value))}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                                    <span style={{ fontSize: 10, color: '#5a7a78' }}>Close</span>
                                    <span style={{ fontSize: 10, color: '#5a7a78' }}>Open</span>
                                </div>
                                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                                    {[0, 25, 50, 75, 100].map(v => (
                                        <button key={v} onClick={() => this._setRollo(v)}
                                            style={{
                                                flex: 1, padding: '3px 0', fontSize: 10, cursor: 'pointer',
                                                background: rolloVal === v ? rahmenf : '#1e2a2a',
                                                color: rolloVal === v ? '#0d1820' : '#c8e6e3',
                                                border: `1px solid ${rahmenf}55`, borderRadius: 4,
                                            }}
                                        >{v}%</button>
                                    ))}
                                </div>
                            </div>
                        </>)}

                        {hasModus && (<>
                            {hasRollo && <div style={{ height: 1, background: `${rahmenf}33`, margin: '4px 10px' }} />}
                            <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ fontSize: 12, color: modus === false ? rahmenf : '#5a7a78', fontWeight: modus === false ? 600 : 400 }}>Auto</span>
                                <div
                                    onClick={() => this._setModus(!modus)}
                                    style={{ width: 44, height: 24, borderRadius: 12, background: '#1e2a2a', border: `1.5px solid ${rahmenf}`, position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                                >
                                    <div style={{
                                        width: 18, height: 18, borderRadius: 9,
                                        background: rahmenf,
                                        position: 'absolute', top: 2,
                                        left: modus ? 22 : 2,
                                        transition: 'left 0.2s',
                                    }} />
                                </div>
                                <span style={{ fontSize: 12, color: modus === true ? rahmenf : '#5a7a78', fontWeight: modus === true ? 600 : 400 }}>Manual</span>
                            </div>
                        </>)}
                    </div>
                )}
            </div>
        );
    }
}

export default FensterWand;
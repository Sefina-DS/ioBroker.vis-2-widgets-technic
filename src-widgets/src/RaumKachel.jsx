import React from 'react';
import { I18n } from '@iobroker/adapter-react-v5';
import translations from './translations.js';

I18n.extendTranslations(translations);

// ═══════════════════════════════════════════════════════
//  WIDGET KLASSE
// ═══════════════════════════════════════════════════════
class RaumKachel extends window.visRxWidget {
    static getWidgetInfo() {
        return {
            id: 'tplTechnicRaumKachel',
            visSet: 'vis-2-widgets-technic',
            visSetLabel: 'Technic Widgets',
            visSetColor: '#2ecfbf',
            visWidgetColor: '#0d1820',
            visName: 'Room Tile',
            visWidgetLabel: 'Room Tile',
            visDefaultStyle: { width: 160, height: 100 },
            vis2: true,
            visAttrs: [
                {
                    name: 'common',
                    label: 'general',
                    fields: [
                        { name: 'roomName', label: 'room_name', type: 'text', default: '' },
                        { name: 'nameColor', label: 'name_color', type: 'color', default: '#e8f4f3' },
                        { name: 'nameFontSize', label: 'name_font_size', type: 'number', default: 14 },
                        { name: 'nameBold', label: 'name_bold', type: 'checkbox', default: false },
                        {
                            name: 'nameAlign', label: 'name_align', type: 'select',
                            options: [
                                { value: 'left',   label: 'align_left' },
                                { value: 'center', label: 'align_center' },
                                { value: 'right',  label: 'align_right' },
                            ],
                            default: 'left',
                        },
                        {
                            name: 'nameVerticalAlign', label: 'name_valign', type: 'select',
                            options: [
                                { value: 'top',    label: 'valign_top' },
                                { value: 'middle', label: 'valign_middle' },
                                { value: 'bottom', label: 'valign_bottom' },
                            ],
                            default: 'top',
                        },
                        { name: 'paddingTop', label: 'padding_top', type: 'number', default: 8 },
                        { name: 'paddingRight', label: 'padding_right', type: 'number', default: 8 },
                        { name: 'paddingBottom', label: 'padding_bottom', type: 'number', default: 8 },
                        { name: 'paddingLeft', label: 'padding_left', type: 'number', default: 8 },
                    ],
                },
                {
                    name: 'rows',
                    label: 'rows_group',
                    fields: [
                        { name: 'rowCount', label: 'row_count', type: 'number', min: 0, max: 10, default: 0 },
                        { name: 'rowFontSize', label: 'row_font_size', type: 'number', default: 13 },
                        { name: 'rowLabelColor', label: 'row_label_color', type: 'color', default: '#c8e6e3' },
                    ],
                },
                {
                    name: 'row',
                    label: 'status_row',
                    indexFrom: 1,
                    indexTo: 'rowCount',
                    fields: [
                        { name: 'rowLabel', label: 'row_label', type: 'text', default: '' },
                        { name: 'oid', label: 'row_oid', type: 'id' },
                        {
                            name: 'valueType', label: 'row_value_type', type: 'select',
                            options: [
                                { value: 'number', label: 'row_type_number' },
                                { value: 'bool',   label: 'row_type_bool' },
                            ],
                            default: 'number',
                        },
                        {
                            name: 'unit', label: 'row_unit', type: 'text', default: '',
                            hidden: (data, index) => data[`valueType${index}`] !== 'number',
                        },
                        {
                            name: 'decimals', label: 'row_decimals', type: 'number', default: 1,
                            hidden: (data, index) => data[`valueType${index}`] !== 'number',
                        },
                        {
                            name: 'numberColor', label: 'row_number_color', type: 'color', default: '#c8e6e3',
                            hidden: (data, index) => data[`valueType${index}`] !== 'number',
                        },
                        {
                            name: 'trueText', label: 'row_true_text', type: 'text', default: '',
                            hidden: (data, index) => data[`valueType${index}`] !== 'bool',
                        },
                        {
                            name: 'trueColor', label: 'row_true_color', type: 'color', default: '#c8e6e3',
                            hidden: (data, index) => data[`valueType${index}`] !== 'bool',
                        },
                        {
                            name: 'falseText', label: 'row_false_text', type: 'text', default: '',
                            hidden: (data, index) => data[`valueType${index}`] !== 'bool',
                        },
                        {
                            name: 'falseColor', label: 'row_false_color', type: 'color', default: '#c8e6e3',
                            hidden: (data, index) => data[`valueType${index}`] !== 'bool',
                        },
                        {
                            name: 'oidsExtra', label: 'row_oids_extra', type: 'text', default: '',
                            hidden: (data, index) => data[`valueType${index}`] !== 'bool',
                        },
                        {
                            name: 'logic', label: 'row_logic', type: 'select',
                            options: [
                                { value: 'and', label: 'logic_and' },
                                { value: 'or',  label: 'logic_or' },
                            ],
                            default: 'and',
                            hidden: (data, index) => data[`valueType${index}`] !== 'bool' || !data[`oidsExtra${index}`],
                        },
                    ],
                },
                {
                    name: 'click',
                    label: 'click_group',
                    fields: [
                        {
                            name: 'clickMode', label: 'click_mode', type: 'select',
                            options: [
                                { value: 'popup',      label: 'click_mode_popup' },
                                { value: 'switchView', label: 'click_mode_switch_view' },
                            ],
                            default: 'popup',
                        },
                        { name: 'targetView', label: 'target_view', type: 'text', default: '' },
                        {
                            name: 'popupWidth', label: 'popup_width', type: 'number', default: 800,
                            hidden: data => (data.clickMode || 'popup') !== 'popup',
                        },
                        {
                            name: 'popupHeight', label: 'popup_height', type: 'number', default: 600,
                            hidden: data => (data.clickMode || 'popup') !== 'popup',
                        },
                        {
                            name: 'popupUseOffset', label: 'popup_use_offset', type: 'checkbox', default: false,
                            hidden: data => (data.clickMode || 'popup') !== 'popup',
                        },
                        {
                            name: 'popupOffsetX', label: 'popup_offset_x', type: 'number',
                            hidden: data => (data.clickMode || 'popup') !== 'popup' || !data.popupUseOffset,
                        },
                        {
                            name: 'popupOffsetY', label: 'popup_offset_y', type: 'number',
                            hidden: data => (data.clickMode || 'popup') !== 'popup' || !data.popupUseOffset,
                        },
                        {
                            name: 'closeOnOutsideClick', label: 'close_on_outside_click', type: 'checkbox', default: true,
                            hidden: data => (data.clickMode || 'popup') !== 'popup',
                        },
                        {
                            name: 'showCloseButton', label: 'show_close_button', type: 'checkbox', default: true,
                            hidden: data => (data.clickMode || 'popup') !== 'popup',
                        },
                        {
                            name: 'autoCloseSeconds', label: 'auto_close_seconds', type: 'number', default: 0,
                            hidden: data => (data.clickMode || 'popup') !== 'popup',
                        },
                        {
                            name: 'popupBackgroundColor', label: 'popup_background_color', type: 'color', default: '#0d1820',
                            hidden: data => (data.clickMode || 'popup') !== 'popup',
                        },
                        {
                            name: 'popupBorderColor', label: 'popup_border_color', type: 'color', default: '#2ecfbf',
                            hidden: data => (data.clickMode || 'popup') !== 'popup',
                        },
                        {
                            name: 'popupBorderWidth', label: 'popup_border_width', type: 'number', default: 1,
                            hidden: data => (data.clickMode || 'popup') !== 'popup',
                        },
                        {
                            name: 'popupBorderRadius', label: 'popup_border_radius', type: 'number', default: 8,
                            hidden: data => (data.clickMode || 'popup') !== 'popup',
                        },
                    ],
                },
            ],
        };
    }

    getWidgetInfo() { return RaumKachel.getWidgetInfo(); }

    constructor(props) {
        super(props);
        // oidsExtra ist ein Freitextfeld -> vis2 subscribed diese oids NICHT automatisch
        // (nur 'id'-Feldtypen werden von der Basisklasse erkannt). Wir subscriben sie
        // manuell ueber context.socket und halten die Werte separat in extraValues.
        this.state = { ...this.state, extraValues: {}, popupOpen: false };
        this._extraSubscribed = [];
        this._onExtraStateChange = this._onExtraStateChange.bind(this);
        this._autoCloseTimer = null;
    }

    // Alle in oidsExtra referenzierten oids (ueber alle Bool-Zeilen) einsammeln.
    _getExtraOids() {
        const rowCount = parseInt(this.state.rxData.rowCount, 10) || 0;
        const oids = new Set();
        for (let i = 1; i <= rowCount; i++) {
            if ((this.state.rxData[`valueType${i}`] || 'number') !== 'bool') continue;
            String(this.state.rxData[`oidsExtra${i}`] || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
                .forEach(o => oids.add(o));
        }
        return Array.from(oids);
    }

    _onExtraStateChange(id, state) {
        this.setState({ extraValues: { ...this.state.extraValues, [id]: state ? state.val : null } });
    }

    // Subscription an die aktuell benoetigten Zusatz-oids angleichen (Diff aus
    // vorherigem Stand), analog zum internen Subscribe-Pattern der Basisklasse
    // (this.props.context.socket.subscribeState/unsubscribeState).
    _syncExtraSubscriptions() {
        const wanted = this._getExtraOids();
        const toRemove = this._extraSubscribed.filter(o => !wanted.includes(o));
        const toAdd = wanted.filter(o => !this._extraSubscribed.includes(o));
        if (toRemove.length) {
            this.props.context.socket.unsubscribeState(toRemove, this._onExtraStateChange);
        }
        if (toAdd.length) {
            this.props.context.socket.subscribeState(toAdd, this._onExtraStateChange);
        }
        this._extraSubscribed = wanted;
    }

    componentDidMount() {
        super.componentDidMount();
        this._syncExtraSubscriptions();
    }

    componentWillUnmount() {
        if (this._extraSubscribed.length) {
            this.props.context.socket.unsubscribeState(this._extraSubscribed, this._onExtraStateChange);
        }
        if (this._autoCloseTimer) {
            clearTimeout(this._autoCloseTimer);
            this._autoCloseTimer = null;
        }
        super.componentWillUnmount();
    }

    propertiesUpdate() { this._syncExtraSubscriptions(); }
    onRxDataChanged()  { this.propertiesUpdate(); }
    onRxStyleChanged() {}
    onStateUpdated()   {}

    // clickMode "popup": eigenes Popup mit iframe auf die Ziel-View.
    // clickMode "switchView": echter VIS2-View-Wechsel ueber die reale, im
    // installierten @iobroker/types-vis-2 (VisContext) dokumentierte und im
    // vis-2-Kernbundle vielfach verwendete API this.props.context.changeView(view) -
    // exakt das, was offizielle vis2-Basiswidgets (z.B. Navigations-Menu, "nav_view"-
    // Button, Swipe-Widget) fuer Klick-basierte View-Wechsel selbst nutzen.
    _onTileClick() {
        if (this.props.editMode) return;
        const targetView = this.state.rxData.targetView;
        if (!targetView) return;

        const clickMode = this.state.rxData.clickMode || 'popup';
        if (clickMode === 'switchView') {
            this.props.context.changeView(targetView);
            return;
        }
        this._openPopup();
    }

    _openPopup() {
        if (this._autoCloseTimer) {
            clearTimeout(this._autoCloseTimer);
            this._autoCloseTimer = null;
        }
        this.setState({ popupOpen: true });
        const autoCloseSeconds = parseInt(this.state.rxData.autoCloseSeconds, 10) || 0;
        if (autoCloseSeconds > 0) {
            this._autoCloseTimer = setTimeout(() => this._closePopup(), autoCloseSeconds * 1000);
        }
    }

    _closePopup() {
        if (this._autoCloseTimer) {
            clearTimeout(this._autoCloseTimer);
            this._autoCloseTimer = null;
        }
        this.setState({ popupOpen: false });
    }

    _renderPopup() {
        const {
            targetView,
            popupWidth = 800,
            popupHeight = 600,
            popupUseOffset = false,
            popupOffsetX = 0,
            popupOffsetY = 0,
            closeOnOutsideClick = true,
            showCloseButton = true,
            popupBackgroundColor = '#0d1820',
            popupBorderColor = '#2ecfbf',
            popupBorderWidth = 1,
            popupBorderRadius = 8,
        } = this.state.rxData;

        // Explizites Kontrollkaestchen statt Ableitung aus dem Zahlenwert der
        // Offset-Felder: ein leeres Zahlenfeld liefert je nach Interaktion
        // undefined ODER '' (verifiziert im vis2-Editor-Bundle, niemals 0),
        // beides waere als "kein Offset" nicht eindeutig von einem bewusst
        // gesetzten Offset 0/0 unterscheidbar. popupUseOffset macht die Absicht
        // explizit statt sie zu erraten.
        const posStyle = popupUseOffset
            ? { top: `${popupOffsetY}px`, left: `${popupOffsetX}px`, transform: 'none' }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

        // Gleiches Muster wie das bisherige globale openModal()-Skript:
        // .../vis-2/index.html#{targetView}. Pfad wird relativ zur aktuellen
        // Seite ermittelt statt hart codiert, damit es unabhaengig vom
        // tatsaechlichen Deployment-Unterpfad funktioniert.
        const path = window.location.pathname.replace(/[^/]*$/, 'index.html');
        const src = `${window.location.origin}${path}#${targetView}`;

        // Ziel-View-Konfiguration ist bereits client-seitig geladen (this.props.context.views
        // enthaelt ALLE Views des Projekts, nicht nur die aktive - gleiches Zugriffsmuster wie
        // im offiziellen vis2-Navigations-Menu-Widget: context.views[viewName].settings.sizex/
        // sizey/limitScreen). Kein Extra-Request noetig.
        // Ist limitScreen aktiv und sizex/sizey gesetzt, bekommt das iframe exakt diese Groesse
        // und wird im Popup zentriert - so wird die View nie groesser/kleiner dargestellt als
        // sie tatsaechlich konfiguriert ist (Ursache des vorherigen Letterboxing-Problems).
        const targetSettings = this.props.context.views?.[targetView]?.settings;
        const viewSizeX = parseInt(targetSettings?.sizex, 10);
        const viewSizeY = parseInt(targetSettings?.sizey, 10);
        const hasFixedViewSize = !!targetSettings?.limitScreen
            && !Number.isNaN(viewSizeX) && viewSizeX > 0
            && !Number.isNaN(viewSizeY) && viewSizeY > 0;

        const iframeStyle = hasFixedViewSize
            ? { width: `${viewSizeX}px`, height: `${viewSizeY}px`, border: 'none', flexShrink: 0 }
            : { width: '100%', height: '100%', border: 'none' };

        return (
            <div
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.4)', zIndex: 10000,
                }}
                onClick={closeOnOutsideClick ? () => this._closePopup() : undefined}
            >
                <div
                    style={{
                        position: 'fixed',
                        ...posStyle,
                        width: `${popupWidth}px`, height: `${popupHeight}px`,
                        background: popupBackgroundColor,
                        border: `${popupBorderWidth}px solid ${popupBorderColor}`,
                        borderRadius: `${popupBorderRadius}px`,
                        overflow: 'hidden',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                        boxSizing: 'border-box',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {showCloseButton && (
                        <button
                            onClick={() => this._closePopup()}
                            style={{
                                position: 'absolute', top: 4, right: 4, zIndex: 1,
                                width: 28, height: 28, borderRadius: '50%', border: 'none',
                                background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer',
                                fontSize: 16, lineHeight: '28px', padding: 0,
                            }}
                        >
                            ×
                        </button>
                    )}
                    <div
                        style={{
                            width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        <iframe
                            src={src}
                            title={targetView}
                            style={iframeStyle}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Boolean lesen (alle Varianten abdecken, LEARNINGS.md #21)
    _isTrue(val) {
        return val === true || val === 'true' || val === 1 || val === '1';
    }

    _formatNumber(val, decimals, unit) {
        if (val === null || val === undefined || val === '') return '–';
        const num = Number(val);
        if (Number.isNaN(num)) return '–';
        return `${num.toFixed(decimals)}${unit ? ` ${unit}` : ''}`;
    }

    // Mehrere oids (oid + oidsExtra, kommagetrennt) einzeln auswerten und über
    // logic (and/or) zu einem Bool-Ergebnis verknuepfen. oid kommt aus dem
    // regulaeren vis2-Subscribe (this.state.values), die oidsExtra-oids aus der
    // manuellen Subscription (this.state.extraValues, siehe _syncExtraSubscriptions).
    _isTrueCombined(oid, oidsExtra, logic) {
        const extraOids = String(oidsExtra || '').split(',').map(s => s.trim()).filter(Boolean);
        const results = [
            this._isTrue(this.state.values[`${oid}.val`]),
            ...extraOids.map(o => this._isTrue(this.state.extraValues[o])),
        ];
        return logic === 'or' ? results.some(Boolean) : results.every(Boolean);
    }

    _renderRows(rowCount, rowFontSize, rowLabelColor) {
        const rows = [];
        for (let i = 1; i <= rowCount; i++) {
            const oid = this.state.rxData[`oid${i}`];
            if (!oid) continue;

            const rowLabel = this.state.rxData[`rowLabel${i}`] || '';
            const valueType = this.state.rxData[`valueType${i}`] || 'number';

            let text;
            let color;
            if (valueType === 'bool') {
                const oidsExtra = this.state.rxData[`oidsExtra${i}`];
                const logic = this.state.rxData[`logic${i}`] || 'and';
                const isTrue = this._isTrueCombined(oid, oidsExtra, logic);
                text = isTrue
                    ? (this.state.rxData[`trueText${i}`] || '')
                    : (this.state.rxData[`falseText${i}`] || '');
                color = isTrue
                    ? (this.state.rxData[`trueColor${i}`] || '#c8e6e3')
                    : (this.state.rxData[`falseColor${i}`] || '#c8e6e3');
            } else {
                const val = this.state.values[`${oid}.val`];
                const decimalsRaw = parseInt(this.state.rxData[`decimals${i}`], 10);
                const decimals = Number.isNaN(decimalsRaw) ? 1 : decimalsRaw;
                const unit = this.state.rxData[`unit${i}`] || '';
                text = this._formatNumber(val, decimals, unit);
                color = this.state.rxData[`numberColor${i}`] || '#c8e6e3';
            }

            rows.push(
                <div
                    key={i}
                    style={{
                        display: 'flex', flexDirection: 'row',
                        justifyContent: 'space-between', alignItems: 'baseline',
                        gap: 4, width: '100%', fontSize: `${rowFontSize}px`,
                    }}
                >
                    <div
                        style={{
                            color: rowLabelColor,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            minWidth: 0, flex: '1 1 auto', textAlign: 'left',
                        }}
                    >
                        {rowLabel}
                    </div>
                    <div
                        style={{
                            color,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            flex: '0 0 auto', maxWidth: '60%', textAlign: 'right',
                        }}
                    >
                        {text}
                    </div>
                </div>,
            );
        }
        return rows;
    }

    renderWidgetBody(props) {
        super.renderWidgetBody(props);

        const {
            roomName = '',
            nameColor = '#e8f4f3',
            nameFontSize = 14,
            nameBold = false,
            nameAlign = 'left',
            nameVerticalAlign = 'top',
            paddingTop = 8,
            paddingRight = 8,
            paddingBottom = 8,
            paddingLeft = 8,
        } = this.state.rxData;

        const rowCount = parseInt(this.state.rxData.rowCount, 10) || 0;
        const rowFontSizeRaw = parseInt(this.state.rxData.rowFontSize, 10);
        const rowFontSize = Number.isNaN(rowFontSizeRaw) ? 13 : rowFontSizeRaw;
        const rowLabelColor = this.state.rxData.rowLabelColor || '#c8e6e3';
        const rowEls = rowCount > 0 ? this._renderRows(rowCount, rowFontSize, rowLabelColor) : null;

        const justifyContent = { left: 'flex-start', center: 'center', right: 'flex-end' }[nameAlign] || 'flex-start';
        const alignItems = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[nameVerticalAlign] || 'flex-start';

        return (
            <div
                onClick={() => this._onTileClick()}
                style={{
                    width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column',
                    boxSizing: 'border-box',
                    paddingTop: `${paddingTop}px`,
                    paddingRight: `${paddingRight}px`,
                    paddingBottom: `${paddingBottom}px`,
                    paddingLeft: `${paddingLeft}px`,
                    gap: 2,
                    cursor: this.props.editMode ? 'default' : 'pointer',
                    userSelect: 'none',
                }}
            >
                <div
                    style={{
                        display: 'flex', flexDirection: 'row',
                        justifyContent, alignItems,
                        flex: rowCount > 0 ? '0 0 auto' : 1,
                        minHeight: 0,
                    }}
                >
                    <div
                        style={{
                            color: nameColor,
                            fontSize: `${nameFontSize}px`,
                            fontWeight: nameBold ? 700 : 400,
                            textAlign: nameAlign,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                        }}
                    >
                        {roomName}
                    </div>
                </div>
                {rowCount > 0 && (
                    <div
                        style={{
                            display: 'flex', flexDirection: 'column',
                            flex: 1, minHeight: 0,
                            justifyContent: 'center', gap: 2,
                            overflow: 'hidden',
                        }}
                    >
                        {rowEls}
                    </div>
                )}
                {this.state.popupOpen && this._renderPopup()}
            </div>
        );
    }
}

export default RaumKachel;

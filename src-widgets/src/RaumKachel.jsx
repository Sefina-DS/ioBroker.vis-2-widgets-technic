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
                        { name: 'name', label: 'room_name', type: 'text', default: '' },
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
            ],
        };
    }

    getWidgetInfo() { return RaumKachel.getWidgetInfo(); }

    constructor(props) {
        super(props);
        // oidsExtra ist ein Freitextfeld -> vis2 subscribed diese oids NICHT automatisch
        // (nur 'id'-Feldtypen werden von der Basisklasse erkannt). Wir subscriben sie
        // manuell ueber context.socket und halten die Werte separat in extraValues.
        this.state = { ...this.state, extraValues: {} };
        this._extraSubscribed = [];
        this._onExtraStateChange = this._onExtraStateChange.bind(this);
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
        super.componentWillUnmount();
    }

    propertiesUpdate() { this._syncExtraSubscriptions(); }
    onRxDataChanged()  { this.propertiesUpdate(); }
    onRxStyleChanged() {}
    onStateUpdated()   {}

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

    _renderRows(rowCount, rowFontSize) {
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
                            color: '#c8e6e3',
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
            name = '',
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
        const rowEls = rowCount > 0 ? this._renderRows(rowCount, rowFontSize) : null;

        const justifyContent = { left: 'flex-start', center: 'center', right: 'flex-end' }[nameAlign] || 'flex-start';
        const alignItems = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[nameVerticalAlign] || 'flex-start';

        return (
            <div
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
                        {name}
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
            </div>
        );
    }
}

export default RaumKachel;

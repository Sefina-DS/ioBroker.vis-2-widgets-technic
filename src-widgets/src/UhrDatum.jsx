import React from 'react';

const WEEKDAYS_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS_DE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function pad2(n) {
    return n < 10 ? `0${n}` : `${n}`;
}

class UhrDatum extends window.visRxWidget {
    constructor(props) {
        super(props);
        this.state = { ...this.state, now: new Date() };
    }

    static getWidgetInfo() {
        return {
            id: 'tplTechnicUhrDatum',
            visSet: 'vis-2-widgets-technic',
            visSetLabel: 'Technic Widgets',
            visSetColor: '#2ecfbf',
            visWidgetColor: '#0d1820',
            visName: 'Uhr & Datum',
            visPrev: 'widgets/vis-2-widgets-technic/img/prev-uhr-datum.png',
            visDefaultStyle: { width: 260, height: 90 },
            vis2: true,
            visAttrs: [
                {
                    name: 'common',
                    label: 'Allgemein',
                    fields: [
                        { name: 'layout', label: 'Layout', type: 'select', default: 'row',
                          options: [
                              { value: 'row', label: 'Nebeneinander' },
                              { value: 'column', label: 'Untereinander' },
                          ] },
                        { name: 'align', label: 'Ausrichtung', type: 'select', default: 'left',
                          options: [
                              { value: 'left', label: 'Links' },
                              { value: 'center', label: 'Zentriert' },
                              { value: 'right', label: 'Rechts' },
                          ] },
                        { name: 'gap', label: 'Abstand (px)', type: 'number', default: 14 },
                        { name: 'colorBg', label: 'Hintergrund', type: 'color', default: '' },
                        { name: 'borderRadius', label: 'Eckenradius (px)', type: 'number', default: 0 },
                        { name: 'padding', label: 'Innenabstand (px)', type: 'number', default: 8 },
                    ],
                },
                {
                    name: 'time',
                    label: 'Uhrzeit',
                    fields: [
                        { name: 'showTime', label: 'Uhrzeit anzeigen', type: 'checkbox', default: true },
                        { name: 'timeFormat', label: 'Format', type: 'select', default: '24h',
                          options: [
                              { value: '24h', label: '24 Stunden' },
                              { value: '12h', label: '12 Stunden (AM/PM)' },
                          ] },
                        { name: 'showSeconds', label: 'Sekunden anzeigen', type: 'checkbox', default: false },
                        { name: 'timeColor', label: 'Farbe', type: 'color', default: '#2ecfbf' },
                        { name: 'timeFontSize', label: 'Schriftgröße (px)', type: 'number', default: 40 },
                        { name: 'timeBold', label: 'Fett', type: 'checkbox', default: true },
                    ],
                },
                {
                    name: 'date',
                    label: 'Datum',
                    fields: [
                        { name: 'showDate', label: 'Datum anzeigen', type: 'checkbox', default: true },
                        { name: 'showWeekday', label: 'Wochentag anzeigen', type: 'checkbox', default: true },
                        { name: 'showYear', label: 'Jahr anzeigen', type: 'checkbox', default: true },
                        { name: 'dateColor', label: 'Farbe', type: 'color', default: '#7a9490' },
                        { name: 'dateFontSize', label: 'Schriftgröße (px)', type: 'number', default: 15 },
                        { name: 'dateBold', label: 'Fett', type: 'checkbox', default: false },
                    ],
                },
            ],
        };
    }

    getWidgetInfo() {
        return UhrDatum.getWidgetInfo();
    }

    propertiesUpdate() {}
    onRxDataChanged() { this.propertiesUpdate(); }
    onRxStyleChanged() {}
    onStateUpdated() {}

    componentDidMount() {
        super.componentDidMount();
        this._timer = setInterval(() => this.setState({ now: new Date() }), 1000);
    }

    componentWillUnmount() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        if (super.componentWillUnmount) {
            super.componentWillUnmount();
        }
    }

    _formatTime(d) {
        const { rxData } = this.state;
        const showSeconds = rxData.showSeconds;
        let h = d.getHours();
        let suffix = '';
        if (rxData.timeFormat === '12h') {
            suffix = h >= 12 ? ' PM' : ' AM';
            h = h % 12;
            if (h === 0) h = 12;
        }
        const m = pad2(d.getMinutes());
        const s = pad2(d.getSeconds());
        const hh = rxData.timeFormat === '12h' ? h : pad2(h);
        return showSeconds ? `${hh}:${m}:${s}${suffix}` : `${hh}:${m}${suffix}`;
    }

    _formatDate(d) {
        const { rxData } = this.state;
        const parts = [];
        if (rxData.showWeekday) parts.push(`${WEEKDAYS_DE[d.getDay()]}.`);
        parts.push(`${d.getDate()}.`);
        parts.push(MONTHS_DE[d.getMonth()]);
        if (rxData.showYear) parts.push(`${d.getFullYear()}`);
        return parts.join(' ');
    }

    renderWidgetBody(props) {
        super.renderWidgetBody(props);
        const { rxData, now } = this.state;

        const timeEl = rxData.showTime !== false ? (
            <span style={{
                color: rxData.timeColor || '#2ecfbf',
                fontSize: `${rxData.timeFontSize || 40}px`,
                fontWeight: rxData.timeBold === false ? 400 : 700,
                lineHeight: 1,
                whiteSpace: 'nowrap',
            }}
            >
                {this._formatTime(now)}
            </span>
        ) : null;

        const dateEl = rxData.showDate !== false ? (
            <span style={{
                color: rxData.dateColor || '#7a9490',
                fontSize: `${rxData.dateFontSize || 15}px`,
                fontWeight: rxData.dateBold ? 700 : 400,
                whiteSpace: 'nowrap',
            }}
            >
                {this._formatDate(now)}
            </span>
        ) : null;

        const isColumn = rxData.layout === 'column';
        const justify = rxData.align === 'center' ? 'center' : (rxData.align === 'right' ? 'flex-end' : 'flex-start');

        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: isColumn ? 'column' : 'row',
                justifyContent: isColumn ? 'center' : justify,
                alignItems: isColumn ? justify : 'baseline',
                gap: `${rxData.gap ?? 14}px`,
                boxSizing: 'border-box',
                padding: `${rxData.padding ?? 8}px`,
                backgroundColor: rxData.colorBg || 'transparent',
                borderRadius: `${rxData.borderRadius || 0}px`,
            }}
            >
                {timeEl}
                {dateEl}
            </div>
        );
    }
}

export default UhrDatum;

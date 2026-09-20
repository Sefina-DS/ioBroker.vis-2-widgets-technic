import React from 'react';

const NAMES = {
    de: {
        weekdayShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        weekdayLong: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
        monthShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
        monthLong: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    },
    en: {
        weekdayShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        weekdayLong: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        monthShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        monthLong: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    },
    fr: {
        weekdayShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
        weekdayLong: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
        monthShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        monthLong: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    },
    es: {
        weekdayShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        weekdayLong: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        monthShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        monthLong: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    },
    it: {
        weekdayShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
        weekdayLong: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
        monthShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
        monthLong: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
    },
    nl: {
        weekdayShort: ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'],
        weekdayLong: ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'],
        monthShort: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
        monthLong: ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'],
    },
};

function pad2(n) {
    return n < 10 ? `0${n}` : `${n}`;
}

class ClockDate extends window.visRxWidget {
    constructor(props) {
        super(props);
        this.state = { ...this.state, now: new Date() };
    }

    static getWidgetInfo() {
        return {
            id: 'tplTechnicClockDate',
            visSet: 'vis-2-widgets-technic',
            visSetLabel: 'Technic Widgets',
            visSetColor: '#2ecfbf',
            visWidgetColor: '#0d1820',
            visName: 'Clock & Date',
            visPrev: 'widgets/vis-2-widgets-technic/img/prev-clockdate.png',
            visDefaultStyle: { width: 260, height: 90 },
            vis2: true,
            visAttrs: [
                {
                    name: 'common',
                    label: 'group_common',
                    fields: [
                        { name: 'layout', label: 'layout', type: 'select', default: 'row',
                          options: [
                              { value: 'row', label: 'layout_row' },
                              { value: 'column', label: 'layout_column' },
                          ] },
                        { name: 'align', label: 'align', type: 'select', default: 'left',
                          options: [
                              { value: 'left', label: 'align_left' },
                              { value: 'center', label: 'align_center' },
                              { value: 'right', label: 'align_right' },
                          ] },
                        { name: 'gap', label: 'gap', type: 'number', default: 14 },
                        { name: 'colorBg', label: 'colorBg', type: 'color', default: '' },
                        { name: 'borderRadius', label: 'borderRadius', type: 'number', default: 0 },
                        { name: 'padding', label: 'padding', type: 'number', default: 8 },
                    ],
                },
                {
                    name: 'time',
                    label: 'group_time',
                    fields: [
                        { name: 'showTime', label: 'clock_show', type: 'checkbox', default: true },
                        { name: 'timeFormat', label: 'clock_format', type: 'select', default: '24h',
                          options: [
                              { value: '24h', label: 'clock_format_24h' },
                              { value: '12h', label: 'clock_format_12h' },
                          ] },
                        { name: 'showSeconds', label: 'clock_showSeconds', type: 'checkbox', default: false },
                        { name: 'timeColor', label: 'color', type: 'color', default: '#2ecfbf' },
                        { name: 'timeFontSize', label: 'fontSize', type: 'number', default: 40 },
                        { name: 'timeBold', label: 'bold', type: 'checkbox', default: true },
                    ],
                },
                {
                    name: 'date',
                    label: 'group_date',
                    fields: [
                        { name: 'showDate', label: 'date_show', type: 'checkbox', default: true },
                        { name: 'language', label: 'date_language', type: 'select', default: 'de',
                          options: [
                              { value: 'de', label: 'Deutsch' },
                              { value: 'en', label: 'English' },
                              { value: 'fr', label: 'Français' },
                              { value: 'es', label: 'Español' },
                              { value: 'it', label: 'Italiano' },
                              { value: 'nl', label: 'Nederlands' },
                          ] },
                        { name: 'order', label: 'date_order', type: 'select', default: 'DMY',
                          options: [
                              { value: 'DMY', label: 'date_order_dmy' },
                              { value: 'MDY', label: 'date_order_mdy' },
                              { value: 'YMD', label: 'date_order_ymd' },
                          ] },
                        { name: 'separator', label: 'date_separator', type: 'select', default: '.',
                          options: [
                              { value: '.', label: 'date_sep_dot' },
                              { value: '-', label: 'date_sep_dash' },
                              { value: '/', label: 'date_sep_slash' },
                              { value: ' ', label: 'date_sep_space' },
                          ] },
                        { name: 'monthFormat', label: 'date_monthFormat', type: 'select', default: 'numeric',
                          options: [
                              { value: 'numeric', label: 'date_monthFormat_numeric' },
                              { value: 'short', label: 'date_monthFormat_short' },
                              { value: 'long', label: 'date_monthFormat_long' },
                          ] },
                        { name: 'yearFormat', label: 'date_yearFormat', type: 'select', default: 'full',
                          options: [
                              { value: 'full', label: 'date_yearFormat_full' },
                              { value: 'short', label: 'date_yearFormat_short' },
                          ] },
                        { name: 'leadingZeroDay', label: 'date_leadingZeroDay', type: 'checkbox', default: true },
                        { name: 'weekday', label: 'date_weekday', type: 'select', default: 'short',
                          options: [
                              { value: 'off', label: 'date_weekday_off' },
                              { value: 'short', label: 'date_weekday_short' },
                              { value: 'long', label: 'date_weekday_long' },
                          ] },
                        { name: 'dateColor', label: 'color', type: 'color', default: '#7a9490' },
                        { name: 'dateFontSize', label: 'fontSize', type: 'number', default: 15 },
                        { name: 'dateBold', label: 'bold', type: 'checkbox', default: false },
                    ],
                },
            ],
        };
    }

    getWidgetInfo() {
        return ClockDate.getWidgetInfo();
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
        return rxData.showSeconds ? `${hh}:${m}:${s}${suffix}` : `${hh}:${m}${suffix}`;
    }

    _formatDate(d) {
        const { rxData } = this.state;
        const names = NAMES[rxData.language] || NAMES.de;
        const sep = rxData.separator ?? '.';

        const dayNum = rxData.leadingZeroDay === false ? `${d.getDate()}` : pad2(d.getDate());

        let monthStr;
        if (rxData.monthFormat === 'long') monthStr = names.monthLong[d.getMonth()];
        else if (rxData.monthFormat === 'short') monthStr = names.monthShort[d.getMonth()];
        else monthStr = pad2(d.getMonth() + 1);

        const yearStr = rxData.yearFormat === 'short' ? `${d.getFullYear()}`.slice(-2) : `${d.getFullYear()}`;

        const order = rxData.order || 'DMY';
        let parts;
        if (order === 'MDY') parts = [monthStr, dayNum, yearStr];
        else if (order === 'YMD') parts = [yearStr, monthStr, dayNum];
        else parts = [dayNum, monthStr, yearStr];

        let result = parts.join(sep);

        if (rxData.weekday && rxData.weekday !== 'off') {
            const wd = rxData.weekday === 'long' ? names.weekdayLong[d.getDay()] : names.weekdayShort[d.getDay()];
            result = `${wd}${rxData.weekday === 'short' ? '.' : ','} ${result}`;
        }

        return result;
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

export default ClockDate;

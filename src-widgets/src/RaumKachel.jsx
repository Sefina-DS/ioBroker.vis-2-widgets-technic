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
                    ],
                },
            ],
        };
    }

    getWidgetInfo() { return RaumKachel.getWidgetInfo(); }

    constructor(props) {
        super(props);
    }

    propertiesUpdate() {}
    onRxDataChanged()  { this.propertiesUpdate(); }
    onRxStyleChanged() {}
    onStateUpdated()   {}

    renderWidgetBody(props) {
        super.renderWidgetBody(props);

        const {
            name = '',
            nameColor = '#e8f4f3',
            nameFontSize = 14,
            nameBold = false,
        } = this.state.rxData;

        return (
            <div
                style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxSizing: 'border-box', padding: 4,
                    cursor: this.props.editMode ? 'default' : 'pointer',
                    userSelect: 'none',
                }}
            >
                <div
                    style={{
                        color: nameColor,
                        fontSize: `${nameFontSize}px`,
                        fontWeight: nameBold ? 700 : 400,
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                    }}
                >
                    {name}
                </div>
            </div>
        );
    }
}

export default RaumKachel;

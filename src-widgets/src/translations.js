import { I18n } from '@iobroker/adapter-react-v5';
import langEn from './i18n/en.json';
import langDe from './i18n/de.json';
import langRu from './i18n/ru.json';
import langPt from './i18n/pt.json';
import langNl from './i18n/nl.json';
import langFr from './i18n/fr.json';
import langIt from './i18n/it.json';
import langEs from './i18n/es.json';
import langPl from './i18n/pl.json';
import langUk from './i18n/uk.json';
import langZh from './i18n/zh-cn.json';

// DEBUG: proof that this module was executed at runtime
window.__TECHNIC_TRANSLATIONS_LOADED__ = Date.now();

const translations = {
    en: langEn,
    de: langDe,
    ru: langRu,
    pt: langPt,
    nl: langNl,
    fr: langFr,
    it: langIt,
    es: langEs,
    pl: langPl,
    uk: langUk,
    'zh-cn': langZh,
};

window.__TECHNIC_TRANSLATIONS_CONTENT__ = JSON.stringify(translations);
window.__TECHNIC_I18N_INSTANCE__ = I18n;

try {
    I18n.extendTranslations(translations);
    window.__TECHNIC_I18N_RESULT__ = 'called, de.heading after call: ' +
        (I18n.translations && I18n.translations.de ? I18n.translations.de.heading : 'NO_TRANSLATIONS_OBJECT');
} catch (e) {
    window.__TECHNIC_I18N_RESULT__ = 'ERROR: ' + e.message;
}

export default translations;

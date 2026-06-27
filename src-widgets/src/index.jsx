import FensterWand from './FensterWand.jsx';
import SchalterBoolean from './SchalterBoolean.jsx';
import ReglerLicht from './ReglerLicht.jsx';

if (!window.visWidgets) {
    window.visWidgets = {};
}
window.visWidgets.FensterWand = FensterWand;
window.visWidgets.SchalterBoolean = SchalterBoolean;
window.visWidgets.ReglerLicht = ReglerLicht;

import FensterWand from './FensterWand.jsx';
import SchalterBoolean from './SchalterBoolean.jsx';
import ReglerLicht from './ReglerLicht.jsx';
import RaumKachel from './RaumKachel.jsx';
import ClockDate from './ClockDate.jsx';

if (!window.visWidgets) {
    window.visWidgets = {};
}
window.visWidgets.FensterWand = FensterWand;
window.visWidgets.SchalterBoolean = SchalterBoolean;
window.visWidgets.ReglerLicht = ReglerLicht;
window.visWidgets.RaumKachel = RaumKachel;
window.visWidgets.ClockDate = ClockDate;

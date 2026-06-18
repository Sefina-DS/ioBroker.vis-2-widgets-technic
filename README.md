# ioBroker VIS 2 Technic Widgets

[![NPM version](https://img.shields.io/npm/v/iobroker.vis-2-widgets-technic.svg)](https://www.npmjs.com/package/iobroker.vis-2-widgets-technic)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Technic widgets for ioBroker VIS 2 with a consistent dark teal design language for smart home visualization.

## Widgets

**FensterNormal** – Window and roller blind widget with SVG rendering, context menu, position slider and Auto/Manual toggle.

**AnAusSchalter** – On/off switch widget with selectable SVG icons and configurable on/off colors.

**BeleuchtungDimmer** – 270° arc dimmer with draggable knob, dynamic lamp rays, power button and room name label.

**FBH_Regler** – Underfloor heating circuit widget with half-circle dial, target/actual temperature display, valve status and InfluxDB history overlay.

## Requirements

- ioBroker js-controller >= 5.0.19
- ioBroker VIS 2 >= 2.0.0
- Node.js >= 20

## Installation

Install via the ioBroker Admin interface by searching for "vis-2-widgets-technic" in the adapter list.

After installation do a hard refresh in your browser (Ctrl+Shift+R).

## Design

All widgets use a consistent color palette:

- Teal `#2ecfbf` – Active / ON state
- Secondary `#5f8f8a` – Inactive / OFF state
- Background `#0d1820` – Widget background
- Text `#c8e6e3` – Labels and text

## Changelog

### 0.1.3 (2026-06-18)
- Added BeleuchtungDimmer widget

### 0.1.2 (2026-05-01)
- AnAusSchalter widget with SVG icons and freely configurable colors

### 0.1.1 (2026-04-01)
- FensterNormal widget with SVG transparency and context menu

### 0.1.0 (2026-03-01)
- Initial release

## License

MIT License – Copyright (c) 2026 iobroker-community-adapters

See [LICENSE](LICENSE) for full text.
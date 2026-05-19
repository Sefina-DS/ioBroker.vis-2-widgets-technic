#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  deploy.sh — Technic Widget Deploy Script (DEV)
#  Nutzung: ./deploy.sh [--no-build] [--no-restart]
# ═══════════════════════════════════════════════════════════
set -e
ADAPTER="vis-2-widgets-technic"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIS2_WWW="/opt/iobroker/node_modules/iobroker.vis-2/www/widgets/$ADAPTER"
IOBDATA="/opt/iobroker/iobroker-data/files"
NO_BUILD=false
NO_RESTART=false
for arg in "$@"; do
    case $arg in
        --no-build)    NO_BUILD=true ;;
        --no-restart)  NO_RESTART=true ;;
    esac
done
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Technic Widget Deploy                  ║"
echo "╚══════════════════════════════════════════╝"
echo ""
# ── 1. Build + Copy nach widgets/ ────────────────────────
if [ "$NO_BUILD" = false ]; then
    echo "▶ Baue Widget und kopiere nach widgets/..."
    cd "$SCRIPT_DIR"
    node tasks
    echo "✓ Build + Copy abgeschlossen"
    echo ""
else
    echo "⏭ Build übersprungen"
fi
# ── 2. VIS 2 Cache leeren ────────────────────────────────
echo "▶ Leere VIS 2 Cache..."
rm -rf "$VIS2_WWW"
rm -rf "$IOBDATA/vis-2/widgets/$ADAPTER"
echo "✓ Cache geleert"
echo ""
# ── 3. Upload zu ioBroker DB ─────────────────────────────
echo "▶ Upload zu ioBroker..."
iobroker upload "$ADAPTER" --allow-root
echo "✓ Upload abgeschlossen"
echo ""
# ── 4. Alle Widget-Dateien direkt ins Dateisystem kopieren ──
echo "▶ Kopiere Widget-Dateien ins ioBroker Dateisystem..."
WIDGETS_DIR="$SCRIPT_DIR/widgets/$ADAPTER"
DEST="$IOBDATA/vis-2/widgets/$ADAPTER"
mkdir -p "$DEST/assets"

# Alle JS Assets
cp "$WIDGETS_DIR"/assets/*.js "$DEST/assets/"

# customWidgets.js
cp "$WIDGETS_DIR/customWidgets.js" "$DEST/"

# mf-manifest.json
if [ -f "$WIDGETS_DIR/mf-manifest.json" ]; then
    cp "$WIDGETS_DIR/mf-manifest.json" "$DEST/"
fi

# img/ Ordner (Vorschaubilder)
if [ -d "$WIDGETS_DIR/img" ]; then
    mkdir -p "$DEST/img"
    cp "$WIDGETS_DIR"/img/* "$DEST/img/"
fi

echo "✓ Dateisystem-Kopie abgeschlossen"
echo ""

# ── 5. VIS 2 neu starten ─────────────────────────────────
if [ "$NO_RESTART" = false ]; then
    echo "▶ Starte VIS 2 neu..."
    iobroker restart vis-2 --allow-root
    echo "✓ VIS 2 neugestartet"
    echo ""
else
    echo "⏭ VIS 2 Neustart übersprungen"
fi
echo "════════════════════════════════════════════"
echo "✅ Deploy abgeschlossen!"
echo "   → Browser hard refresh: Ctrl+Shift+R"
echo "════════════════════════════════════════════"
echo ""
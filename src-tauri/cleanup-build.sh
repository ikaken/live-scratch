#!/bin/bash
# Remove unnecessary files from scratch-gui build to reduce bundle size
set -e

BUILD_DIR="../scratch-editor/packages/scratch-gui/build"

if [ ! -d "$BUILD_DIR" ]; then
  echo "[cleanup] Build directory not found, skipping"
  exit 0
fi

echo "[cleanup] Removing .map files..."
find "$BUILD_DIR" -name "*.map" -delete 2>/dev/null || true

echo "[cleanup] Removing unnecessary entry points..."
# Keep only index.html, gui.js, chunks/, static/, live-reload.js
for f in "$BUILD_DIR"/blocksonly.* "$BUILD_DIR"/player.* "$BUILD_DIR"/standalone.*; do
  [ -e "$f" ] && rm -f "$f" && echo "  removed $(basename "$f")"
done

echo "[cleanup] Done"

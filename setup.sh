#!/bin/bash
set -e

REPO="https://github.com/scratchfoundation/scratch-editor.git"
COMMIT="81d16ac24e287a988ec95fe471ca90c44eed88ad"
DIR="scratch-editor"

cd "$(dirname "$0")"

# Clone scratch-editor at pinned commit
if [ ! -d "$DIR" ]; then
  echo "[setup] Cloning scratch-editor..."
  git clone --depth 1 "$REPO" "$DIR"
  cd "$DIR"
  git fetch --depth 1 origin "$COMMIT"
  git checkout "$COMMIT"
  cd ..
else
  echo "[setup] scratch-editor already exists, skipping clone"
fi

# Patch: expose window.vm in gui.jsx
GUI_JSX="$DIR/packages/scratch-gui/src/containers/gui.jsx"
if ! grep -q 'window.vm' "$GUI_JSX"; then
  echo "[setup] Patching gui.jsx..."
  node -e "
    const fs = require('fs');
    const f = process.argv[1];
    let s = fs.readFileSync(f, 'utf8');
    s = s.replace(
      'this.props.onVmInit(this.props.vm);',
      'this.props.onVmInit(this.props.vm);\n        window.vm = this.props.vm;'
    );
    fs.writeFileSync(f, s);
  " "$GUI_JSX"
fi

# Patch: add @scratch/scratch-vm type declaration
TYPES_DTS="$DIR/packages/scratch-gui/src/types.d.ts"
if ! grep -q '@scratch/scratch-vm' "$TYPES_DTS"; then
  echo "[setup] Patching types.d.ts..."
  echo "declare module '@scratch/scratch-vm';" >> "$TYPES_DTS"
fi

# Install dependencies and build
echo "[setup] Installing dependencies..."
cd "$DIR"
npm install

echo "[setup] Building scratch-gui..."
npm run build:dev --workspace=packages/scratch-gui

cd ..

# Inject live-reload.js into the build
BUILD_DIR="$DIR/packages/scratch-gui/build"
INDEX_HTML="$BUILD_DIR/index.html"

echo "[setup] Injecting live-reload.js into build..."
cp client/live-reload.js "$BUILD_DIR/live-reload.js"

if ! grep -q 'live-reload.js' "$INDEX_HTML"; then
  # Inject script tag before </body>
  sed -i '' 's|</body>|<script src="live-reload.js"></script></body>|' "$INDEX_HTML"
fi

echo "[setup] Done!"

#!/bin/bash
# Build a .deb for unreact-platform. Called by semantic-release with the
# next version, or by `npm run package:deb [VERSION]`.
#
# Requirements:
#   - nfpm (https://nfpm.goreleaser.com/install/)
#   - A completed `npm run build` (provides dist/)
#
set -euo pipefail

VERSION="${1:-${npm_package_version:-0.0.0-dev}}"
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="$ROOT_DIR/dist-deb"

cd "$ROOT_DIR"

echo "==> Building .deb for unreact-platform v$VERSION"

# Sanity check: vite build must have produced dist/
if [ ! -f "dist/index.html" ]; then
    echo "ERROR: dist/index.html not found. Run 'npm run build' first."
    exit 1
fi

# nfpm must be installed
if ! command -v nfpm >/dev/null 2>&1; then
    echo "ERROR: nfpm is not installed. See https://nfpm.goreleaser.com/install/"
    echo "  Quick install (Linux amd64):"
    echo "    curl -sLO https://github.com/goreleaser/nfpm/releases/latest/download/nfpm_amd64.deb"
    echo "    sudo dpkg -i nfpm_amd64.deb"
    exit 1
fi

# Ensure scripts are executable
chmod +x packaging/scripts/postinstall.sh
chmod +x packaging/scripts/preremove.sh
chmod +x packaging/scripts/postremove.sh
chmod +x packaging/scripts/unreact-platform-update

mkdir -p "$OUT_DIR"

VERSION="$VERSION" nfpm package \
  --config packaging/nfpm.yaml \
  --packager deb \
  --target "$OUT_DIR/"

# Resulting filename is `unreact-platform_VERSION_all.deb`. Normalize to a
# stable name so the auto-updater can fetch a predictable asset URL.
DEB_FILE=$(ls "$OUT_DIR"/unreact-platform_*_all.deb | head -1)
cp "$DEB_FILE" "$OUT_DIR/unreact-platform.deb"

echo "==> Done"
echo "    $DEB_FILE"
echo "    $OUT_DIR/unreact-platform.deb (normalized)"

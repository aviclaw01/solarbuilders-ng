#!/usr/bin/env bash
# Rebuild the ₦-only font subsets (see the @font-face block in app/globals.css).
#
# U+20A6 is the only latin-ext codepoint on the site, so without these subsets
# the browser downloads ~107KB of webfont to draw one glyph on every page.
#
# Run after `npm run build`, from app/. Needs fonttools + brotli:
#   python3 -m venv /tmp/fontenv && /tmp/fontenv/bin/pip install fonttools brotli
#
# Find the current latin-ext files: they are the largest .woff2 in
# .next/static/media (Inter ~85KB, Plus Jakarta ~22KB). Confirm with:
#   ls -S .next/static/media/*.woff2 | head
set -euo pipefail
PYF=${PYF:-/tmp/fontenv/bin/pyftsubset}
INTER_EXT=${1:?usage: build-naira-subset.sh <inter-latin-ext.woff2> <jakarta-latin-ext.woff2>}
JAK_EXT=${2:?}
mkdir -p public/fonts
"$PYF" "$INTER_EXT" --unicodes="U+20A6" --flavor=woff2 --output-file=public/fonts/naira-inter.woff2 --layout-features='' --no-hinting --desubroutinize
"$PYF" "$JAK_EXT"  --unicodes="U+20A6" --flavor=woff2 --output-file=public/fonts/naira-jakarta.woff2 --layout-features='' --no-hinting --desubroutinize
ls -l public/fonts/*.woff2

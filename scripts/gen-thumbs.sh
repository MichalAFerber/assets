#!/usr/bin/env bash
#
# Generate lightweight WebP thumbnails for large raster assets into
# site/thumbs/<mirrored path>.webp. The gallery uses these for card previews
# and falls back to the original file when a thumbnail is absent (small images
# skip thumbnailing — they're already light).
#
# Runs in CI before `jekyll build`; site/thumbs/ is git-ignored. Requires cwebp
# (Debian/Ubuntu: `apt-get install webp`; macOS: `brew install webp`).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT="site/thumbs"
MAXW=640            # cap width (px) for large images; height scales to preserve aspect
QUALITY=76
BIG=120000          # images larger than this many bytes get downscaled to MAXW;
                    # smaller ones are re-encoded at native size (kept crisp)

filesize() { stat -c '%s' "$1" 2>/dev/null || stat -f '%z' "$1"; }

# A thumbnail is generated for EVERY raster asset (so the gallery never requests
# a missing thumbnail and flashes) — large ones downscaled, small ones as-is.
made=0
while IFS= read -r -d '' src; do
  dst="$OUT/${src%.*}.webp"
  # incremental: skip if an up-to-date thumbnail already exists
  [ -f "$dst" ] && [ "$dst" -nt "$src" ] && continue
  mkdir -p "$(dirname "$dst")"
  if [ "$(filesize "$src")" -gt "$BIG" ]; then
    ok=$(cwebp -quiet -q "$QUALITY" -resize "$MAXW" 0 "$src" -o "$dst" && echo 1 || echo 0)
  else
    ok=$(cwebp -quiet -q "$QUALITY" "$src" -o "$dst" && echo 1 || echo 0)
  fi
  if [ "$ok" = 1 ]; then made=$((made + 1)); else echo "warn: cwebp failed for $src" >&2; fi
done < <(find Icons Images wallpaper -type f \
  \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \
     -o -iname '*.gif' -o -iname '*.bmp' -o -iname '*.avif' \) -print0 2>/dev/null)

echo "gen-thumbs: created $made thumbnail(s); total in $OUT: $(find "$OUT" -name '*.webp' 2>/dev/null | wc -l | tr -d ' ')"

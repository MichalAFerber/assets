# 🎨 Asset Vault

A home for homeless assets — icons, wallpapers, and everything in between.

**Browse the vault:** https://michalaferber.github.io/assets/

## How it works

This repo doubles as a website. Every push triggers a GitHub Pages (Jekyll)
build that regenerates [`manifest.json`](manifest.json) from the full file
tree, so **the site adapts automatically as the repo grows** — no config
edits, no page authoring.

- 📁 **Every folder gets its own page** with breadcrumbs, e.g.
  [`/wallpaper/`](https://michalaferber.github.io/assets/wallpaper/)
- 🖼️ **Previews** for images, video, and audio; emoji icons for everything else
- 📋 **One-click copy** of a hotlinkable Pages URL or a raw GitHub URL per asset
- 🔍 **Search** across the whole vault
- 🌗 Dark & light modes, responsive on mobile and tablet

## Adding assets

Just commit them:

```bash
mkdir icons
cp somewhere/cool-icon.png icons/
git add icons && git commit -m "Add cool icon" && git push
```

The new `icons/` folder and its page appear on the site after the Pages
build finishes (~a minute).

Notes:

- `README.md` files inside asset folders are ignored by the gallery, so
  feel free to document folders.
- The `site/` folder holds the website's own CSS/JS/fonts — don't put
  assets there.
- Fonts: [Fira Code](https://github.com/tonsky/FiraCode) is vendored under
  `site/fonts/` (SIL OFL license — see `site/fonts/LICENSE`).

## Local preview

```bash
bundle install
bundle exec jekyll serve
# → http://localhost:4000/assets/
```

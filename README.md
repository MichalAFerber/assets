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

## Local preview

```bash
bundle install
bundle exec jekyll serve
# → http://localhost:4000/assets/
```

## Privacy

Static site, no accounts, no forms, no server-side processing. Analytics are
handled by a self-hosted [Plausible](https://plausible.io/) instance
(cookieless, no personal data, no cross-site tracking) — no Google Analytics,
no ad pixels. The assets themselves are public files served by GitHub Pages.

## Standards & deviations

Built to the **TGWAB Dev Standards** as a **Class C micro-project** (asset
collection on GitHub Pages + Jekyll — public, MIT, no custom domain). The full
SEO/security-headers plumbing kit does not apply to Class C. Deliberate
deviations from the baseline:

- **Design is calm/casual, not "bold & bright."** Requested for this project —
  it's a low-key utility vault, not a marketing surface.

## Credits

| Component | Version | License |
| --- | --- | --- |
| [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (headings, via `@fontsource`) | 5.2.7 | SIL OFL 1.1 (`site/fonts/LICENSE`) |
| [Octicons](https://github.com/primer/octicons) `mark-github` glyph | — | MIT (© GitHub, Inc.) |

Brand mark (`site/img/favicon.svg`) is original. Body copy uses the system
font stack. All web fonts are self-hosted `woff2` — no Google Fonts, no CDNs.

## License

[MIT](LICENSE) for the site code and original brand mark, with third-party
notices in `LICENSE`. Individual assets in the content folders may carry their
own rights — check each folder.

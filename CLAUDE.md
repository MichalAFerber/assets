# CLAUDE.md — Asset Vault

Guidance for organizing and deduplicating this repo. Read this before sorting
assets so the taxonomy and rules stay consistent over time.

## What this repo is

A public **asset vault** that doubles as a website
(https://michalaferber.github.io/assets/). It's a Jekyll + GitHub Pages site,
but there is **no page authoring**: on every build, `manifest.json`
regenerates from the full file tree (`site.static_files`), and the gallery in
`site/js/gallery.js` renders whatever folders and files exist.

**Consequence:** moving, renaming, deleting, or adding assets never requires
touching site code — the site adapts on the next build. Folder names become
page titles and breadcrumbs, so keep folder names clean and human-readable.

Don't put assets in `site/` (that's the website's own CSS/JS/fonts). A
`README.md` inside any asset folder is ignored by the gallery, so folders can
be self-documenting.

## The _Inbox workflow

`_Inbox/` is a git-ignored staging area (only its `README.md` is tracked). The
user drops unsorted assets there and asks Claude to "organize and dedupe the
_Inbox." Process each file: **dedupe → categorize → move → verify**, then
leave the inbox empty. Because inbox contents are git-ignored, a file only
enters version control once it lands in a real category folder.

## Deduplication rules

Dedupe by **exact content hash** (`md5`), not by filename — names vary but
identical bytes are true duplicates.

- **Keep one copy of each identical file.** When the same bytes appear in
  several places, keep the copy in the most canonical/organized location and
  remove the rest.
- **Canonical-copy priority (highest wins):**
  1. `Images/Company Branding Kits/…` (official brand archives)
  2. `University of South Carolina/…`
  3. A specific category subfolder over a flat/general one
  4. Shortest path, then alphabetical, to break ties
- **Never dedupe *within* `Images/Company Branding Kits/`.** Brand kits
  deliberately repeat the same logo across product / format (PNG, SVG, EPS) /
  color (Colored, White) / variant folders. Those repeats are intentional —
  leave them intact.
- **Resolution / aspect-ratio variants are NOT duplicates.** The same subject
  at 1440p vs 4K vs a mobile portrait crop are distinct assets — keep them.
  (Only identical bytes count as a duplicate.)
- **Junk to always delete, repo-wide:** `.DS_Store`, `Thumbs.db`, and
  Raindrop.io bookmark-export leftovers (`export.csv`, `export.html`,
  `export.txt`).

## Taxonomy (where things go)

Match the existing structure; create a new category folder only when several
assets share a theme with no existing home.

### `wallpaper/` — desktop & phone wallpapers, by subject

`Abstract`, `Android`, `Apple`, `Cars` (real cars), `Funny` (humor, comedy,
Simpsons/Futurama), `Heros` (superheroes — DC, Marvel, Flash),
`Krispy_Kreme`, `Linux`, `Microsoft`, `Mobile` (phone-portrait wallpapers, by
form factor), `Movies` (animated films & movie art — Pixar/Disney/DreamWorks,
Transformers, Mario), `Planes`, `Scenery` (landscapes), `Tech`, `Trucks`,
`Ubuntu`, `UofSC`.

Notes: **Cars** = real vehicles; the Pixar *Cars* movie goes to **Movies**.
Portrait/phone-resolution versions go to **Mobile** regardless of subject.

### `Icons/` — small square graphics: UI icons, app icons, icon sets

**Icon vs. logo test:** an *icon* is a small, square-ish graphic
(roughly ≤1024 px, aspect ~1:1) used as a UI glyph, app/product icon, or
folder icon → it belongs in `Icons/`. A *brand/identity mark* (a company's
official wordmark or logo) stays in `Images/Logos`, `Images/Brands`, or
`Images/Social_Media` even when it's small and square. When a small square
graphic sits in `Images/General` or `Images/Applications`, move it to `Icons/`
unless it's character art, a photo, a meme, or an ambiguous illustration
(those stay in `Images/General`).

Layout inside `Icons/`:
- Themed icon sets named `<subject>_icon_rgb_<color>.png` (seven color themes:
  `atlantic, azalea, grass, honeycomb, horseshoe, reverse, rose`) → group all
  color variants of one subject into `Icons/<subject>/` (e.g. `Icons/airplane/`).
- `Icons/Applications/` — app/service/product icons.
- `Icons/Papirus/` — the Papirus Linux folder-icon set.
- `Icons/Misc/` — generic one-off UI/device icons that don't form a set.

### `Images/` — logos, brands, and graphics, by category

`Applications`, `Avatars` (profile / avatar images), `Badges`, `Brands`,
`Company Branding Kits` (official kits — keep each kit's internal structure
exactly as shipped), `Credit_Debit_Cards`, `Games`, `General` (catch-all),
`Logos`, `Memes`, `QSI`, `Social_Media`, `Virtual_Backgrounds`.

`General` and `Applications` hold non-icon graphics only — character art,
photos, memes, wordmark banners, and brand logos too wide to be icons. Their
small square UI/app icons live in `Icons/` (see the icon vs. logo test above).

When collapsing duplicates: if a logo in `Applications/`, `Logos/`, `Brands/`,
`General/`, or `Games/` is byte-identical to one inside a Company Branding
Kit, keep the brand-kit copy and remove the loose one.

### `USC/` — official University of South Carolina logo kit

Leave its shipped format/color folder structure intact, like a brand kit.

## Recipes

```bash
# Find exact-duplicate groups anywhere under a path (by content hash)
find <dir> -type f -not -name '.DS_Store' -print0 | xargs -0 md5 -r \
  | awk '{h=$1;$1="";sub(/^ /,"");f[h]=f[h]"\n    "$0;c[h]++} \
         END{for(h in c)if(c[h]>1)print "["c[h]"x]"f[h]"\n"}'

# Delete junk repo-wide
find . -path ./.git -prune -o -type f \
  \( -name '.DS_Store' -o -name 'Thumbs.db' -o -name 'export.csv' \
     -o -name 'export.html' -o -name 'export.txt' \) -delete
```

md5 note: macOS `md5 -r` prints `<32-char hash><single space><path>`.

## After organizing

1. Verify: **0 loose files** at `Icons/`, `Images/`, and `wallpaper/` roots;
   **0 duplicate groups** outside brand kits; `_Inbox/` empty.
2. Commit only when asked. Let git detect moves as renames (`git add -A`;
   review with `git diff --cached --find-renames --summary`).
3. No site changes needed — `manifest.json` regenerates on build.

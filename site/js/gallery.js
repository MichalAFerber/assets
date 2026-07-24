/* Asset Vault gallery
 *
 * Renders any folder in the repo from /manifest.json (regenerated on every
 * Jekyll build, so the site adapts as the repo grows). Folder URLs like
 * /wallpaper/ are served by 404.html, which loads this same app; the current
 * folder is derived from the URL path.
 *
 * Previews use CI-generated WebP thumbnails under /site/thumbs/ (mirroring each
 * asset's path) and fall back to the original file if a thumbnail is missing.
 */
(function () {
  'use strict';

  var SITE = window.SITE || { baseurl: '', siteUrl: '', repo: '', branch: 'main', title: 'Assets' };

  var IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp', '.ico'];
  var VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.m4v'];
  var AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
  // Raster images that get a downscaled WebP thumbnail (svg/ico stay original).
  var THUMBABLE = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.avif', '.webp'];

  var FILE_EMOJI = {
    '.pdf': '📕', '.md': '📝', '.txt': '📝', '.doc': '📄', '.docx': '📄',
    '.zip': '🗜️', '.tar': '🗜️', '.gz': '🗜️', '.7z': '🗜️', '.rar': '🗜️',
    '.ttf': '🔤', '.otf': '🔤', '.woff': '🔤', '.woff2': '🔤',
    '.json': '🧩', '.xml': '🧩', '.yml': '🧩', '.yaml': '🧩',
    '.css': '🎨', '.js': '⚙️', '.html': '🌐', '.sh': '💻',
    '.psd': '🖌️', '.ai': '🖌️', '.fig': '🖌️', '.sketch': '🖌️', '.eps': '🖌️',
    '.stl': '🧊', '.obj': '🧊', '.blend': '🧊',
    '.csv': '📊', '.xls': '📊', '.xlsx': '📊'
  };

  var FOLDER_EMOJI = {
    wallpaper: '🖼️', wallpapers: '🖼️', icons: '🎯', icon: '🎯',
    fonts: '🔤', font: '🔤', logos: '🏷️', logo: '🏷️', images: '📸',
    stickers: '🏷️', sounds: '🔊', audio: '🔊', music: '🎵',
    video: '🎬', videos: '🎬', gifs: '🎞️', screenshots: '📸',
    docs: '📚', documents: '📚', templates: '📐', misc: '🎁'
  };

  var $app = document.getElementById('app');
  var $crumbs = document.getElementById('breadcrumbs');
  var $search = document.getElementById('search');
  var $hero = document.getElementById('hero');
  var $toast = document.getElementById('toast');
  var toastTimer = null;

  /* ------------------------------------------------------------ helpers */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function encodePath(p) {
    return p.split('/').map(encodeURIComponent).join('/');
  }

  // Original file, served by GitHub Pages (nice for hotlinking / download).
  function origUrl(file) { return SITE.baseurl + encodePath(file.path); }

  // Public Pages URL (absolute — for the copy-link button).
  function pagesUrl(file) { return SITE.siteUrl + SITE.baseurl + encodePath(file.path); }

  // Direct raw.githubusercontent.com URL.
  function rawUrl(file) {
    return 'https://raw.githubusercontent.com/' + SITE.repo + '/' + SITE.branch + encodePath(file.path);
  }

  // WebP thumbnail path (raster only); svg/ico return their original.
  function thumbUrl(file) {
    if (THUMBABLE.indexOf(file.ext) === -1) return origUrl(file);
    var p = file.path.replace(/^\//, '').replace(/\.[^.\/]+$/, '.webp');
    return SITE.baseurl + '/site/thumbs/' + encodePath(p);
  }

  function folderHref(folderPath) {
    return SITE.baseurl + '/' + (folderPath ? encodePath(folderPath) + '/' : '');
  }

  function folderEmoji(name) { return FOLDER_EMOJI[name.toLowerCase()] || '📁'; }

  function extKind(ext) {
    if (IMAGE_EXTS.indexOf(ext) !== -1) return 'image';
    if (VIDEO_EXTS.indexOf(ext) !== -1) return 'video';
    if (AUDIO_EXTS.indexOf(ext) !== -1) return 'audio';
    if (['.pdf', '.md', '.txt', '.doc', '.docx'].indexOf(ext) !== -1) return 'doc';
    return 'other';
  }

  function fileEmoji(ext) { return FILE_EMOJI[ext] || '📦'; }

  // <img> that loads the thumbnail and falls back to the original if it 404s.
  function imgTag(file, alt) {
    var t = thumbUrl(file), o = origUrl(file);
    if (t === o) {
      return '<img src="' + esc(o) + '" alt="' + esc(alt) + '" loading="lazy">';
    }
    return '<img src="' + esc(t) + '" alt="' + esc(alt) + '" loading="lazy"' +
           ' onerror="this.onerror=null;this.src=\'' + esc(o) + '\'">';
  }

  function showToast(msg) {
    $toast.textContent = msg;
    $toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $toast.classList.remove('show'); }, 1800);
  }

  function copyText(text, label) {
    function done() { showToast(label + ' copied ✓'); }
    function fail() { showToast('Copy failed — long-press the link instead'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fail);
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { fail(); }
      document.body.removeChild(ta);
    }
  }

  /* -------------------------------------------------------- routing */

  function currentFolder() {
    var path = decodeURIComponent(window.location.pathname);
    if (SITE.baseurl && path.indexOf(SITE.baseurl) === 0) path = path.slice(SITE.baseurl.length);
    path = path.replace(/^\/+|\/+$/g, '');
    if (/\.[A-Za-z0-9]+$/.test(path)) path = path.split('/').slice(0, -1).join('/');
    return path;
  }

  /* -------------------------------------------------------- rendering */

  function renderBreadcrumbs(folder) {
    var html = '';
    if (!folder) {
      html = '<span class="crumb current">Home</span>';
    } else {
      html = '<a class="crumb" href="' + esc(folderHref('')) + '">Home</a>';
      var segs = folder.split('/');
      var acc = [];
      segs.forEach(function (seg, i) {
        acc.push(seg);
        html += '<span class="sep" aria-hidden="true">/</span>';
        if (i === segs.length - 1) {
          html += '<span class="crumb current" aria-current="page">' + esc(seg) + '</span>';
        } else {
          html += '<a class="crumb" href="' + esc(folderHref(acc.join('/'))) + '">' + esc(seg) + '</a>';
        }
      });
    }
    $crumbs.innerHTML = html;
  }

  // First image anywhere beneath a folder — used as the folder card's preview.
  function firstImageUnder(files, folderPath) {
    var prefix = '/' + folderPath + '/';
    for (var i = 0; i < files.length; i++) {
      if (files[i].path.indexOf(prefix) === 0 && extKind(files[i].ext) === 'image') return files[i];
    }
    return null;
  }

  function folderCardHtml(name, count, fullPath, files) {
    var rep = firstImageUnder(files, fullPath);
    var inner, cls;
    if (rep) {
      inner = imgTag(rep, name); cls = 'thumb';
    } else {
      inner = '<div class="ph"><span class="ph-emoji" aria-hidden="true">' + folderEmoji(name) +
              '</span><span class="ph-name">' + esc(name) + '</span></div>';
      cls = 'thumb noshot';
    }
    return '' +
      '<a class="card" href="' + esc(folderHref(fullPath)) + '">' +
        '<div class="' + cls + '">' + inner + '</div>' +
        '<div class="cap">' +
          '<span class="name" title="' + esc(name) + '">' + esc(name) + '</span>' +
          '<span class="metaright">' +
            '<span class="fcount">' + count + ' file' + (count === 1 ? '' : 's') + '</span>' +
            '<span class="tag folder">Folder</span>' +
          '</span>' +
        '</div>' +
      '</a>';
  }

  function fileCardHtml(file) {
    var kind = extKind(file.ext);
    var inner, cls;
    if (kind === 'image') {
      inner = imgTag(file, file.name); cls = 'thumb';
    } else if (kind === 'video') {
      inner = '<video src="' + esc(origUrl(file)) + '" preload="metadata" muted playsinline></video>'; cls = 'thumb';
    } else {
      inner = '<div class="ph"><span class="ph-emoji" aria-hidden="true">' +
              (kind === 'audio' ? '🎵' : fileEmoji(file.ext)) + '</span></div>';
      cls = 'thumb noshot';
    }
    var tagCls = kind === 'image' ? 'image' : (kind === 'video' || kind === 'audio') ? 'video' : 'other';
    var tagText = file.ext ? file.ext.replace('.', '').toUpperCase() : 'FILE';

    return '' +
      '<article class="card">' +
        '<a class="thumb-link" href="' + esc(origUrl(file)) + '" target="_blank" rel="noopener" aria-label="Open ' + esc(file.name) + '">' +
          '<div class="' + cls + '">' + inner + '</div>' +
        '</a>' +
        '<div class="cap">' +
          '<span class="name" title="' + esc(file.path) + '">' + esc(file.name) + '</span>' +
          '<span class="metaright"><span class="tag ' + tagCls + '">' + esc(tagText) + '</span></span>' +
        '</div>' +
        '<div class="actions">' +
          '<button class="btn primary" type="button" data-copy="' + esc(pagesUrl(file)) + '" data-label="Link">Copy link</button>' +
          '<button class="btn" type="button" data-copy="' + esc(rawUrl(file)) + '" data-label="Raw link">Raw</button>' +
          '<a class="btn dl" href="' + esc(origUrl(file)) + '" download aria-label="Download ' + esc(file.name) + '">↓</a>' +
        '</div>' +
      '</article>';
  }

  function emptyHtml(icon, msg) {
    return '<div class="empty"><span class="big">' + icon + '</span>' + esc(msg) + '</div>';
  }

  function contentsOf(files, folder) {
    var prefix = folder ? '/' + folder + '/' : '/';
    var direct = [];
    var subfolders = {};
    files.forEach(function (f) {
      if (f.path.indexOf(prefix) !== 0) return;
      var rest = f.path.slice(prefix.length);
      var slash = rest.indexOf('/');
      if (slash === -1) direct.push(f);
      else {
        var sub = rest.slice(0, slash);
        subfolders[sub] = (subfolders[sub] || 0) + 1;
      }
    });
    return { files: direct, subfolders: subfolders };
  }

  function renderFolder(files, folder) {
    renderBreadcrumbs(folder);
    document.title = (folder ? folder + ' · ' : '') + SITE.title;
    if ($hero) $hero.style.display = folder ? 'none' : '';

    var c = contentsOf(files, folder);
    var subNames = Object.keys(c.subfolders).sort();
    var html = '';

    if (folder && subNames.length === 0 && c.files.length === 0) {
      $app.innerHTML = emptyHtml('🤷', 'Nothing at "' + folder + '" — this folder may have moved or never existed.');
      return;
    }

    if (subNames.length) {
      html += '<h2 class="section-title">Folders <span class="count">' + subNames.length + '</span></h2>';
      html += '<div class="grid-folders">';
      subNames.forEach(function (name) {
        var full = folder ? folder + '/' + name : name;
        html += folderCardHtml(name, c.subfolders[name], full, files);
      });
      html += '</div>';
    }

    if (c.files.length) {
      html += '<h2 class="section-title">Files <span class="count">' + c.files.length + '</span></h2>';
      html += '<div class="grid-assets">';
      c.files.forEach(function (f) { html += fileCardHtml(f); });
      html += '</div>';
    }

    if (!html) html = emptyHtml('🌱', 'This vault is empty… for now. Push some assets and watch it grow!');
    $app.innerHTML = html;
  }

  function renderSearch(files, query) {
    var q = query.toLowerCase();
    var hits = files.filter(function (f) { return f.path.toLowerCase().indexOf(q) !== -1; });

    document.title = 'Search · ' + SITE.title;
    if (!hits.length) {
      $app.innerHTML = emptyHtml('🔦', 'No assets matching "' + query + '". Try fewer letters?');
      return;
    }

    var html = '<h2 class="section-title">Results for “' + esc(query) + '” <span class="count">' + hits.length + '</span></h2>';
    html += '<div class="grid-assets">';
    hits.slice(0, 120).forEach(function (f) { html += fileCardHtml(f); });
    html += '</div>';
    if (hits.length > 120) {
      html += '<p class="loading">…and ' + (hits.length - 120) + ' more. Keep typing to narrow it down.</p>';
    }
    $app.innerHTML = html;
  }

  /* -------------------------------------------------------------- boot */

  // Event delegation for all copy buttons.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (btn) copyText(btn.getAttribute('data-copy'), btn.getAttribute('data-label') || 'Link');
  });

  fetch(SITE.baseurl + '/manifest.json')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (manifest) {
      var files = (manifest.files || []).filter(Boolean);
      var folder = currentFolder();
      renderFolder(files, folder);

      if ($search) {
        var debounce = null;
        $search.addEventListener('input', function () {
          clearTimeout(debounce);
          var q = $search.value.trim();
          debounce = setTimeout(function () {
            if (q) { renderSearch(files, q); renderBreadcrumbs(folder); }
            else { renderFolder(files, folder); }
          }, 120);
        });
      }
    })
    .catch(function (err) {
      $app.innerHTML = emptyHtml('💥', 'Could not load the asset list (' + err.message + '). Try a refresh?');
    });
})();

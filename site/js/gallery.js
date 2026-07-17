/* Asset Vault gallery
 *
 * Renders any folder in the repo from /manifest.json (regenerated on every
 * Jekyll build, so the site adapts as the repo grows). Folder URLs like
 * /wallpaper/ are served by 404.html, which loads this same app; the current
 * folder is derived from the URL path.
 */
(function () {
  'use strict';

  var SITE = window.SITE || { baseurl: '', siteUrl: '', repo: '', branch: 'main', title: 'Assets' };

  var IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp', '.ico'];
  var VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.m4v'];
  var AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];

  var FILE_EMOJI = {
    '.pdf': '📕', '.md': '📝', '.txt': '📝', '.doc': '📄', '.docx': '📄',
    '.zip': '🗜️', '.tar': '🗜️', '.gz': '🗜️', '.7z': '🗜️', '.rar': '🗜️',
    '.ttf': '🔤', '.otf': '🔤', '.woff': '🔤', '.woff2': '🔤',
    '.json': '🧩', '.xml': '🧩', '.yml': '🧩', '.yaml': '🧩',
    '.css': '🎨', '.js': '⚙️', '.html': '🌐', '.sh': '💻',
    '.psd': '🖌️', '.ai': '🖌️', '.fig': '🖌️', '.sketch': '🖌️',
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

  // Public URL served by GitHub Pages (nice for hotlinking)
  function pagesUrl(file) {
    return SITE.siteUrl + SITE.baseurl + encodePath(file.path);
  }

  // Direct raw.githubusercontent.com URL
  function rawUrl(file) {
    return 'https://raw.githubusercontent.com/' + SITE.repo + '/' + SITE.branch + encodePath(file.path);
  }

  function folderHref(folderPath) {
    return SITE.baseurl + '/' + (folderPath ? encodePath(folderPath) + '/' : '');
  }

  function folderEmoji(name) {
    return FOLDER_EMOJI[name.toLowerCase()] || '📁';
  }

  function extKind(ext) {
    if (IMAGE_EXTS.indexOf(ext) !== -1) return 'image';
    if (VIDEO_EXTS.indexOf(ext) !== -1) return 'video';
    if (AUDIO_EXTS.indexOf(ext) !== -1) return 'audio';
    if (['.pdf', '.md', '.txt', '.doc', '.docx'].indexOf(ext) !== -1) return 'doc';
    return 'other';
  }

  function fileEmoji(ext) {
    return FILE_EMOJI[ext] || '📦';
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
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { fail(); }
      document.body.removeChild(ta);
    }
  }

  /* -------------------------------------------------------- routing */

  // Current folder path (no leading/trailing slash), derived from the URL.
  // Works on the homepage ("" → root) and on 404-served folder URLs.
  function currentFolder() {
    var path = decodeURIComponent(window.location.pathname);
    if (SITE.baseurl && path.indexOf(SITE.baseurl) === 0) {
      path = path.slice(SITE.baseurl.length);
    }
    path = path.replace(/^\/+|\/+$/g, '');
    // A trailing file segment (e.g. someone hit a missing *file* URL) still
    // renders its parent folder.
    if (/\.[A-Za-z0-9]+$/.test(path)) {
      path = path.split('/').slice(0, -1).join('/');
    }
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

  function assetCardHtml(file, showFolder) {
    var kind = extKind(file.ext);
    var pages = pagesUrl(file);
    var preview;

    if (kind === 'image') {
      preview = '<img src="' + esc(SITE.baseurl + encodePath(file.path)) + '" alt="' + esc(file.name) + '" loading="lazy">';
    } else if (kind === 'video') {
      preview = '<video src="' + esc(SITE.baseurl + encodePath(file.path)) + '" preload="metadata" muted playsinline controls></video>';
    } else if (kind === 'audio') {
      preview = '<audio src="' + esc(SITE.baseurl + encodePath(file.path)) + '" preload="none" controls></audio>';
    } else {
      preview = '<span class="file-emoji" aria-hidden="true">' + fileEmoji(file.ext) + '</span>';
    }

    var folderOfFile = file.path.replace(/^\//, '').split('/').slice(0, -1).join('/');
    var folderLink = showFolder && folderOfFile
      ? '<a class="asset-folder" href="' + esc(folderHref(folderOfFile)) + '">📁 ' + esc(folderOfFile) + '</a>'
      : '';

    return '' +
      '<article class="asset-card">' +
        '<div class="asset-preview">' + preview + '</div>' +
        '<div class="asset-body">' +
          '<h3 class="asset-name">' + esc(file.name) + '</h3>' +
          '<div class="asset-meta">' +
            '<span class="ext-badge is-' + kind + '">' + esc(file.ext.replace('.', '') || 'file') + '</span>' +
            folderLink +
          '</div>' +
          '<div class="asset-actions">' +
            '<button class="btn btn-copy" type="button" data-copy="' + esc(pages) + '" data-label="Link">Copy link</button>' +
            '<button class="btn btn-raw" type="button" data-copy="' + esc(rawUrl(file)) + '" data-label="Raw link">Raw</button>' +
            '<a class="btn btn-dl" href="' + esc(SITE.baseurl + encodePath(file.path)) + '" download aria-label="Download ' + esc(file.name) + '">↓</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function emptyHtml(icon, msg) {
    return '<div class="empty"><span class="big">' + icon + '</span>' + esc(msg) + '</div>';
  }

  // All files & subfolders directly inside `folder`
  function contentsOf(files, folder) {
    var prefix = folder ? '/' + folder + '/' : '/';
    var direct = [];
    var subfolders = {}; // name -> count of files anywhere beneath it

    files.forEach(function (f) {
      if (f.path.indexOf(prefix) !== 0) return;
      var rest = f.path.slice(prefix.length);
      var slash = rest.indexOf('/');
      if (slash === -1) {
        direct.push(f);
      } else {
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

    // Unknown folder (a genuinely bad URL) — nothing beneath it at all
    if (folder && subNames.length === 0 && c.files.length === 0) {
      $app.innerHTML = emptyHtml('🤷', 'Nothing at "' + folder + '" — this folder may have moved or never existed.');
      return;
    }

    if (subNames.length) {
      html += '<h2 class="section-title">Folders <span class="count">' + subNames.length + '</span></h2>';
      html += '<div class="grid-folders">';
      subNames.forEach(function (name) {
        var full = folder ? folder + '/' + name : name;
        html += '<a class="folder-card" href="' + esc(folderHref(full)) + '">' +
          '<span class="emoji" aria-hidden="true">' + folderEmoji(name) + '</span>' +
          '<span class="name">' + esc(name) + '</span>' +
          '<span class="meta">' + c.subfolders[name] + ' file' + (c.subfolders[name] === 1 ? '' : 's') + '</span>' +
        '</a>';
      });
      html += '</div>';
    }

    if (c.files.length) {
      html += '<h2 class="section-title">Assets <span class="count">' + c.files.length + '</span></h2>';
      html += '<div class="grid-assets">';
      c.files.forEach(function (f) { html += assetCardHtml(f, false); });
      html += '</div>';
    }

    if (!html) {
      html = emptyHtml('🌱', 'This vault is empty… for now. Push some assets and watch it grow!');
    }

    $app.innerHTML = html;
  }

  function renderSearch(files, query) {
    var q = query.toLowerCase();
    var hits = files.filter(function (f) {
      return f.path.toLowerCase().indexOf(q) !== -1;
    });

    document.title = 'Search · ' + SITE.title;
    if (!hits.length) {
      $app.innerHTML = emptyHtml('🔦', 'No assets matching "' + query + '". Try fewer letters?');
      return;
    }

    var html = '<h2 class="section-title">Results for “' + esc(query) + '” <span class="count">' + hits.length + '</span></h2>';
    html += '<div class="grid-assets">';
    hits.slice(0, 120).forEach(function (f) { html += assetCardHtml(f, true); });
    html += '</div>';
    if (hits.length > 120) {
      html += '<p class="loading">…and ' + (hits.length - 120) + ' more. Keep typing to narrow it down.</p>';
    }
    $app.innerHTML = html;
  }

  /* -------------------------------------------------------------- boot */

  var $themeToggle = document.getElementById('theme-toggle');
  function syncThemePressed() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    $themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  }
  syncThemePressed();
  $themeToggle.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    syncThemePressed();
  });

  // Event delegation for all copy buttons
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (btn) copyText(btn.getAttribute('data-copy'), btn.getAttribute('data-label') || 'Link');
  });

  fetch(SITE.baseurl + '/manifest.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (manifest) {
      var files = (manifest.files || []).filter(Boolean); // drop the null terminator
      var folder = currentFolder();

      renderFolder(files, folder);

      if ($search) {
        var debounce = null;
        $search.addEventListener('input', function () {
          clearTimeout(debounce);
          var q = $search.value.trim();
          debounce = setTimeout(function () {
            if (q) {
              renderSearch(files, q);
              renderBreadcrumbs(folder); // keep crumbs stable while searching
            } else {
              renderFolder(files, folder);
            }
          }, 120);
        });
      }
    })
    .catch(function (err) {
      $app.innerHTML = emptyHtml('💥', 'Could not load the asset list (' + err.message + '). Try a refresh?');
    });
})();

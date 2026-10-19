// PWA registration + on-demand install (relative paths: works in a subfolder).
// Nothing is shown automatically: the browser's own install prompt is suppressed and
// installing only starts when the user taps the green "Install BPM Pro" button on index.html.
(function () {
  'use strict';

  var INSTALLED_KEY = 'bpmAppInstalled';
  var deferredPrompt = null;
  var waiters = [];

  // Own toast: the page's showSuccess() writes into the report area, which is off-screen and rewrites the report
  function toast(msg) {
    var t = document.getElementById('pwa-toast');
    if (!t) { t = document.createElement('div'); t.id = 'pwa-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.style.display = 'none'; }, 3200);
  }
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           window.matchMedia('(display-mode: minimal-ui)').matches ||
           window.navigator.standalone === true;
  }
  function isIOS() {
    var ua = navigator.userAgent || '';
    return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  }
  function wasInstalled() { try { return localStorage.getItem(INSTALLED_KEY) === '1'; } catch (e) { return false; } }
  function setInstalled(v) { try { v ? localStorage.setItem(INSTALLED_KEY, '1') : localStorage.removeItem(INSTALLED_KEY); } catch (e) {} }

  // ---------- styles (update banner, offline badge, help dialog) ----------
  var style = document.createElement('style');
  style.textContent =
    '#pwa-update-banner{position:fixed;top:0;left:0;right:0;z-index:10000;display:flex;align-items:center;' +
    'justify-content:space-between;gap:8px;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px;' +
    'background:#2563EB;color:#fff;font-size:13px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,.3)}' +
    '#pwa-update-banner button{border:1px solid #fff;background:#fff;color:#2563EB;border-radius:4px;padding:6px 12px;font-weight:600}' +
    '#pwa-update-banner button.ghost{background:transparent;color:#fff}' +
    '#pwa-offline-badge{position:fixed;top:calc(8px + env(safe-area-inset-top,0px));left:8px;z-index:9980;padding:5px 12px;' +
    'border-radius:16px;font-size:11px;font-weight:600;background:#EF4444;color:#fff;display:none}' +
    '#pwa-help-overlay{position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.55);display:flex;align-items:center;' +
    'justify-content:center;padding:20px}' +
    '#pwa-help-box{background:#fff;color:#1e293b;border-radius:14px;max-width:360px;width:100%;padding:18px 18px 14px;' +
    'box-shadow:0 10px 30px rgba(0,0,0,.35);font-size:14px;line-height:1.5;max-height:calc(100vh - 40px);overflow-y:auto}' +
    '#pwa-help-box h3{margin:0 0 8px;font-size:16px}' +
    '#pwa-help-box ol{margin:8px 0 12px 20px;padding:0}' +
    '#pwa-help-box button{display:block;width:100%;border:none;border-radius:8px;padding:10px;font-weight:600;' +
    'background:#2563EB;color:#fff;font-size:14px}' +
    '#pwa-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom,0px));' +
    'z-index:10002;display:none;max-width:88vw;padding:10px 16px;border-radius:20px;background:#1e293b;color:#fff;' +
    'font-size:13px;font-weight:600;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.35)}' +
    '@media print{#pwa-update-banner,#pwa-offline-badge,#pwa-help-overlay,#pwa-toast{display:none!important}}';
  document.head.appendChild(style);

  function showHelp(title, html) {
    var old = document.getElementById('pwa-help-overlay');
    if (old) old.remove();
    var ov = document.createElement('div');
    ov.id = 'pwa-help-overlay';
    ov.innerHTML = '<div id="pwa-help-box"><h3>' + title + '</h3>' + html + '<button type="button">OK</button></div>';
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.tagName === 'BUTTON') ov.remove(); });
    document.body.appendChild(ov);
  }

  // ---------- green button state ----------
  function updateInstallButton() {
    var btn = document.getElementById('installAppBtn');
    if (!btn) return;
    if (!btn.dataset.label) btn.dataset.label = btn.innerHTML;
    if (isStandalone()) {                       // already running as the installed app
      if (btn.parentElement) btn.parentElement.style.display = 'none';
      return;
    }
    if (btn.parentElement) btn.parentElement.style.display = '';
    btn.innerHTML = (wasInstalled() && !deferredPrompt) ? '✓ BPM Pro installed' : btn.dataset.label;
  }

  // ---------- capture the browser's install event as early as possible ----------
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();                          // no automatic prompt / mini-infobar
    deferredPrompt = e;
    setInstalled(false);                         // the browser offers install => not installed (self-heals after uninstall)
    updateInstallButton();
    var w = waiters; waiters = [];
    w.forEach(function (fn) { fn(); });
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    setInstalled(true);
    updateInstallButton();
    toast('✨ BPM Pro installed! It now works offline.');
  });

  function waitForPrompt(ms) {
    return new Promise(function (resolve) {
      if (deferredPrompt) return resolve(true);
      var done = false;
      var fn = function () { if (!done) { done = true; resolve(true); } };
      waiters.push(fn);
      setTimeout(function () { if (!done) { done = true; resolve(false); } }, ms);
    });
  }

  async function runPrompt() {
    var p = deferredPrompt;
    deferredPrompt = null;                       // a prompt can only be used once
    p.prompt();
    var choice = null;
    try { choice = await p.userChoice; } catch (e) {}
    if (choice && choice.outcome === 'accepted') { setInstalled(true); }
    updateInstallButton();
  }

  // Called by the green "Install BPM Pro" button
  window.bpmInstallApp = async function () {
    if (isStandalone()) { toast('✓ BPM Pro is already installed on this device.'); return; }

    if (deferredPrompt) { await runPrompt(); return; }

    if (isIOS()) {
      showHelp('Install on iPhone / iPad',
        '<ol><li>Open this page in <b>Safari</b>.</li><li>Tap the <b>Share</b> button.</li>' +
        '<li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol>');
      return;
    }

    toast('Preparing install...');
    var ready = await waitForPrompt(2500);       // the browser can take a moment to allow install
    if (ready && deferredPrompt) { await runPrompt(); return; }

    if (wasInstalled()) {
      showHelp('Already installed',
        '<p>BPM Pro is already installed on this device. Open it from your <b>home screen</b> or <b>app list</b>. ' +
        'If you removed it, reload this page and tap Install again.</p>');
      return;
    }
    showHelp('Install BPM Pro',
      '<p>Your browser did not offer the install window. Install it from the browser menu:</p>' +
      '<ol><li>Tap the <b>⋮</b> menu (top right).</li><li>Choose <b>Install app</b> or <b>Add to Home screen</b>.</li></ol>' +
      '<p>If you do not see it, reload this page once and try again.</p>');
  };

  // ---------- update banner + offline badge ----------
  function showUpdateBanner(worker) {
    if (document.getElementById('pwa-update-banner')) return;
    var bar = document.createElement('div');
    bar.id = 'pwa-update-banner';
    bar.innerHTML = '<span>🔄 New version available</span><span>' +
      '<button type="button" id="pwa-update-now">Update</button> ' +
      '<button type="button" class="ghost" id="pwa-update-later">Later</button></span>';
    document.body.appendChild(bar);
    document.getElementById('pwa-update-later').onclick = function () { bar.remove(); };
    document.getElementById('pwa-update-now').onclick = function () {
      if (worker) worker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    };
  }

  function updateOnlineBadge() {
    var badge = document.getElementById('pwa-offline-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'pwa-offline-badge';
      badge.textContent = '🔴 Offline mode';
      document.body.appendChild(badge);
    }
    badge.style.display = navigator.onLine ? 'none' : 'block';
  }
  window.addEventListener('online', updateOnlineBadge);
  window.addEventListener('offline', updateOnlineBadge);

  document.addEventListener('DOMContentLoaded', updateInstallButton);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      updateOnlineBadge();
      updateInstallButton();
      navigator.serviceWorker.register('./sw.js').then(function (reg) {
        reg.addEventListener('updatefound', function () {
          var nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', function () {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(nw);
          });
        });
        document.addEventListener('visibilitychange', function () {
          if (!document.hidden) reg.update().catch(function () {});
        });
      }).catch(function (err) { console.error('Service worker registration failed:', err); });
    });
  }
})();

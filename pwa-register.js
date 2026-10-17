// PWA registration, install button and update banner (relative paths: works in a subfolder)
(function () {
  'use strict';

  var deferredPrompt = null;

  function toast(msg) {
    if (typeof window.showSuccess === 'function') { window.showSuccess(msg); return; }
    console.log(msg);
  }

  var style = document.createElement('style');
  style.textContent =
    '#pwa-install-btn{position:fixed;left:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:9990;' +
    'padding:10px 16px;font-size:13px;font-weight:600;border:none;border-radius:22px;background:#2563EB;color:#fff;' +
    'box-shadow:0 4px 12px rgba(0,0,0,.3);cursor:pointer}' +
    '#pwa-update-banner{position:fixed;top:0;left:0;right:0;z-index:10000;display:flex;align-items:center;' +
    'justify-content:space-between;gap:8px;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px;' +
    'background:#2563EB;color:#fff;font-size:13px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,.3)}' +
    '#pwa-update-banner button{border:1px solid #fff;background:#fff;color:#2563EB;border-radius:4px;padding:6px 12px;font-weight:600}' +
    '#pwa-update-banner button.ghost{background:transparent;color:#fff}' +
    '#pwa-offline-badge{position:fixed;top:calc(8px + env(safe-area-inset-top,0px));left:8px;z-index:9980;padding:5px 12px;' +
    'border-radius:16px;font-size:11px;font-weight:600;background:#EF4444;color:#fff;display:none}' +
    '@media print{#pwa-install-btn,#pwa-update-banner,#pwa-offline-badge{display:none!important}}';
  document.head.appendChild(style);

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function showInstallButton() {
    if (isStandalone()) return;
    var btn = document.getElementById('pwa-install-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'pwa-install-btn';
      btn.type = 'button';
      btn.textContent = '📲 Install BPM Pro';
      btn.addEventListener('click', installApp);
      document.body.appendChild(btn);
    }
    btn.style.display = 'block';
  }

  function hideInstallButton() {
    var btn = document.getElementById('pwa-install-btn');
    if (btn) btn.style.display = 'none';
  }

  async function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (e) {}
    deferredPrompt = null;
    hideInstallButton();
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    hideInstallButton();
    toast('✨ BPM Pro installed! It now works offline.');
  });

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

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      updateOnlineBadge();
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

'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let prompt;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  $('installApp').onclick = async () => {
    if (prompt) { await prompt.prompt(); await prompt.userChoice; prompt = null; }
    else $('installHelp').showModal();
  };
  $('closeInstall').onclick = () => $('installHelp').close();
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); prompt = event; });
  window.addEventListener('appinstalled', () => { prompt = null; $('installApp').hidden = true; });
  $('installApp').hidden = !!standalone();
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(async () => {
      const cache = await caches.open('billard-club-v4');
      if (await cache.match(new URL('./index.html', location.href).href)) {
        $('offlineStatus').textContent = 'Prêt hors connexion sur cet appareil.';
      }
    }).catch(() => { $('offlineStatus').textContent = 'Mode hors connexion indisponible. Gardez la connexion Internet.'; });
  }
})();

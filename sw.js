'use strict';
const CACHE = 'billard-club-v5';
const ASSETS = ['./', './index.html', './core.js', './viewer.js', './storage.js', './app.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('billard-club-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method === 'POST' && new URL(event.request.url).pathname === new URL('./receive', self.location.href).pathname) {
    event.respondWith((async () => {
      try {
        const form = await event.request.formData(), file = form.get('exercises');
        if (!file || typeof file.text !== 'function' || file.size > 40 * 1024 * 1024) throw Error('Fichier incorrect');
        const text = await file.text();
        await new Promise((resolve, reject) => {
          const request = indexedDB.open('billard-club', 1);
          request.onupgradeneeded = () => request.result.createObjectStore('collections');
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result, tx = db.transaction('collections', 'readwrite');
            tx.objectStore('collections').put(text, 'inbox');
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
          };
        });
        return Response.redirect(new URL('./?shared=1', self.location.href), 303);
      } catch {
        return Response.redirect(new URL('./?shareError=1', self.location.href), 303);
      }
    })());
    return;
  }
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL('./', self.location.href).pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request, {ignoreSearch: true});
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch (error) {
      if (event.request.mode === 'navigate') return cache.match('./index.html');
      throw error;
    }
  }));
});

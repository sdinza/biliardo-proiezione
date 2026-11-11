'use strict';
window.ClubStorage = (() => {
  const database = () => new Promise((resolve, reject) => {
    const request = indexedDB.open('billard-club', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('collections');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  async function transaction(mode, value, key = 'current', remove = false) {
    const db = await database();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('collections', mode);
        const store = tx.objectStore('collections');
        const request = mode === 'readonly' ? store.get(key) : remove ? store.delete(key) : store.put(value, key);
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = tx.onabort = () => reject(tx.error || Error('Stockage indisponible'));
      });
    } finally { db.close(); }
  }
  return {get: () => transaction('readonly'), put: value => transaction('readwrite', value), inbox: () => transaction('readonly', null, 'inbox'), clearInbox: () => transaction('readwrite', null, 'inbox', true)};
})();

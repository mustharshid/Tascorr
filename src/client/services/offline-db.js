/**
 * offline-db.js — IndexedDB wrapper for Tascorr's offline write queue (Phase 3)
 *
 * Stores pending mutations (POST/PATCH/DELETE) that were made while offline
 * so they can be replayed when the connection is restored (Phase 4).
 *
 * DB: tascorr-offline  |  Version: 1
 * Stores:
 *   pending_ops  — queue of unsynced API mutations, keyed by auto-increment id
 */

const DB_NAME = 'tascorr-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_ops';

let _db = null;

/**
 * Opens (or upgrades) the IndexedDB database.
 * Call this once at app start; subsequent calls return the cached instance.
 * @returns {Promise<IDBDatabase>}
 */
export function initDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        // Index by timestamp so we can replay in order
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      _db = event.target.result;
      resolve(_db);
    };

    request.onerror = (event) => {
      console.error('[OfflineDB] Failed to open IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Enqueue a pending API mutation to be synced later.
 * @param {{ method: string, path: string, body: any }} op
 * @returns {Promise<number>} The auto-assigned ID of the queued operation
 */
export async function enqueueOperation(op) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record = {
      method: op.method,
      path: op.path,
      body: op.body,
      timestamp: Date.now(),
      retries: 0,
    };
    const request = store.add(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve all pending operations in insertion (timestamp) order.
 * @returns {Promise<Array>}
 */
export async function getPendingOperations() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const request = index.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Count how many operations are pending.
 * @returns {Promise<number>}
 */
export async function getPendingCount() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove a successfully synced operation from the queue.
 * @param {number} id - The record's auto-increment ID
 * @returns {Promise<void>}
 */
export async function removeOperation(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all pending operations (e.g. after a full sync or hard reset).
 * @returns {Promise<void>}
 */
export async function clearAllOperations() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

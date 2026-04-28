/**
 * offlineAudioCache.ts
 *
 * Stores audio blobs in IndexedDB so PRO/GO+ users can play tracks
 * without an internet connection. The audio is kept in app-private
 * storage — it is never saved to the device file system.
 *
 * Usage:
 *   await saveOfflineTrack(trackId, presignedUrl, meta);
 *   const entry = await getOfflineCacheEntry(trackId);   // → { blob, ... } | null
 *   await removeOfflineTrack(trackId);
 *   const ids = await listCachedTrackIds();
 */

const DB_NAME = "iqa3-offline-audio";
const DB_VERSION = 1;
const STORE_NAME = "tracks";

export interface CachedTrackMeta {
  trackId: string;
  title: string;
  artist: string | null;
  coverArtUrl: string | null;
  durationMs: number | null;
  cachedAt: number; // Date.now()
  expiresAt: number; // Date.now() + TTL
}

export interface CachedTrackEntry extends CachedTrackMeta {
  blob: Blob;
  /** Object URL created on demand — invalidated when the page unloads */
  objectUrl?: string;
}

// ── IndexedDB helpers ──────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "trackId" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<CachedTrackEntry | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as CachedTrackEntry | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, value: CachedTrackEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbGetAllKeys(db: IDBDatabase): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAllKeys();
    req.onsuccess = () => resolve(req.result as string[]);
    req.onerror = () => reject(req.error);
  });
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Fetch audio from the presigned URL and persist it in IndexedDB.
 * Throws if the fetch fails.
 */
export async function saveOfflineTrack(
  meta: Omit<CachedTrackMeta, "cachedAt" | "expiresAt"> & {
    expiresInSeconds: number;
  },
  presignedUrl: string,
): Promise<void> {
  const response = await fetch(presignedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  const now = Date.now();

  const db = await openDB();
  await idbPut(db, {
    trackId: meta.trackId,
    title: meta.title,
    artist: meta.artist,
    coverArtUrl: meta.coverArtUrl,
    durationMs: meta.durationMs,
    cachedAt: now,
    expiresAt: now + meta.expiresInSeconds * 1000,
    blob,
  });
  db.close();
}

/**
 * Retrieve a cached track entry (includes the Blob).
 * Returns null if not cached or if the cached entry has expired.
 */
export async function getOfflineCacheEntry(
  trackId: string,
): Promise<CachedTrackEntry | null> {
  const db = await openDB();
  const entry = await idbGet(db, trackId);
  db.close();

  if (!entry) return null;

  // Remove stale entries silently
  if (Date.now() > entry.expiresAt) {
    await removeOfflineTrack(trackId);
    return null;
  }

  return entry;
}

/**
 * Check whether a track is currently cached (non-expired).
 */
export async function isTrackCached(trackId: string): Promise<boolean> {
  const entry = await getOfflineCacheEntry(trackId);
  return entry !== null;
}

/**
 * Remove a single track from the offline cache.
 */
export async function removeOfflineTrack(trackId: string): Promise<void> {
  const db = await openDB();
  await idbDelete(db, trackId);
  db.close();
}

/**
 * Return all cached track IDs (including possibly expired ones).
 */
export async function listCachedTrackIds(): Promise<string[]> {
  const db = await openDB();
  const keys = await idbGetAllKeys(db);
  db.close();
  return keys;
}

/**
 * Create a temporary Object URL for the cached blob.
 * The caller is responsible for calling URL.revokeObjectURL when done.
 */
export function createObjectUrl(entry: CachedTrackEntry): string {
  return URL.createObjectURL(entry.blob);
}

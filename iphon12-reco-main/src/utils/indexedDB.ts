// =========================================================================
// Educational Whiteboard IndexedDB Persistence Engine
// File: src/utils/indexedDB.ts
// =========================================================================

const DB_NAME = 'NexusLinkEducationalDB';
const STORE_NAME = 'whiteboard_pages';
const DB_VERSION = 1;

export interface EduElementState {
  id: string;
  type: string;
  props: string; // JSON string representing properties
  schemaVersion: string;
  style: {
    left: string;
    top: string;
    width: string;
    height: string;
    transform: string;
  };
}

export interface WhiteboardPageState {
  pageId: string;
  elements: EduElementState[];
  updatedAt: number;
}

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('IndexedDB could not be opened'));
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'pageId' });
      }
    };
  });
}

export async function savePageState(pageState: WhiteboardPageState): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(pageState);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[IndexedDB] Save Failed', error);
  }
}

export async function loadPageState(pageId: string): Promise<WhiteboardPageState | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(pageId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[IndexedDB] Load Failed', error);
    return null;
  }
}


const DB_NAME = 'ThayAI_DB';
const STORE_NAME = 'conversations';
const DB_VERSION = 1;

export interface IDBConversation {
  id: string;
  timestamp: number;
  emotion: string;
  quantum_metrics: any;
  summary?: string; // Future proofing
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

import { cryptoService } from './crypto';

// New Schema for Encrypted Entry
interface EncryptedEntry {
  id: string;
  timestamp: number;
  iv: number[]; // Store as array for IDB compatibility
  cipher: ArrayBuffer;
  version: number;
}

export const dbService = {
  async saveEntry(entry: IDBConversation): Promise<void> {
    if (!entry || !entry.id || !entry.timestamp) {
      console.warn("[DB] Attempted to save invalid entry", entry);
      return;
    }

    try {
      // Encrypt the sensitive payload
      const payload = {
        emotion: entry.emotion,
        quantum_metrics: entry.quantum_metrics,
        summary: entry.summary,
        // We might want to encrypt everything except ID/Timestamp for sorting
      };

      const { iv, cipher } = await cryptoService.encryptData(payload);

      const sealedEntry: EncryptedEntry = {
        id: entry.id,
        timestamp: entry.timestamp,
        iv: Array.from(iv), // Convert TypedArray to normal array for structured clone
        cipher: cipher,
        version: 2 // Mark as encrypted
      };

      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(sealedEntry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("[DB] Encryption Save Failed", e);
      throw e;
    }
  },

  async getAllEntries(): Promise<IDBConversation[]> {
    const db = await openDB();
    const rawEntries: any[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Decrypt and Map
    const results: IDBConversation[] = [];

    for (const raw of rawEntries) {
      if (raw.version === 2 && raw.cipher && raw.iv) {
        try {
          // Decrypt
          const iv = new Uint8Array(raw.iv);
          const decrypted = await cryptoService.decryptData(iv, raw.cipher);
          results.push({
            id: raw.id,
            timestamp: raw.timestamp,
            ...decrypted
          });
        } catch (e) {
          console.warn(`[DB] Failed to decrypt entry ${raw.id}, skipping.`, e);
        }
      } else {
        // Legacy handling: If it looks like old data (plaintext emotion present)
        if (raw.emotion) {
          console.log(`[DB] Migrating legacy entry ${raw.id} on read...`);
          // Optional: We could trigger a rewrite here to encrypt it, 
          // but for now, just return it so we don't lose data.
          // Ideally, we run a background migration job. 
          // For this turn, we just support reading it.
          results.push(raw as IDBConversation);
        }
      }
    }

    return results.sort((a, b) => a.timestamp - b.timestamp);
  },

  async clearAll(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

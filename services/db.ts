import { openDB, IDBPDatabase } from 'idb';
import { VaultService } from './crypto';

const DB_NAME = 'ThayAI_Vault_v1';
const STORE_NAME = 'conversations';
const DB_VERSION = 1;

export interface IDBConversation {
  id: string;
  timestamp: number;
  emotion: string;
  mindfulness_metrics: any;
  summary?: string;
  // Legacy fields might exist, but we prioritize encrypted storage
}

// Encrypted Schema
interface EncryptedEntry {
  id: string;
  timestamp: number;
  iv: number[]; // Store as array for IDB compatibility
  cipher: ArrayBuffer;
  version: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // Key path is 'id'
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const dbService = {
  async saveEntry(entry: IDBConversation): Promise<void> {
    if (!entry || !entry.id || !entry.timestamp) {
      console.warn("[DB] Attempted to save invalid entry", entry);
      return;
    }

    try {
      // 1. Prepare Sensitive Payload
      const payload = {
        emotion: entry.emotion,
        mindfulness_metrics: entry.mindfulness_metrics,
        summary: entry.summary,
      };

      // 2. Encrypt with Vault (AES-GCM)
      // This throws if Vault is locked
      const { iv, cipher } = await VaultService.encrypt(payload);

      // 3. Create Sealed Entry
      const sealedEntry: EncryptedEntry = {
        id: entry.id,
        timestamp: entry.timestamp,
        iv: Array.from(iv), // Convert Uint8Array to plain array for structured clone
        cipher: cipher,
        version: 3 // Version 3 = Vault Encrypted
      };

      const db = await getDB();
      await db.put(STORE_NAME, sealedEntry);

    } catch (e) {
      console.error("[DB] Secure Save Failed", e);
      throw e;
    }
  },

  async getAllEntries(): Promise<IDBConversation[]> {
    if (!VaultService.isAuthenticated()) {
      console.warn("[DB] Vault Locked - Cannot read entries");
      return [];
    }

    try {
      const db = await getDB();
      const rawEntries: EncryptedEntry[] = await db.getAll(STORE_NAME);
      const results: IDBConversation[] = [];

      for (const raw of rawEntries) {
        // Check if it's an encrypted entry
        if (raw.version >= 3 && raw.cipher && raw.iv) {
          try {
            const iv = new Uint8Array(raw.iv);
            const decrypted = await VaultService.decrypt(iv, raw.cipher);
            results.push({
              id: raw.id,
              timestamp: raw.timestamp,
              ...decrypted
            });
          } catch (e) {
            console.warn(`[DB] Decryption failed for ${raw.id}`, e);
          }
        } else if ((raw as any).emotion) {
          // HARDENING: STRICT VAULT POLICY (Blacksmith Protocol)
          // Invariants: No cleartext data shall ever be read into memory space.
          console.warn("[Strict Vault] Blocked legacy cleartext entry:", raw.id);
          // results.push(raw as any); // BLOCKED
        }
      }

      return results.sort((a, b) => a.timestamp - b.timestamp);
    } catch (e) {
      console.error("[DB] Load Failed", e);
      return [];
    }
  },

  async clearAll(): Promise<void> {
    const db = await getDB();
    await db.clear(STORE_NAME);
  }
};

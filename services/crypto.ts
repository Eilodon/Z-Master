
// Operation Vault: Client-Side Encryption Service
// Algorithm: AES-GCM 256-bit
// Key Storage: IndexedDB (Non-exportable)

const KEY_STORAGE_NAME = 'ZenKeys';
const KEY_STORE = 'master_key';
const IV_LENGTH = 12; // Recommended for GCM

export const cryptoService = {
    // --- Key Management ---

    async getOrGenerateKey(): Promise<CryptoKey> {
        const key = await this.retrieveKey();
        if (key) return key;
        return this.generateKey();
    },

    async generateKey(): Promise<CryptoKey> {
        const key = await window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256
            },
            false, // extractable: false (Security critical!)
            ["encrypt", "decrypt"]
        );
        await this.storeKey(key);
        return key;
    },

    async storeKey(key: CryptoKey): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(KEY_STORAGE_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(KEY_STORE)) {
                    db.createObjectStore(KEY_STORE);
                }
            };
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction(KEY_STORE, 'readwrite');
                tx.objectStore(KEY_STORE).put(key, 'root');
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            };
            request.onerror = () => reject(request.error);
        });
    },

    async retrieveKey(): Promise<CryptoKey | undefined> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(KEY_STORAGE_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(KEY_STORE)) {
                    db.createObjectStore(KEY_STORE);
                }
            };
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction(KEY_STORE, 'readonly');
                const req = tx.objectStore(KEY_STORE).get('root');
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            };
            request.onerror = () => reject(request.error);
        });
    },

    // --- Core Operations ---

    async encryptData(data: any): Promise<{ iv: Uint8Array; cipher: ArrayBuffer }> {
        const key = await this.getOrGenerateKey();
        const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const encoded = new TextEncoder().encode(JSON.stringify(data));

        const cipher = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            encoded
        );

        return { iv, cipher };
    },

    async decryptData(iv: Uint8Array, cipher: ArrayBuffer): Promise<any> {
        try {
            const key = await this.retrieveKey();
            if (!key) throw new Error("Missing Key");

            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                cipher
            );

            const decoded = new TextDecoder().decode(decrypted);
            return JSON.parse(decoded);
        } catch (e) {
            console.error("[Crypto] Decryption failed", e);
            throw new Error("DecryptionFailed"); // Caller handles fallback/wipe
        }
    }
};

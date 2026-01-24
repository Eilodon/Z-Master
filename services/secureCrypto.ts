// Secure Cryptographic Operations with Constant-Time Implementation
// Prevents timing attacks and ensures proper memory management

// Constant-time string comparison to prevent timing attacks
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// Secure PIN validation with constant-time comparison
export async function validatePinSecurely(inputPin: string, storedPinHash: string): Promise<boolean> {
  // Hash the input PIN using SHA-256
  const inputHash = await secureHash(inputPin);

  // Use constant-time comparison
  return constantTimeCompare(inputHash, storedPinHash);
}

// Secure hash function using Web Crypto API (SHA-256)
async function secureHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  try {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    // Fallback for environments without crypto.subtle (should never happen in modern browsers)
    console.error('[SecureCrypto] SHA-256 unavailable:', error);
    throw new Error('Secure hashing unavailable');
  }
}

// Legacy sync hash for backward compatibility (marked deprecated)
/** @deprecated Use secureHash() instead - this is cryptographically weak */
export function simpleHash(input: string): string {
  console.warn('[SecureCrypto] simpleHash is deprecated and cryptographically weak');
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Secure memory zeroization
export function secureZeroize(buffer: ArrayBuffer | Uint8Array): void {
  if (buffer instanceof ArrayBuffer) {
    const view = new Uint8Array(buffer);
    view.fill(0);
  } else if (buffer instanceof Uint8Array) {
    buffer.fill(0);
  }
}

// Constant-time array comparison
export function constantTimeArrayCompare(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

// Secure key derivation with proper error handling
export async function deriveKeySecurely(
  pin: string,
  salt: Uint8Array,
  purpose: 'wrap' | 'encrypt'
): Promise<CryptoKey> {
  try {
    // Create purpose-separated key material
    const encoder = new TextEncoder();
    const purposeData = encoder.encode(pin + purpose);

    // Import base key material
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      purposeData,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Derive the final key
    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(salt), // Create copy to avoid mutation
        iterations: 120000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      purpose === 'wrap' ? false : true,
      purpose === 'wrap' ? ['wrapKey', 'unwrapKey'] : ['encrypt', 'decrypt']
    );

    // Zeroize sensitive material
    secureZeroize(purposeData);

    return derivedKey;
  } catch (error) {
    console.error('[SecureCrypto] Key derivation failed:', error);
    throw new Error('Secure key derivation failed');
  }
}

// Secure encryption with proper error handling
export async function encryptSecurely(
  data: any,
  key: CryptoKey
): Promise<{ iv: Uint8Array; cipher: ArrayBuffer }> {
  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));

    const cipher = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    return { iv, cipher };
  } catch (error) {
    console.error('[SecureCrypto] Encryption failed:', error);
    throw new Error('Secure encryption failed');
  }
}

// Secure decryption with proper error handling
export async function decryptSecurely(
  iv: Uint8Array,
  cipher: ArrayBuffer,
  key: CryptoKey
): Promise<any> {
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) }, // Create copy
      key,
      cipher
    );

    const result = JSON.parse(new TextDecoder().decode(decrypted));
    return result;
  } catch (error) {
    console.error('[SecureCrypto] Decryption failed:', error);
    throw new Error('Secure decryption failed');
  }
}

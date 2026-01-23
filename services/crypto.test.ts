
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VaultService } from '../services/crypto';

describe('VaultService (Zero-Knowledge)', () => {

    // Clear DB between tests
    afterEach(async () => {
        // Reset Logic if needed, or rely on fake-indexeddb memory clearing
    });

    it('should initially be locked/unconfigured', async () => {
        expect(VaultService.isAuthenticated()).toBe(false);
        const configured = await VaultService.isConfigured();
        expect(configured).toBe(false);
    });

    it('should setup vault with PIN', async () => {
        await VaultService.setupVault("123456");
        const configured = await VaultService.isConfigured();
        expect(configured).toBe(true);
        expect(VaultService.isAuthenticated()).toBe(true);
    });

    it('should fail to unlock with wrong pin', async () => {
        await VaultService.setupVault("123456");
        VaultService.lockVault();
        expect(VaultService.isAuthenticated()).toBe(false);

        const success = await VaultService.unlockVault("000000");
        expect(success).toBe(false);
        expect(VaultService.isAuthenticated()).toBe(false);
    });

    it('should unlock with correct pin', async () => {
        await VaultService.setupVault("123456");
        VaultService.lockVault();

        const success = await VaultService.unlockVault("123456");
        expect(success).toBe(true);
        expect(VaultService.isAuthenticated()).toBe(true);
    });

    it('should encrypt and decrypt data correctly', async () => {
        await VaultService.setupVault("securePIN");

        const secret = { note: "The Golden Turtle", id: 1 };
        const { iv, cipher } = await VaultService.encrypt(secret);

        expect(iv).toBeDefined();
        expect(cipher).toBeDefined();
        expect(cipher.byteLength).toBeGreaterThan(0);

        const decrypted = await VaultService.decrypt(iv, cipher);
        expect(decrypted).toEqual(secret);
    });

    it('should throw error when encrypting while locked', async () => {
        await VaultService.setupVault("1234");
        VaultService.lockVault();

        await expect(VaultService.encrypt({ foo: "bar" }))
            .rejects.toThrow("VAULT_LOCKED");
    });
});

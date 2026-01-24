
import { describe, it, expect, beforeEach } from 'vitest';
import { dbService } from '../services/db';
import { VaultService } from '../services/crypto';

describe('DB Service (Vault Integrated)', () => {

    beforeEach(async () => {
        await dbService.clearAll();
        VaultService.lockVault(); // Ensure locked start
    });

    it('should NOT return entries if vault is locked', async () => {
        // Setup vault and save one entry
        await VaultService.setupVault("123456");
        await dbService.saveEntry({
            id: 'test-1',
            timestamp: Date.now(),
            emotion: 'joy',
            quantum_metrics: {}
        });

        // Lock it
        VaultService.lockVault();

        // Try to read
        const entries = await dbService.getAllEntries();
        expect(entries).toEqual([]); // Should be empty/blocked
    });

    it('should return decrypted entries if vault is unlocked', async () => {
        await VaultService.setupVault("123456");
        const entry = {
            id: 'test-2',
            timestamp: Date.now(),
            emotion: 'joy',
            quantum_metrics: { val: 1 }
        };

        await dbService.saveEntry(entry);

        const entries = await dbService.getAllEntries();
        expect(entries).toHaveLength(1);
        expect(entries[0].emotion).toBe('joy');
        expect(entries[0].id).toBe('test-2');
    });
});

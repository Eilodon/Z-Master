
import { describe, it, expect } from 'vitest';
import { SafetyGuard } from '../services/safetyGuard';

describe('SafetyGuard (Semantic Engine)', () => {
    it('should allow neutral/positive text', () => {
        const result = SafetyGuard.scanInput("Tôi đang cảm thấy bình an");
        expect(result.isSafe).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should detect extreme negative sentiment (Crisis)', () => {
        // "I want to die, everything is over, painful" -> High negative score
        const input = "Tôi muốn chết, mọi thứ kết thúc rồi, đau khổ quá";
        const result = SafetyGuard.scanInput(input);

        // Sentiment lib might vary, but this should be very negative
        expect(result.score).toBeLessThan(-5);
        expect(result.isSafe).toBe(false);
        expect(result.reason).toBeDefined();
    });

    it('should warn on moderately negative text', () => {
        const input = "Tôi buồn quá";
        const result = SafetyGuard.scanInput(input);

        // Should be negative but maybe safe or warning
        expect(result.score).toBeLessThan(0);
        // Depending on threshold config in file: -4 is warning
    });

    it('should generate mock crisis response', () => {
        const res = SafetyGuard.getMockCrisisResponse("Test Trigger");
        expect(res.emotion).toBe('seeking');
        expect(res.breathing).toBe('4-7-8');
    });
});

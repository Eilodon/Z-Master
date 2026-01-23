import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../src/utils/logger';

describe('Logger Utility', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    
    // Mock process.env
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Development Environment', () => {
    it('should log error messages in development', () => {
      logger.error('Test error', { data: 'test' });
      expect(console.error).toHaveBeenCalledWith('Test error', { data: 'test' });
    });

    it('should log warning messages in development', () => {
      logger.warn('Test warning', { data: 'test' });
      expect(console.warn).toHaveBeenCalledWith('Test warning', { data: 'test' });
    });

    it('should log info messages in development', () => {
      logger.info('Test info', { data: 'test' });
      expect(console.info).toHaveBeenCalledWith('Test info', { data: 'test' });
    });

    it('should log messages in development', () => {
      logger.log('Test log', { data: 'test' });
      expect(console.log).toHaveBeenCalledWith('Test log', { data: 'test' });
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('should not log error messages in production', () => {
      logger.error('Test error', { data: 'test' });
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should not log warning messages in production', () => {
      logger.warn('Test warning', { data: 'test' });
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should not log info messages in production', () => {
      logger.info('Test info', { data: 'test' });
      expect(console.info).not.toHaveBeenCalled();
    });

    it('should not log messages in production', () => {
      logger.log('Test log', { data: 'test' });
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arguments', () => {
      logger.error('Test error');
      expect(console.error).toHaveBeenCalledWith('Test error');
    });

    it('should handle multiple arguments', () => {
      logger.log('Test', 'multiple', 'arguments');
      expect(console.log).toHaveBeenCalledWith('Test', 'multiple', 'arguments');
    });

    it('should handle complex objects', () => {
      const complexObject = {
        nested: { value: 'test' },
        array: [1, 2, 3],
        function: () => 'test'
      };
      
      logger.log('Complex object:', complexObject);
      expect(console.log).toHaveBeenCalledWith('Complex object:', complexObject);
    });
  });
});

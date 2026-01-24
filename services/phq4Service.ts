import { PHQ4Result } from '../types';

const DB_NAME = 'ThayAI_DB';
const STORE_NAME = 'phq4_assessments';
const DB_VERSION = 2; // Increment version to add new store

/**
 * PHQ-4 Service for storing and analyzing clinical assessment results
 */
export class PHQ4Service {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Open IndexedDB with PHQ-4 store
   */
  private static openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create PHQ-4 store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('severity', 'severity', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Save PHQ-4 assessment result
   */
  static async save(result: PHQ4Result): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.put(result);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('[PHQ4Service] Assessment saved:', result.id);
    } catch (error) {
      console.error('[PHQ4Service] Save failed:', error);
      throw error;
    }
  }

  /**
   * Get all PHQ-4 assessments, sorted by timestamp (newest first)
   */
  static async getAll(): Promise<PHQ4Result[]> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const results = (request.result as PHQ4Result[]).sort(
            (a, b) => b.timestamp - a.timestamp
          );
          resolve(results);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('[PHQ4Service] Get all failed:', error);
      return [];
    }
  }

  /**
   * Get latest PHQ-4 assessment
   */
  static async getLatest(): Promise<PHQ4Result | null> {
    const all = await this.getAll();
    return all.length > 0 ? all[0] : null;
  }

  /**
   * Get assessments within date range
   */
  static async getByDateRange(startDate: number, endDate: number): Promise<PHQ4Result[]> {
    const all = await this.getAll();
    return all.filter(r => r.timestamp >= startDate && r.timestamp <= endDate);
  }

  /**
   * Analyze trend over time
   */
  static async analyzeTrend(): Promise<{
    trend: 'improving' | 'stable' | 'worsening' | 'insufficient_data';
    recent_avg: number;
    previous_avg: number;
    change: number;
    message: string;
  }> {
    const all = await this.getAll();

    if (all.length < 2) {
      return {
        trend: 'insufficient_data',
        recent_avg: all[0]?.total_score || 0,
        previous_avg: 0,
        change: 0,
        message: 'Need at least 2 assessments to determine trend'
      };
    }

    // Compare recent assessments (last 2) with previous ones
    const recentCount = Math.min(2, all.length);
    const previousCount = Math.min(2, all.length - recentCount);

    const recent = all.slice(0, recentCount);
    const previous = all.slice(recentCount, recentCount + previousCount);

    const recent_avg = recent.reduce((sum, r) => sum + r.total_score, 0) / recent.length;
    const previous_avg = previous.reduce((sum, r) => sum + r.total_score, 0) / previous.length;
    const change = recent_avg - previous_avg;

    let trend: 'improving' | 'stable' | 'worsening';
    let message: string;

    if (change <= -2) {
      trend = 'improving';
      message = 'Your symptoms are improving. Keep up your practice!';
    } else if (change >= 2) {
      trend = 'worsening';
      message = 'Your symptoms are increasing. Consider reaching out for support.';
    } else {
      trend = 'stable';
      message = 'Your symptoms are stable. Continue monitoring.';
    }

    return { trend, recent_avg, previous_avg, change, message };
  }

  /**
   * Get summary statistics
   */
  static async getSummary(): Promise<{
    total_assessments: number;
    latest_score: number;
    latest_severity: string;
    average_score: number;
    trend: string;
  }> {
    const all = await this.getAll();
    const latest = all[0];
    const { trend } = await this.analyzeTrend();

    const average_score = all.length > 0
      ? all.reduce((sum, r) => sum + r.total_score, 0) / all.length
      : 0;

    return {
      total_assessments: all.length,
      latest_score: latest?.total_score || 0,
      latest_severity: latest?.severity || 'unknown',
      average_score: Math.round(average_score * 10) / 10,
      trend
    };
  }

  /**
   * Check if user should take assessment (weekly recommendation)
   */
  static async shouldTakeAssessment(): Promise<boolean> {
    const latest = await this.getLatest();
    if (!latest) return true; // First time - should take

    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    const timeSinceLastAssessment = Date.now() - latest.timestamp;

    return timeSinceLastAssessment >= ONE_WEEK;
  }

  /**
   * Delete all assessments (for testing/reset)
   */
  static async clearAll(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('[PHQ4Service] All assessments cleared');
    } catch (error) {
      console.error('[PHQ4Service] Clear failed:', error);
    }
  }
}

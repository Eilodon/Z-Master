import { StreakData } from '../types';

const DB_NAME = 'ThayAI_DB';
const STORE_NAME = 'streaks';
const DB_VERSION = 4; // Increment version

/**
 * Streak Service for engagement tracking
 * Lightweight gamification to encourage daily practice
 */
export class StreakService {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  private static cache: StreakData | null = null;

  private static openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'user_id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Get or create streak data for user
   */
  static async getStreak(userId: string = 'default'): Promise<StreakData> {
    if (this.cache && this.cache.user_id === userId) {
      return this.cache;
    }

    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      const data = await new Promise<StreakData | undefined>((resolve, reject) => {
        const request = store.get(userId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (data) {
        this.cache = data;
        return data;
      }

      // Create new streak data
      const newData: StreakData = {
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_check_in: 0,
        total_check_ins: 0,
        milestones: []
      };

      await this.saveStreak(newData);
      return newData;
    } catch (error) {
      console.error('[Streak] Get failed:', error);
      return {
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_check_in: 0,
        total_check_ins: 0,
        milestones: []
      };
    }
  }

  /**
   * Save streak data
   */
  static async saveStreak(data: StreakData): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      this.cache = data;
    } catch (error) {
      console.error('[Streak] Save failed:', error);
    }
  }

  /**
   * Check in for today (call this on any user activity)
   */
  static async checkIn(userId: string = 'default'): Promise<{
    streak: StreakData;
    isNewDay: boolean;
    newMilestones: StreakData['milestones'];
  }> {
    const streak = await this.getStreak(userId);
    const now = Date.now();
    const today = this.getDateKey(now);
    const lastCheckInDay = streak.last_check_in ? this.getDateKey(streak.last_check_in) : 0;

    // Already checked in today
    if (today === lastCheckInDay) {
      return { streak, isNewDay: false, newMilestones: [] };
    }

    const yesterday = this.getDateKey(now - 24 * 60 * 60 * 1000);

    // Check if streak continues or breaks
    if (lastCheckInDay === yesterday) {
      // Streak continues
      streak.current_streak++;
    } else if (lastCheckInDay < yesterday) {
      // Streak broken
      streak.current_streak = 1;
    }

    // Update longest streak
    if (streak.current_streak > streak.longest_streak) {
      streak.longest_streak = streak.current_streak;
    }

    // Update totals
    streak.last_check_in = now;
    streak.total_check_ins++;

    // Check for new milestones
    const newMilestones = this.checkMilestones(streak);

    await this.saveStreak(streak);

    return { streak, isNewDay: true, newMilestones };
  }

  /**
   * Get date key (YYYYMMDD) for comparison
   */
  private static getDateKey(timestamp: number): number {
    const date = new Date(timestamp);
    return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  }

  /**
   * Check and award new milestones
   */
  private static checkMilestones(streak: StreakData): StreakData['milestones'] {
    const newMilestones: StreakData['milestones'] = [];

    const milestoneChecks: Array<{
      type: StreakData['milestones'][0]['type'];
      condition: boolean;
    }> = [
      { type: 'streak_3', condition: streak.current_streak === 3 },
      { type: 'streak_7', condition: streak.current_streak === 7 },
      { type: 'streak_30', condition: streak.current_streak === 30 },
      { type: 'streak_100', condition: streak.current_streak === 100 },
      { type: 'total_10', condition: streak.total_check_ins === 10 },
      { type: 'total_50', condition: streak.total_check_ins === 50 },
      { type: 'total_100', condition: streak.total_check_ins === 100 }
    ];

    for (const check of milestoneChecks) {
      if (check.condition && !streak.milestones.some(m => m.type === check.type)) {
        const milestone = {
          type: check.type,
          achieved_at: Date.now(),
          celebrated: false
        };
        streak.milestones.push(milestone);
        newMilestones.push(milestone);
      }
    }

    return newMilestones;
  }

  /**
   * Mark milestone as celebrated
   */
  static async celebrateMilestone(
    milestoneType: StreakData['milestones'][0]['type'],
    userId: string = 'default'
  ): Promise<void> {
    const streak = await this.getStreak(userId);
    const milestone = streak.milestones.find(m => m.type === milestoneType);

    if (milestone) {
      milestone.celebrated = true;
      await this.saveStreak(streak);
    }
  }

  /**
   * Get milestone info for display
   */
  static getMilestoneInfo(type: StreakData['milestones'][0]['type'], language: 'vi' | 'en'): {
    title: string;
    description: string;
    emoji: string;
  } {
    const info = {
      streak_3: {
        title: language === 'vi' ? '3 Ngày Liên Tiếp' : '3-Day Streak',
        description: language === 'vi' ? 'Bạn đã thực hành 3 ngày liên tiếp!' : 'You practiced 3 days in a row!',
        emoji: '🔥'
      },
      streak_7: {
        title: language === 'vi' ? 'Tuần Đầu Tiên' : 'First Week',
        description: language === 'vi' ? '7 ngày thực hành liên tục!' : '7 consecutive days of practice!',
        emoji: '⭐'
      },
      streak_30: {
        title: language === 'vi' ? 'Thành Thạo' : 'Mastery',
        description: language === 'vi' ? '30 ngày chánh niệm!' : '30 days of mindfulness!',
        emoji: '🌟'
      },
      streak_100: {
        title: language === 'vi' ? 'Huyền Thoại' : 'Legend',
        description: language === 'vi' ? '100 ngày không bỏ lỡ!' : '100 days without missing!',
        emoji: '👑'
      },
      total_10: {
        title: language === 'vi' ? 'Khởi Đầu' : 'Getting Started',
        description: language === 'vi' ? '10 lần thực hành!' : '10 practice sessions!',
        emoji: '🌱'
      },
      total_50: {
        title: language === 'vi' ? 'Kiên Trì' : 'Committed',
        description: language === 'vi' ? '50 lần thực hành!' : '50 practice sessions!',
        emoji: '🌿'
      },
      total_100: {
        title: language === 'vi' ? 'Hành Giả' : 'Practitioner',
        description: language === 'vi' ? '100 lần thực hành!' : '100 practice sessions!',
        emoji: '🌳'
      }
    };

    return info[type];
  }

  /**
   * Clear all streak data
   */
  static async clearStreak(userId: string = 'default'): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(userId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      this.cache = null;
      console.log('[Streak] Cleared');
    } catch (error) {
      console.error('[Streak] Clear failed:', error);
    }
  }
}

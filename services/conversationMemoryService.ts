import { ConversationMemory } from '../types';

const DB_NAME = 'ThayAI_DB';
const STORE_NAME = 'conversation_memory';
const DB_VERSION = 3; // Increment version

/**
 * Conversation Memory Service
 * Tracks narrative arc, recurring themes, and emotional patterns over time
 */
export class ConversationMemoryService {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  private static memoryCache: ConversationMemory | null = null;

  /**
   * Open IndexedDB with conversation memory store
   */
  private static openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create conversation memory store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'user_id' });
          store.createIndex('user_id', 'user_id', { unique: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Initialize or get existing memory for user
   */
  static async getMemory(userId: string = 'default'): Promise<ConversationMemory> {
    // Check cache first
    if (this.memoryCache && this.memoryCache.user_id === userId) {
      return this.memoryCache;
    }

    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      const memory = await new Promise<ConversationMemory | undefined>((resolve, reject) => {
        const request = store.get(userId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (memory) {
        // Convert Map back from array (IndexedDB doesn't support Map)
        if (Array.isArray(memory.emotional_baseline.triggers)) {
          memory.emotional_baseline.triggers = new Map(memory.emotional_baseline.triggers as any);
        }
        this.memoryCache = memory;
        return memory;
      }

      // Create new memory
      const newMemory: ConversationMemory = {
        user_id: userId,
        narrative: {
          key_events: [],
          recurring_themes: [],
          progress_markers: []
        },
        emotional_baseline: {
          baseline_mood: 5,
          current_deviation: 0,
          triggers: new Map()
        },
        clinical_tracking: {
          phq4_scores: [],
          last_assessment: 0,
          trend: 'stable'
        }
      };

      await this.saveMemory(newMemory);
      return newMemory;
    } catch (error) {
      console.error('[ConversationMemory] Get failed:', error);
      // Return default memory
      return {
        user_id: userId,
        narrative: {
          key_events: [],
          recurring_themes: [],
          progress_markers: []
        },
        emotional_baseline: {
          baseline_mood: 5,
          current_deviation: 0,
          triggers: new Map()
        },
        clinical_tracking: {
          phq4_scores: [],
          last_assessment: 0,
          trend: 'stable'
        }
      };
    }
  }

  /**
   * Save conversation memory
   */
  static async saveMemory(memory: ConversationMemory): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      // Convert Map to array for IndexedDB storage
      const saveData = {
        ...memory,
        emotional_baseline: {
          ...memory.emotional_baseline,
          triggers: Array.from(memory.emotional_baseline.triggers.entries())
        }
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(saveData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      this.memoryCache = memory;
      console.log('[ConversationMemory] Saved:', memory.user_id);
    } catch (error) {
      console.error('[ConversationMemory] Save failed:', error);
    }
  }

  /**
   * Add a key event to narrative
   */
  static async addKeyEvent(
    event: string,
    emotion: string,
    userId: string = 'default'
  ): Promise<void> {
    const memory = await this.getMemory(userId);

    memory.narrative.key_events.push({
      event,
      emotion,
      timestamp: Date.now()
    });

    // Keep only last 50 events
    if (memory.narrative.key_events.length > 50) {
      memory.narrative.key_events = memory.narrative.key_events.slice(-50);
    }

    await this.saveMemory(memory);
  }

  /**
   * Add or update recurring theme
   */
  static async updateTheme(theme: string, userId: string = 'default'): Promise<void> {
    const memory = await this.getMemory(userId);

    if (!memory.narrative.recurring_themes.includes(theme)) {
      memory.narrative.recurring_themes.push(theme);

      // Keep only top 10 themes
      if (memory.narrative.recurring_themes.length > 10) {
        memory.narrative.recurring_themes = memory.narrative.recurring_themes.slice(-10);
      }
    }

    await this.saveMemory(memory);
  }

  /**
   * Add progress marker
   */
  static async addProgressMarker(marker: string, userId: string = 'default'): Promise<void> {
    const memory = await this.getMemory(userId);

    if (!memory.narrative.progress_markers.includes(marker)) {
      memory.narrative.progress_markers.push(marker);

      // Keep only last 20 markers
      if (memory.narrative.progress_markers.length > 20) {
        memory.narrative.progress_markers = memory.narrative.progress_markers.slice(-20);
      }
    }

    await this.saveMemory(memory);
  }

  /**
   * Update emotional baseline based on recent mood scores
   */
  static async updateEmotionalBaseline(
    moodScore: number,
    userId: string = 'default'
  ): Promise<void> {
    const memory = await this.getMemory(userId);

    // Moving average for baseline
    const alpha = 0.1; // Smoothing factor
    memory.emotional_baseline.baseline_mood =
      alpha * moodScore + (1 - alpha) * memory.emotional_baseline.baseline_mood;

    // Calculate deviation
    memory.emotional_baseline.current_deviation =
      moodScore - memory.emotional_baseline.baseline_mood;

    await this.saveMemory(memory);
  }

  /**
   * Track trigger (e.g., "Monday mornings" → stress spike)
   */
  static async trackTrigger(
    trigger: string,
    intensity: number,
    userId: string = 'default'
  ): Promise<void> {
    const memory = await this.getMemory(userId);

    const currentIntensity = memory.emotional_baseline.triggers.get(trigger) || 0;
    const updatedIntensity = (currentIntensity + intensity) / 2; // Average

    memory.emotional_baseline.triggers.set(trigger, updatedIntensity);

    // Keep only top 15 triggers
    if (memory.emotional_baseline.triggers.size > 15) {
      const sorted = Array.from(memory.emotional_baseline.triggers.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
      memory.emotional_baseline.triggers = new Map(sorted);
    }

    await this.saveMemory(memory);
  }

  /**
   * Detect themes from conversation text using pattern matching
   */
  static detectThemes(text: string): string[] {
    const themes: string[] = [];
    const lowerText = text.toLowerCase();

    const themePatterns = {
      'work stress': ['công việc', 'work', 'job', 'deadline', 'boss', 'sếp', 'áp lực', 'stress'],
      'family conflict': ['gia đình', 'family', 'bố', 'mẹ', 'con', 'vợ', 'chồng', 'parents', 'spouse'],
      'relationship issues': ['tình yêu', 'love', 'relationship', 'breakup', 'chia tay', 'người yêu'],
      'financial worry': ['tiền', 'money', 'financial', 'debt', 'nợ', 'chi tiêu'],
      'health anxiety': ['sức khỏe', 'health', 'sick', 'bệnh', 'pain', 'đau'],
      'loneliness': ['cô đơn', 'lonely', 'alone', 'isolated', 'cô lập'],
      'self-doubt': ['tự ti', 'doubt', 'insecure', 'không tự tin', 'worthless'],
      'grief': ['mất', 'loss', 'grief', 'death', 'qua đời', 'buồn']
    };

    for (const [theme, keywords] of Object.entries(themePatterns)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes;
  }

  /**
   * Detect progress markers from conversation
   */
  static detectProgressMarkers(text: string): string[] {
    const markers: string[] = [];
    const lowerText = text.toLowerCase();

    const progressPatterns = {
      'started exercising': ['bắt đầu tập', 'started exercise', 'gym', 'workout'],
      'improved sleep': ['ngủ ngon', 'sleep better', 'rest well'],
      'had difficult conversation': ['nói chuyện khó', 'difficult talk', 'confronted'],
      'set boundaries': ['đặt ranh giới', 'set boundary', 'said no'],
      'practiced mindfulness': ['thiền', 'meditate', 'breathing', 'hít thở'],
      'reached out for help': ['tìm giúp đỡ', 'asked for help', 'sought support']
    };

    for (const [marker, keywords] of Object.entries(progressPatterns)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        markers.push(marker);
      }
    }

    return markers;
  }

  /**
   * Detect temporal triggers (time-based patterns)
   */
  static detectTrigger(text: string): string | null {
    const lowerText = text.toLowerCase();

    const triggerPatterns: { [key: string]: string[] } = {
      'Monday mornings': ['monday', 'thứ hai', 'đầu tuần'],
      'Sunday evenings': ['sunday night', 'chủ nhật tối', 'cuối tuần'],
      'weekends': ['weekend', 'cuối tuần'],
      'mornings': ['morning', 'sáng', 'wake up'],
      'nights': ['night', 'tối', 'evening'],
      'after work': ['after work', 'tan làm', 'về nhà']
    };

    for (const [trigger, keywords] of Object.entries(triggerPatterns)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return trigger;
      }
    }

    return null;
  }

  /**
   * Process conversation and update memory
   */
  static async processConversation(
    userMessage: string,
    emotion: string,
    userId: string = 'default'
  ): Promise<void> {
    // Detect themes
    const themes = this.detectThemes(userMessage);
    for (const theme of themes) {
      await this.updateTheme(theme, userId);
    }

    // Detect progress markers
    const markers = this.detectProgressMarkers(userMessage);
    for (const marker of markers) {
      await this.addProgressMarker(marker, userId);
    }

    // Detect trigger
    const trigger = this.detectTrigger(userMessage);
    if (trigger) {
      const intensity = emotion === 'stressed' || emotion === 'anxious' ? 0.8 : 0.5;
      await this.trackTrigger(trigger, intensity, userId);
    }

    // Add as key event if significant emotion
    const significantEmotions = ['stressed', 'anxious', 'sad', 'lonely'];
    if (significantEmotions.includes(emotion)) {
      await this.addKeyEvent(userMessage.slice(0, 100), emotion, userId);
    }
  }

  /**
   * Get narrative summary for AI context
   */
  static async getNarrativeSummary(userId: string = 'default'): Promise<string> {
    const memory = await this.getMemory(userId);

    const recentEvents = memory.narrative.key_events.slice(-5);
    const topThemes = memory.narrative.recurring_themes.slice(-3);
    const recentProgress = memory.narrative.progress_markers.slice(-3);

    let summary = '';

    if (topThemes.length > 0) {
      summary += `Recurring themes: ${topThemes.join(', ')}. `;
    }

    if (recentProgress.length > 0) {
      summary += `Recent progress: ${recentProgress.join(', ')}. `;
    }

    if (recentEvents.length > 0) {
      summary += `Recent concerns: ${recentEvents.map(e => e.emotion).join(', ')}. `;
    }

    const deviation = memory.emotional_baseline.current_deviation;
    if (Math.abs(deviation) > 1.5) {
      summary += `Mood ${deviation > 0 ? 'elevated' : 'lower'} than usual. `;
    }

    return summary.trim();
  }

  /**
   * Clear all memory (for testing/reset)
   */
  static async clearMemory(userId: string = 'default'): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(userId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      this.memoryCache = null;
      console.log('[ConversationMemory] Cleared for user:', userId);
    } catch (error) {
      console.error('[ConversationMemory] Clear failed:', error);
    }
  }
}

// --- EXTREME REQUEST QUEUING SYSTEM ---
// Implements Twitter-style request throttling + AWS SQS patterns
// Prevents API rate limiting with intelligent backoff and batching

import * as React from 'react';
import { logger } from '../src/utils/logger';

interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  priority: 'low' | 'medium' | 'high' | 'critical';
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  nextAttemptAt: number;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
}

interface QueueMetrics {
  totalRequests: number;
  pendingRequests: number;
  processingRequests: number;
  completedRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  queueDepth: number;
  rateLimitHits: number;
}

class ExtremeRequestQueue {
  private static instance: ExtremeRequestQueue;
  private queue = new Map<string, QueuedRequest>();
  private processing = new Set<string>();
  private isProcessing = false;
  private batchSize = 5;
  private processingInterval = 100; // 100ms
  private rateLimitDelay = 1000; // 1 second base delay
  private maxQueueSize = 100;
  private metrics: QueueMetrics = {
    totalRequests: 0,
    pendingRequests: 0,
    processingRequests: 0,
    completedRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    queueDepth: 0,
    rateLimitHits: 0
  };

  private constructor() {
    this.startProcessing();
  }

  static getInstance(): ExtremeRequestQueue {
    if (!ExtremeRequestQueue.instance) {
      ExtremeRequestQueue.instance = new ExtremeRequestQueue();
    }
    return ExtremeRequestQueue.instance;
  }

  // --- REQUEST ENQUEUEMENT ---
  async enqueue(
    url: string,
    options: RequestInit = {},
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      const now = Date.now();
      
      const request: QueuedRequest = {
        id: requestId,
        url,
        options,
        priority,
        attempts: 0,
        maxAttempts: priority === 'critical' ? 5 : 3,
        createdAt: now,
        nextAttemptAt: now,
        resolve,
        reject
      };

      // Check queue size limit
      if (this.queue.size >= this.maxQueueSize) {
        // Remove oldest low-priority requests
        this.evictLowPriorityRequests();
      }

      this.queue.set(requestId, request);
      this.metrics.totalRequests++;
      this.metrics.pendingRequests++;
      
      logger.log(`[RequestQueue] Enqueued request: ${requestId} (${priority})`);
    });
  }

  // --- BATCH PROCESSING ---
  private startProcessing(): void {
    setInterval(() => {
      this.processBatch();
    }, this.processingInterval);
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.queue.size === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      const batch = this.getNextBatch();
      
      if (batch.length === 0) {
        return;
      }

      // Process requests in parallel with concurrency control
      const promises = batch.map(request => this.processRequest(request));
      await Promise.allSettled(promises);
      
    } catch (error) {
      logger.error('[RequestQueue] Batch processing error:', error);
    } finally {
      this.isProcessing = false;
      this.updateMetrics();
    }
  }

  private getNextBatch(): QueuedRequest[] {
    const now = Date.now();
    const readyRequests = Array.from(this.queue.values())
      .filter(request => request.nextAttemptAt <= now)
      .sort((a, b) => {
        // Priority ordering: critical > high > medium > low
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by creation time (FIFO)
        return a.createdAt - b.createdAt;
      });

    return readyRequests.slice(0, this.batchSize);
  }

  private async processRequest(request: QueuedRequest): Promise<void> {
    this.processing.add(request.id);
    this.metrics.processingRequests++;
    this.metrics.pendingRequests--;

    const startTime = performance.now();

    try {
      const response = await fetch(request.url, {
        ...request.options,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = performance.now() - startTime;
      this.updateAverageResponseTime(responseTime);

      // Check for rate limiting
      if (response.status === 429) {
        this.handleRateLimit(request);
        return;
      }

      // Check for server errors
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Success
      this.queue.delete(request.id);
      this.processing.delete(request.id);
      this.metrics.processingRequests--;
      this.metrics.completedRequests++;
      
      request.resolve(response);
      logger.log(`[RequestQueue] Completed request: ${request.id}`);

    } catch (error) {
      request.attempts++;
      
      if (request.attempts >= request.maxAttempts) {
        // Max attempts reached - fail the request
        this.queue.delete(request.id);
        this.processing.delete(request.id);
        this.metrics.processingRequests--;
        this.metrics.failedRequests++;
        
        request.reject(error as Error);
        logger.error(`[RequestQueue] Failed request: ${request.id} (${request.attempts} attempts)`);
      } else {
        // Retry with exponential backoff
        const backoffDelay = Math.pow(2, request.attempts) * this.rateLimitDelay;
        request.nextAttemptAt = Date.now() + backoffDelay;
        
        logger.warn(`[RequestQueue] Retrying request: ${request.id} (attempt ${request.attempts})`);
      }
    }
  }

  // --- RATE LIMIT HANDLING ---
  private handleRateLimit(request: QueuedRequest): void {
    this.metrics.rateLimitHits++;
    
    // Parse Retry-After header if available
    const retryAfter = this.parseRetryAfter(request.options);
    const delay = Math.max(retryAfter, this.rateLimitDelay * Math.pow(2, request.attempts));
    
    request.nextAttemptAt = Date.now() + delay;
    logger.warn(`[RequestQueue] Rate limited request: ${request.id} (retry after ${delay}ms)`);
  }

  private parseRetryAfter(options: RequestInit): number {
    // This would parse actual Retry-After header from response
    // For now, return default delay
    return this.rateLimitDelay;
  }

  // --- QUEUE MANAGEMENT ---
  private evictLowPriorityRequests(): void {
    const lowPriorityRequests = Array.from(this.queue.values())
      .filter(request => request.priority === 'low')
      .sort((a, b) => a.createdAt - b.createdAt);

    const toEvict = lowPriorityRequests.slice(0, 10); // Evict oldest 10
    
    for (const request of toEvict) {
      this.queue.delete(request.id);
      request.reject(new Error('Request evicted due to queue overflow'));
      this.metrics.pendingRequests--;
      this.metrics.failedRequests++;
    }
    
    logger.warn(`[RequestQueue] Evicted ${toEvict.length} low-priority requests`);
  }

  // --- METRICS & MONITORING ---
  private updateMetrics(): void {
    this.metrics.queueDepth = this.queue.size;
    this.metrics.pendingRequests = this.queue.size - this.processing.size;
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalResponseTime = this.metrics.averageResponseTime * this.metrics.completedRequests;
    this.metrics.averageResponseTime = (totalResponseTime + responseTime) / (this.metrics.completedRequests + 1);
  }

  getMetrics(): QueueMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  // --- UTILITY METHODS ---
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- QUEUE CONTROL ---
  pause(): void {
    this.isProcessing = true;
    logger.info('[RequestQueue] Processing paused');
  }

  resume(): void {
    this.isProcessing = false;
    logger.info('[RequestQueue] Processing resumed');
  }

  clear(): void {
    // Cancel all pending requests
    for (const request of this.queue.values()) {
      request.reject(new Error('Request cancelled due to queue clear'));
    }
    
    this.queue.clear();
    this.processing.clear();
    this.metrics.pendingRequests = 0;
    this.metrics.processingRequests = 0;
    
    logger.info('[RequestQueue] Queue cleared');
  }

  // --- PRIORITY ADJUSTMENT ---
  adjustPriority(requestId: string, newPriority: 'low' | 'medium' | 'high' | 'critical'): boolean {
    const request = this.queue.get(requestId);
    if (request) {
      request.priority = newPriority;
      logger.log(`[RequestQueue] Adjusted priority: ${requestId} -> ${newPriority}`);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const requestQueue = ExtremeRequestQueue.getInstance();

// Hook for React components
export function useRequestQueue() {
  const [metrics, setMetrics] = React.useState<QueueMetrics | null>(null);

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(requestQueue.getMetrics());
    };

    const interval = setInterval(updateMetrics, 1000);
    updateMetrics();

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    metrics,
    enqueue: requestQueue.enqueue.bind(requestQueue),
    pause: requestQueue.pause.bind(requestQueue),
    resume: requestQueue.resume.bind(requestQueue),
    clear: requestQueue.clear.bind(requestQueue),
    adjustPriority: requestQueue.adjustPriority.bind(requestQueue)
  };
}

// Enhanced fetch wrapper with automatic queuing
export function queuedFetch(
  url: string,
  options: RequestInit = {},
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<Response> {
  return requestQueue.enqueue(url, options, priority);
}

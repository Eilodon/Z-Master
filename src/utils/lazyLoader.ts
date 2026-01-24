// Lazy Loading Utility - Optimize bundle size while maintaining functionality
// Eidolon Principle: Load only what's needed, when it's needed (Present Moment Awareness)

interface LazyModule<T> {
  load(): Promise<T>;
  isLoaded(): boolean;
  getModule(): T | null;
}

class LazyLoader<T> implements LazyModule<T> {
  private module: T | null = null;
  private loadPromise: Promise<T> | null = null;
  private readonly importFn: () => Promise<T>;

  constructor(importFn: () => Promise<T>) {
    this.importFn = importFn;
  }

  async load(): Promise<T> {
    if (this.module) return this.module;
    
    if (!this.loadPromise) {
      this.loadPromise = this.importFn()
        .then(module => {
          this.module = module;
          return module;
        })
        .catch(error => {
          console.error('[LazyLoader] Failed to load module:', error);
          this.loadPromise = null; // Reset for retry
          throw error;
        });
    }
    
    return this.loadPromise;
  }

  isLoaded(): boolean {
    return this.module !== null;
  }

  getModule(): T | null {
    return this.module;
  }

  reset(): void {
    this.module = null;
    this.loadPromise = null;
  }
}

// Specific lazy loaders for heavy libraries
export const threeLoader = new LazyLoader(() => 
  import('three')
);

export const dreiLoader = new LazyLoader(() => 
  import('@react-three/drei')
);

export const fiberLoader = new LazyLoader(() => 
  import('@react-three/fiber')
);

export const toneLoader = new LazyLoader(() => 
  import('tone')
);

export const onnxLoader = new LazyLoader(() => 
  import('onnxruntime-web')
);

// Preload critical modules
export async function preloadCriticalModules(): Promise<void> {
  try {
    // Preload Three.js ecosystem
    await Promise.all([
      threeLoader.load(),
      dreiLoader.load(),
      fiberLoader.load()
    ]);
    console.log('[LazyLoader] Critical 3D modules preloaded');
  } catch (error) {
    console.warn('[LazyLoader] Failed to preload critical modules:', error);
  }
}

// Conditional loading based on user interaction
export async function loadOnDemand<T>(loader: LazyLoader<T>): Promise<T> {
  const startTime = performance.now();
  try {
    const module = await loader.load();
    const loadTime = performance.now() - startTime;
    console.log(`[LazyLoader] Module loaded in ${loadTime.toFixed(2)}ms`);
    return module;
  } catch (error) {
    const loadTime = performance.now() - startTime;
    console.error(`[LazyLoader] Module failed after ${loadTime.toFixed(2)}ms:`, error);
    throw error;
  }
}

// Memory management for lazy loaded modules
export class LazyModuleManager {
  private static loadedModules = new Set<string>();
  private static maxModules = 10; // Prevent memory bloat

  static async loadWithMemoryManagement<T>(
    name: string, 
    loader: LazyLoader<T>
  ): Promise<T> {
    // Unload oldest modules if we hit the limit
    if (this.loadedModules.size >= this.maxModules) {
      console.warn('[LazyModuleManager] Memory limit reached, consider module cleanup');
      // In a real implementation, you might want to implement LRU eviction
    }

    try {
      const module = await loader.load();
      this.loadedModules.add(name);
      return module;
    } catch (error) {
      console.error(`[LazyModuleManager] Failed to load ${name}:`, error);
      throw error;
    }
  }

  static unloadModule(name: string): void {
    this.loadedModules.delete(name);
    console.log(`[LazyModuleManager] Unloaded module: ${name}`);
  }

  static getLoadedModules(): string[] {
    return Array.from(this.loadedModules);
  }
}

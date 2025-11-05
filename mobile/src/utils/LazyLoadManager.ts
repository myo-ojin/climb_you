/**
 * LazyLoadManager
 * 非クリティカルなサービスやモジュールの遅延初期化を管理
 *
 * 機能:
 * - 必要になるまでサービスの初期化を遅延
 * - 初期化状態の管理
 * - バックグラウンド初期化のスケジューリング
 * - 起動時間の最適化
 */

type LazyService = () => Promise<void>;

interface ServiceConfig {
  name: string;
  initializer: LazyService;
  priority: 'high' | 'medium' | 'low';
  initialized: boolean;
}

class LazyLoadManagerClass {
  private services: Map<string, ServiceConfig> = new Map();
  private isInitializing: boolean = false;

  /**
   * サービスを登録
   */
  register(name: string, initializer: LazyService, priority: 'high' | 'medium' | 'low' = 'low') {
    this.services.set(name, {
      name,
      initializer,
      priority,
      initialized: false,
    });
  }

  /**
   * 特定のサービスを初期化
   */
  async initialize(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service) {
      console.warn(`[LazyLoadManager] Service "${serviceName}" not found`);
      return;
    }

    if (service.initialized) {
      console.log(`[LazyLoadManager] Service "${serviceName}" already initialized`);
      return;
    }

    try {
      console.log(`[LazyLoadManager] Initializing service "${serviceName}"...`);
      await service.initializer();
      service.initialized = true;
      console.log(`[LazyLoadManager] Service "${serviceName}" initialized`);
    } catch (error) {
      console.error(`[LazyLoadManager] Failed to initialize service "${serviceName}":`, error);
      throw error;
    }
  }

  /**
   * 優先度別にサービスを初期化
   */
  async initializeByPriority(priority: 'high' | 'medium' | 'low'): Promise<void> {
    const servicesToInitialize = Array.from(this.services.values()).filter(
      (service) => service.priority === priority && !service.initialized
    );

    if (servicesToInitialize.length === 0) {
      console.log(`[LazyLoadManager] No services with priority "${priority}" to initialize`);
      return;
    }

    console.log(
      `[LazyLoadManager] Initializing ${servicesToInitialize.length} services with priority "${priority}"`
    );

    await Promise.all(servicesToInitialize.map((service) => this.initialize(service.name)));
  }

  /**
   * すべての未初期化サービスを初期化
   */
  async initializeAll(): Promise<void> {
    if (this.isInitializing) {
      console.log('[LazyLoadManager] Already initializing all services');
      return;
    }

    this.isInitializing = true;

    try {
      // 優先度順に初期化
      await this.initializeByPriority('high');
      await this.initializeByPriority('medium');
      await this.initializeByPriority('low');

      console.log('[LazyLoadManager] All services initialized');
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * バックグラウンドで初期化（アイドル時）
   */
  initializeInBackground() {
    // requestIdleCallbackを使用（React Nativeでは非対応のため、setTimeoutで代用）
    setTimeout(() => {
      this.initializeAll().catch((error) => {
        console.error('[LazyLoadManager] Background initialization failed:', error);
      });
    }, 1000); // 1秒後にバックグラウンド初期化開始
  }

  /**
   * サービスの初期化状態を確認
   */
  isInitialized(serviceName: string): boolean {
    const service = this.services.get(serviceName);
    return service ? service.initialized : false;
  }

  /**
   * すべてのサービスの初期化状態を取得
   */
  getStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.services.forEach((service) => {
      status[service.name] = service.initialized;
    });
    return status;
  }

  /**
   * サービスを登録解除
   */
  unregister(serviceName: string) {
    this.services.delete(serviceName);
  }

  /**
   * すべてのサービスをクリア
   */
  clear() {
    this.services.clear();
    this.isInitializing = false;
  }
}

// シングルトンインスタンス
export const LazyLoadManager = new LazyLoadManagerClass();

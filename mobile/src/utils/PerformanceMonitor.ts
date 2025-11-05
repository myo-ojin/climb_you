/**
 * PerformanceMonitor
 * アプリのパフォーマンス（起動時間、メモリ使用量）を監視
 *
 * 機能:
 * - 起動時間の計測
 * - メモリ使用量の計測
 * - パフォーマンスメトリクスのログ出力
 * - 開発時のパフォーマンスレポート
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

interface MemoryMetric {
  timestamp: number;
  jsHeapSizeLimit?: number; // Web only
  totalJSHeapSize?: number; // Web only
  usedJSHeapSize?: number; // Web only
}

class PerformanceMonitorClass {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private memoryMetrics: MemoryMetric[] = [];
  private appStartTime: number = Date.now();
  private enabled: boolean = __DEV__; // 開発環境のみ有効

  /**
   * パフォーマンスモニターを有効化/無効化
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * 計測開始
   */
  start(metricName: string) {
    if (!this.enabled) return;

    this.metrics.set(metricName, {
      name: metricName,
      startTime: Date.now(),
    });

    console.log(`[PerformanceMonitor] ⏱️  ${metricName} started`);
  }

  /**
   * 計測終了
   */
  end(metricName: string) {
    if (!this.enabled) return;

    const metric = this.metrics.get(metricName);
    if (!metric) {
      console.warn(`[PerformanceMonitor] ⚠️  ${metricName} not found`);
      return;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    console.log(`[PerformanceMonitor] ✅ ${metricName} completed in ${duration}ms`);

    this.metrics.set(metricName, metric);
  }

  /**
   * 起動時間を取得
   */
  getStartupTime(): number {
    return Date.now() - this.appStartTime;
  }

  /**
   * メモリ使用量を記録
   */
  recordMemoryUsage() {
    if (!this.enabled) return;

    const metric: MemoryMetric = {
      timestamp: Date.now(),
    };

    // Web環境の場合、performance.memory APIを使用
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      metric.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      metric.totalJSHeapSize = memory.totalJSHeapSize;
      metric.usedJSHeapSize = memory.usedJSHeapSize;
    }

    this.memoryMetrics.push(metric);
  }

  /**
   * メモリ使用量を取得（MB単位）
   */
  getCurrentMemoryUsageMB(): number | null {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }
    return null;
  }

  /**
   * すべてのメトリクスを取得
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 特定のメトリクスを取得
   */
  getMetric(metricName: string): PerformanceMetric | undefined {
    return this.metrics.get(metricName);
  }

  /**
   * パフォーマンスレポートを出力
   */
  report() {
    if (!this.enabled) return;

    console.log('\n=== Performance Report ===');
    console.log(`App Startup Time: ${this.getStartupTime()}ms`);
    console.log('\nMetrics:');

    const metrics = this.getAllMetrics();
    metrics.forEach((metric) => {
      if (metric.duration !== undefined) {
        console.log(`  - ${metric.name}: ${metric.duration}ms`);
      }
    });

    const memoryMB = this.getCurrentMemoryUsageMB();
    if (memoryMB !== null) {
      console.log(`\nCurrent Memory Usage: ${memoryMB}MB`);
    }

    console.log('==========================\n');
  }

  /**
   * メトリクスをクリア
   */
  clear() {
    this.metrics.clear();
    this.memoryMetrics = [];
  }

  /**
   * アプリ起動時刻をリセット
   */
  resetAppStartTime() {
    this.appStartTime = Date.now();
  }

  /**
   * 非同期関数の実行時間を計測
   */
  async measureAsync<T>(metricName: string, fn: () => Promise<T>): Promise<T> {
    this.start(metricName);
    try {
      const result = await fn();
      this.end(metricName);
      return result;
    } catch (error) {
      this.end(metricName);
      throw error;
    }
  }

  /**
   * 同期関数の実行時間を計測
   */
  measure<T>(metricName: string, fn: () => T): T {
    this.start(metricName);
    try {
      const result = fn();
      this.end(metricName);
      return result;
    } catch (error) {
      this.end(metricName);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const PerformanceMonitor = new PerformanceMonitorClass();

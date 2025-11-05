/**
 * HermesDetector Utility
 * Hermesエンジンが有効かどうかを検出
 *
 * 機能:
 * - Hermesエンジンの検出
 * - エンジン情報の取得
 * - パフォーマンス情報のログ
 */

/**
 * Hermesエンジン情報
 */
export interface HermesInfo {
  /**
   * Hermesが有効かどうか
   */
  isHermesEnabled: boolean;

  /**
   * エンジン名
   */
  engine: string;

  /**
   * Hermesバージョン（利用可能な場合）
   */
  version?: string;

  /**
   * Hermesビルド情報（利用可能な場合）
   */
  buildInfo?: string;
}

/**
 * Hermesが有効かどうかをチェック
 *
 * @returns Hermesが有効な場合true
 */
export function isHermesEnabled(): boolean {
  // グローバルオブジェクトに HermesInternal が存在するかチェック
  return (
    typeof global !== 'undefined' &&
    'HermesInternal' in global &&
    global.HermesInternal !== null &&
    global.HermesInternal !== undefined
  );
}

/**
 * Hermesエンジン情報を取得
 *
 * @returns Hermesエンジン情報
 */
export function getHermesInfo(): HermesInfo {
  const isEnabled = isHermesEnabled();

  if (!isEnabled) {
    return {
      isHermesEnabled: false,
      engine: 'JavaScriptCore (JSC) or V8',
    };
  }

  const hermesInfo: HermesInfo = {
    isHermesEnabled: true,
    engine: 'Hermes',
  };

  // Hermesバージョン情報の取得（利用可能な場合）
  try {
    if (global.HermesInternal && global.HermesInternal.getRuntimeProperties) {
      const runtimeProps = global.HermesInternal.getRuntimeProperties();
      hermesInfo.version = runtimeProps['OSS Release Version'] || 'Unknown';
      hermesInfo.buildInfo = runtimeProps['Build'] || 'Unknown';
    }
  } catch (error) {
    console.warn('[HermesDetector] Failed to get Hermes runtime properties:', error);
  }

  return hermesInfo;
}

/**
 * Hermesエンジン情報をコンソールにログ出力
 */
export function logHermesInfo(): void {
  const info = getHermesInfo();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 JavaScript Engine Information');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Engine: ${info.engine}`);
  console.log(`Hermes Enabled: ${info.isHermesEnabled ? '✅' : '❌'}`);

  if (info.version) {
    console.log(`Hermes Version: ${info.version}`);
  }

  if (info.buildInfo) {
    console.log(`Build Info: ${info.buildInfo}`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * パフォーマンス計測ユーティリティ
 */
export class PerformanceMeasure {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = Date.now();
  }

  /**
   * 計測を終了し、結果をログ出力
   */
  end(): number {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    console.log(`[Performance] ${this.label}: ${duration}ms`);

    return duration;
  }

  /**
   * 計測を終了し、結果を返す（ログ出力なし）
   */
  endSilent(): number {
    const endTime = Date.now();
    return endTime - this.startTime;
  }
}

/**
 * メモリ使用量を取得（利用可能な場合）
 *
 * @returns メモリ使用量（バイト）、取得できない場合はnull
 */
export function getMemoryUsage(): number | null {
  try {
    // React Nativeには performance.memory が存在しない場合がある
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize;
    }

    // Hermesの場合、HermesInternalからメモリ情報を取得できる場合がある
    if (global.HermesInternal && global.HermesInternal.getInstrumentedStats) {
      const stats = global.HermesInternal.getInstrumentedStats();
      return stats.js_allocatedBytes || null;
    }

    return null;
  } catch (error) {
    console.warn('[HermesDetector] Failed to get memory usage:', error);
    return null;
  }
}

/**
 * メモリ使用量をログ出力
 */
export function logMemoryUsage(): void {
  const memoryUsage = getMemoryUsage();

  if (memoryUsage === null) {
    console.log('[Memory] Memory usage information not available');
    return;
  }

  const memoryMB = (memoryUsage / 1024 / 1024).toFixed(2);
  console.log(`[Memory] Current usage: ${memoryMB} MB`);
}

/**
 * Hermesパフォーマンス最適化のヒントをログ出力
 */
export function logOptimizationHints(): void {
  const info = getHermesInfo();

  if (!info.isHermesEnabled) {
    console.warn('⚠️  Hermes is not enabled. Consider enabling it for better performance.');
    console.log('   Add "jsEngine": "hermes" to app.json');
    return;
  }

  console.log('✅ Hermes is enabled. Performance optimizations:');
  console.log('   - Faster app startup');
  console.log('   - Lower memory usage');
  console.log('   - Smaller app size');
  console.log('   - Better performance for complex operations');
}

// グローバル型定義の拡張
declare global {
  var HermesInternal: {
    getRuntimeProperties?: () => Record<string, string>;
    getInstrumentedStats?: () => Record<string, number>;
  } | null;
}

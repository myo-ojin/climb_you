/**
 * HermesDetector ユニットテスト
 */

import {
  isHermesEnabled,
  getHermesInfo,
  logHermesInfo,
  PerformanceMeasure,
  getMemoryUsage,
  logMemoryUsage,
  logOptimizationHints,
} from '../HermesDetector';

describe('HermesDetector', () => {
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleWarn: jest.SpyInstance;

  beforeEach(() => {
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('isHermesEnabled', () => {
    it('Hermesが有効な場合、trueを返す', () => {
      // グローバルにHermesInternalを設定
      (global as any).HermesInternal = {};

      const result = isHermesEnabled();

      expect(result).toBe(true);
    });

    it('Hermesが無効な場合、falseを返す', () => {
      // HermesInternalを削除
      delete (global as any).HermesInternal;

      const result = isHermesEnabled();

      expect(result).toBe(false);
    });

    it('HermesInternalがnullの場合、falseを返す', () => {
      (global as any).HermesInternal = null;

      const result = isHermesEnabled();

      expect(result).toBe(false);
    });

    it('HermesInternalがundefinedの場合、falseを返す', () => {
      (global as any).HermesInternal = undefined;

      const result = isHermesEnabled();

      expect(result).toBe(false);
    });
  });

  describe('getHermesInfo', () => {
    it('Hermesが有効な場合、Hermes情報を返す', () => {
      (global as any).HermesInternal = {
        getRuntimeProperties: jest.fn().mockReturnValue({
          'OSS Release Version': '0.11.0',
          Build: 'Release',
        }),
      };

      const info = getHermesInfo();

      expect(info.isHermesEnabled).toBe(true);
      expect(info.engine).toBe('Hermes');
      expect(info.version).toBe('0.11.0');
      expect(info.buildInfo).toBe('Release');
    });

    it('Hermesが無効な場合、JSC/V8情報を返す', () => {
      delete (global as any).HermesInternal;

      const info = getHermesInfo();

      expect(info.isHermesEnabled).toBe(false);
      expect(info.engine).toBe('JavaScriptCore (JSC) or V8');
      expect(info.version).toBeUndefined();
      expect(info.buildInfo).toBeUndefined();
    });

    it('getRuntimePropertiesが存在しない場合、バージョン情報なしでHermes情報を返す', () => {
      (global as any).HermesInternal = {};

      const info = getHermesInfo();

      expect(info.isHermesEnabled).toBe(true);
      expect(info.engine).toBe('Hermes');
      expect(info.version).toBeUndefined();
      expect(info.buildInfo).toBeUndefined();
    });

    it('getRuntimePropertiesがエラーをスローした場合、警告をログ出力', () => {
      (global as any).HermesInternal = {
        getRuntimeProperties: jest.fn().mockImplementation(() => {
          throw new Error('Test error');
        }),
      };

      const info = getHermesInfo();

      expect(info.isHermesEnabled).toBe(true);
      expect(info.engine).toBe('Hermes');
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[HermesDetector] Failed to get Hermes runtime properties:',
        expect.any(Error)
      );
    });
  });

  describe('logHermesInfo', () => {
    it('Hermes情報をコンソールにログ出力', () => {
      (global as any).HermesInternal = {
        getRuntimeProperties: jest.fn().mockReturnValue({
          'OSS Release Version': '0.11.0',
          Build: 'Release',
        }),
      };

      logHermesInfo();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('JavaScript Engine Information'));
      expect(mockConsoleLog).toHaveBeenCalledWith('Engine: Hermes');
      expect(mockConsoleLog).toHaveBeenCalledWith('Hermes Enabled: ✅');
      expect(mockConsoleLog).toHaveBeenCalledWith('Hermes Version: 0.11.0');
      expect(mockConsoleLog).toHaveBeenCalledWith('Build Info: Release');
    });

    it('Hermesが無効な場合、JSC情報をログ出力', () => {
      delete (global as any).HermesInternal;

      logHermesInfo();

      expect(mockConsoleLog).toHaveBeenCalledWith('Engine: JavaScriptCore (JSC) or V8');
      expect(mockConsoleLog).toHaveBeenCalledWith('Hermes Enabled: ❌');
    });
  });

  describe('PerformanceMeasure', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000) // start time
        .mockReturnValueOnce(1500); // end time
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('パフォーマンス計測を開始・終了し、結果をログ出力', () => {
      const measure = new PerformanceMeasure('test-operation');
      const duration = measure.end();

      expect(duration).toBe(500);
      expect(mockConsoleLog).toHaveBeenCalledWith('[Performance] test-operation: 500ms');
    });

    it('endSilent()でログ出力なしで結果を返す', () => {
      const measure = new PerformanceMeasure('test-operation');
      const duration = measure.endSilent();

      expect(duration).toBe(500);
      expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('[Performance]'));
    });
  });

  describe('getMemoryUsage', () => {
    it('performance.memoryが利用可能な場合、メモリ使用量を返す', () => {
      // performance.memoryをモック
      (global as any).performance = {
        memory: {
          usedJSHeapSize: 10485760, // 10 MB
        },
      };

      const memoryUsage = getMemoryUsage();

      expect(memoryUsage).toBe(10485760);
    });

    it('HermesInternalからメモリ使用量を取得', () => {
      delete (global as any).performance;

      (global as any).HermesInternal = {
        getInstrumentedStats: jest.fn().mockReturnValue({
          js_allocatedBytes: 5242880, // 5 MB
        }),
      };

      const memoryUsage = getMemoryUsage();

      expect(memoryUsage).toBe(5242880);
    });

    it('メモリ情報が取得できない場合、nullを返す', () => {
      delete (global as any).performance;
      delete (global as any).HermesInternal;

      const memoryUsage = getMemoryUsage();

      expect(memoryUsage).toBeNull();
    });

    it('getInstrumentedStatsがエラーをスローした場合、nullを返す', () => {
      delete (global as any).performance;

      (global as any).HermesInternal = {
        getInstrumentedStats: jest.fn().mockImplementation(() => {
          throw new Error('Test error');
        }),
      };

      const memoryUsage = getMemoryUsage();

      expect(memoryUsage).toBeNull();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[HermesDetector] Failed to get memory usage:',
        expect.any(Error)
      );
    });
  });

  describe('logMemoryUsage', () => {
    it('メモリ使用量をログ出力', () => {
      (global as any).performance = {
        memory: {
          usedJSHeapSize: 10485760, // 10 MB
        },
      };

      logMemoryUsage();

      expect(mockConsoleLog).toHaveBeenCalledWith('[Memory] Current usage: 10.00 MB');
    });

    it('メモリ情報が取得できない場合、警告をログ出力', () => {
      delete (global as any).performance;
      delete (global as any).HermesInternal;

      logMemoryUsage();

      expect(mockConsoleLog).toHaveBeenCalledWith('[Memory] Memory usage information not available');
    });
  });

  describe('logOptimizationHints', () => {
    it('Hermesが有効な場合、最適化ヒントをログ出力', () => {
      (global as any).HermesInternal = {};

      logOptimizationHints();

      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Hermes is enabled. Performance optimizations:');
      expect(mockConsoleLog).toHaveBeenCalledWith('   - Faster app startup');
      expect(mockConsoleLog).toHaveBeenCalledWith('   - Lower memory usage');
      expect(mockConsoleLog).toHaveBeenCalledWith('   - Smaller app size');
      expect(mockConsoleLog).toHaveBeenCalledWith('   - Better performance for complex operations');
    });

    it('Hermesが無効な場合、有効化の推奨をログ出力', () => {
      delete (global as any).HermesInternal;

      logOptimizationHints();

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '⚠️  Hermes is not enabled. Consider enabling it for better performance.'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith('   Add "jsEngine": "hermes" to app.json');
    });
  });
});

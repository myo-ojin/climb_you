/**
 * PerformanceMonitor ユニットテスト
 */

import { PerformanceMonitor } from '../PerformanceMonitor';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.clear();
    PerformanceMonitor.setEnabled(true);
  });

  afterEach(() => {
    PerformanceMonitor.clear();
  });

  describe('計測機能', () => {
    it('start()とend()で計測できる', () => {
      PerformanceMonitor.start('test-metric');
      const metric = PerformanceMonitor.getMetric('test-metric');

      expect(metric).toBeDefined();
      expect(metric?.name).toBe('test-metric');
      expect(metric?.startTime).toBeDefined();
      expect(metric?.endTime).toBeUndefined();
      expect(metric?.duration).toBeUndefined();
    });

    it('end()で計測を終了し、durationが記録される', async () => {
      PerformanceMonitor.start('test-metric');

      // 100ms待機
      await new Promise((resolve) => setTimeout(resolve, 100));

      PerformanceMonitor.end('test-metric');
      const metric = PerformanceMonitor.getMetric('test-metric');

      expect(metric?.endTime).toBeDefined();
      expect(metric?.duration).toBeDefined();
      expect(metric?.duration).toBeGreaterThanOrEqual(100);
    });

    it('存在しないメトリクスをend()した場合、警告を出力', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      PerformanceMonitor.end('non-existent');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('non-existent not found')
      );

      warnSpy.mockRestore();
    });
  });

  describe('メモリ計測', () => {
    it('recordMemoryUsage()でメモリ使用量を記録', () => {
      PerformanceMonitor.recordMemoryUsage();
      // メモリ計測はWeb環境でのみ動作するため、nullの可能性がある
      const memoryMB = PerformanceMonitor.getCurrentMemoryUsageMB();
      expect(memoryMB === null || typeof memoryMB === 'number').toBe(true);
    });
  });

  describe('起動時間', () => {
    it('getStartupTime()で起動時間を取得', () => {
      const startupTime = PerformanceMonitor.getStartupTime();
      expect(startupTime).toBeGreaterThanOrEqual(0);
    });

    it('resetAppStartTime()で起動時刻をリセット', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const time1 = PerformanceMonitor.getStartupTime();
      expect(time1).toBeGreaterThanOrEqual(100);

      PerformanceMonitor.resetAppStartTime();

      const time2 = PerformanceMonitor.getStartupTime();
      expect(time2).toBeLessThan(time1);
    });
  });

  describe('非同期計測', () => {
    it('measureAsync()で非同期関数の実行時間を計測', async () => {
      const result = await PerformanceMonitor.measureAsync('async-test', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'success';
      });

      expect(result).toBe('success');

      const metric = PerformanceMonitor.getMetric('async-test');
      expect(metric?.duration).toBeDefined();
      expect(metric?.duration).toBeGreaterThanOrEqual(100);
    });

    it('measureAsync()でエラーが発生した場合、計測を終了してエラーを再スロー', async () => {
      await expect(
        PerformanceMonitor.measureAsync('error-test', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      const metric = PerformanceMonitor.getMetric('error-test');
      expect(metric?.duration).toBeDefined();
    });
  });

  describe('同期計測', () => {
    it('measure()で同期関数の実行時間を計測', () => {
      const result = PerformanceMonitor.measure('sync-test', () => {
        // 重い処理をシミュレート
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(typeof result).toBe('number');

      const metric = PerformanceMonitor.getMetric('sync-test');
      expect(metric?.duration).toBeDefined();
      expect(metric?.duration).toBeGreaterThan(0);
    });

    it('measure()でエラーが発生した場合、計測を終了してエラーを再スロー', () => {
      expect(() => {
        PerformanceMonitor.measure('error-test', () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');

      const metric = PerformanceMonitor.getMetric('error-test');
      expect(metric?.duration).toBeDefined();
    });
  });

  describe('メトリクス管理', () => {
    it('getAllMetrics()で全メトリクスを取得', () => {
      PerformanceMonitor.start('metric-1');
      PerformanceMonitor.start('metric-2');
      PerformanceMonitor.start('metric-3');

      const metrics = PerformanceMonitor.getAllMetrics();
      expect(metrics.length).toBe(3);
      expect(metrics.map((m) => m.name)).toContain('metric-1');
      expect(metrics.map((m) => m.name)).toContain('metric-2');
      expect(metrics.map((m) => m.name)).toContain('metric-3');
    });

    it('clear()で全メトリクスをクリア', () => {
      PerformanceMonitor.start('metric-1');
      PerformanceMonitor.start('metric-2');

      expect(PerformanceMonitor.getAllMetrics().length).toBe(2);

      PerformanceMonitor.clear();

      expect(PerformanceMonitor.getAllMetrics().length).toBe(0);
    });
  });

  describe('有効/無効の切り替え', () => {
    it('setEnabled(false)で無効化すると計測しない', () => {
      PerformanceMonitor.setEnabled(false);

      PerformanceMonitor.start('disabled-metric');
      const metric = PerformanceMonitor.getMetric('disabled-metric');

      expect(metric).toBeUndefined();
    });

    it('setEnabled(true)で有効化すると計測する', () => {
      PerformanceMonitor.setEnabled(false);
      PerformanceMonitor.setEnabled(true);

      PerformanceMonitor.start('enabled-metric');
      const metric = PerformanceMonitor.getMetric('enabled-metric');

      expect(metric).toBeDefined();
    });
  });

  describe('レポート出力', () => {
    it('report()でレポートを出力', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      PerformanceMonitor.start('test-1');
      PerformanceMonitor.end('test-1');

      PerformanceMonitor.start('test-2');
      PerformanceMonitor.end('test-2');

      PerformanceMonitor.report();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Performance Report'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('App Startup Time'));

      logSpy.mockRestore();
    });
  });
});

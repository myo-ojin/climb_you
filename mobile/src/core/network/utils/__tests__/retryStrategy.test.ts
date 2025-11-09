/**
 * RetryStrategy Basic Tests
 * リトライ戦略の基本テスト
 */

import { RetryStrategy, RetryStrategyType } from '../retryStrategy';

describe('RetryStrategy - Basic Tests', () => {
  describe('calculateDelay', () => {
    it('指数バックオフで遅延を計算すること', () => {
      const strategy = new RetryStrategy({ strategy: RetryStrategyType.EXPONENTIAL });

      const delay1 = strategy.calculateDelay(0);
      const delay2 = strategy.calculateDelay(1);
      const delay3 = strategy.calculateDelay(2);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it('線形バックオフで遅延を計算すること', () => {
      const strategy = new RetryStrategy({ strategy: RetryStrategyType.LINEAR });

      const delay = strategy.calculateDelay(1);

      expect(delay).toBeGreaterThan(0);
    });

    it('固定遅延を計算すること', () => {
      const strategy = new RetryStrategy({
        strategy: RetryStrategyType.FIXED,
        initialDelay: 2000
      });

      const delay1 = strategy.calculateDelay(0);
      const delay2 = strategy.calculateDelay(5);

      expect(delay1).toBe(delay2);
    });
  });

  describe('execute', () => {
    it('成功する操作を実行すること', async () => {
      const strategy = new RetryStrategy({ maxAttempts: 3 });
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await strategy.execute(mockFn);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('失敗後にリトライすること', async () => {
      const strategy = new RetryStrategy({ maxAttempts: 3, initialDelay: 10 });
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockResolvedValueOnce('success');

      const result = await strategy.execute(mockFn);

      expect(result.success).toBe(true);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});

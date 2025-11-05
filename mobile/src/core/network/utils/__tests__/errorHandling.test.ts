/**
 * Network Error Handling Tests
 * テスト対象: NetworkErrorHandler, OfflineManager, RetryStrategy
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  NetworkErrorHandler,
  ErrorRecoveryStrategy,
  type ErrorHandlerConfig,
} from '../networkErrorHandler';
import {
  RetryStrategy,
  RetryStrategyType,
  executeWithRetry,
  retryApiCall,
  type RetryConfig,
} from '../retryStrategy';
import { AppError } from '@/core/network/interceptors';

describe('Network Error Handling', () => {
  describe('NetworkErrorHandler', () => {
    let handler: NetworkErrorHandler;
    let config: ErrorHandlerConfig;

    beforeEach(() => {
      config = {
        maxRetries: 3,
        initialRetryDelay: 100,
        maxRetryDelay: 1000,
        backoffMultiplier: 2,
      };
      handler = new NetworkErrorHandler(config);
    });

    it('should determine recovery strategy for different error codes', () => {
      const testCases = [
        {
          error: new AppError('UNAUTHORIZED', 'Unauthorized', 401),
          expected: ErrorRecoveryStrategy.REFRESH_TOKEN,
        },
        {
          error: new AppError('FORBIDDEN', 'Forbidden', 403),
          expected: ErrorRecoveryStrategy.LOGIN_REQUIRED,
        },
        {
          error: new AppError('NOT_FOUND', 'Not found', 404),
          expected: ErrorRecoveryStrategy.REFRESH_DATA,
        },
        {
          error: new AppError('TOO_MANY_REQUESTS', 'Too many requests', 429),
          expected: ErrorRecoveryStrategy.RATE_LIMIT_WAIT,
        },
        {
          error: new AppError(
            'INTERNAL_SERVER_ERROR',
            'Server error',
            500
          ),
          expected: ErrorRecoveryStrategy.RETRY,
        },
        {
          error: new AppError('NETWORK_ERROR', 'Network error'),
          expected: ErrorRecoveryStrategy.OFFLINE_MODE,
        },
      ];

      for (const testCase of testCases) {
        const strategy = handler.getRecoveryStrategy(testCase.error);
        expect(strategy).toBe(testCase.expected);
      }
    });

    it('should check if error is retryable', () => {
      const retryable = new AppError(
        'INTERNAL_SERVER_ERROR',
        'Server error',
        500
      );
      const nonRetryable = new AppError('FORBIDDEN', 'Forbidden', 403);

      expect(handler.isRetryable(retryable)).toBe(true);
      expect(handler.isRetryable(nonRetryable)).toBe(false);
    });

    it('should calculate retry delay with backoff', () => {
      // 最初のリトライ
      const delay1 = handler.calculateRetryDelay(0);
      expect(delay1).toBeGreaterThanOrEqual(100);
      expect(delay1).toBeLessThanOrEqual(120);

      // 2回目のリトライ
      const delay2 = handler.calculateRetryDelay(1);
      expect(delay2).toBeGreaterThanOrEqual(200);
      expect(delay2).toBeLessThanOrEqual(240);

      // 3回目のリトライ
      const delay3 = handler.calculateRetryDelay(2);
      expect(delay3).toBeGreaterThanOrEqual(400);
      expect(delay3).toBeLessThanOrEqual(480);
    });

    it('should not exceed max retry delay', () => {
      const handler = new NetworkErrorHandler({
        maxRetries: 10,
        initialRetryDelay: 1000,
        maxRetryDelay: 5000,
        backoffMultiplier: 2,
      });

      const delay = handler.calculateRetryDelay(10);
      expect(delay).toBeLessThanOrEqual(5000);
    });

    it('should create retry context', () => {
      const error = new AppError('TEST_ERROR', 'Test');
      const context = handler.createRetryContext(error, 0);

      expect(context.attempt).toBe(0);
      expect(context.maxRetries).toBe(3);
      expect(context.error).toBe(error);
      expect(context.nextRetryDelay).toBeGreaterThan(0);
    });

    it('should determine if should retry based on context', () => {
      const error = new AppError(
        'INTERNAL_SERVER_ERROR',
        'Server error',
        500
      );
      const context = handler.createRetryContext(error, 0);

      expect(handler.shouldRetry(context)).toBe(true);

      // 最大リトライ回数に達した場合
      context.attempt = 3;
      expect(handler.shouldRetry(context)).toBe(false);
    });

    it('should extract Retry-After header', () => {
      const error = new AppError(
        'TOO_MANY_REQUESTS',
        'Too many requests',
        429,
        { 'retry-after': '60' }
      );

      const delay = handler.getRetryAfterDelay(error);
      expect(delay).toBe(60000); // 60 * 1000
    });

    it('should call onUnauthorized callback', async () => {
      const onUnauthorized = vi.fn();
      const handler = new NetworkErrorHandler({
        maxRetries: 3,
        initialRetryDelay: 100,
        maxRetryDelay: 1000,
        backoffMultiplier: 2,
        onUnauthorized,
      });

      const error = new AppError('UNAUTHORIZED', 'Unauthorized', 401);
      await handler.handleError(error);

      expect(onUnauthorized).toHaveBeenCalled();
    });

    it('should manage retry contexts', () => {
      const error = new AppError('TEST_ERROR', 'Test');
      const context = handler.createRetryContext(error, 0);

      handler.saveRetryContext('request_1', context);
      expect(handler.getRetryContext('request_1')).toBe(context);

      handler.clearRetryContext('request_1');
      expect(handler.getRetryContext('request_1')).toBeUndefined();

      handler.saveRetryContext('request_2', context);
      handler.saveRetryContext('request_3', context);
      handler.clearAllRetryContexts();
      expect(handler.getRetryContext('request_2')).toBeUndefined();
      expect(handler.getRetryContext('request_3')).toBeUndefined();
    });
  });

  describe('RetryStrategy', () => {
    let strategy: RetryStrategy;

    beforeEach(() => {
      strategy = new RetryStrategy({
        strategy: RetryStrategyType.EXPONENTIAL,
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 100,
        multiplier: 2,
        jitterFactor: 0,
      });
    });

    it('should calculate exponential backoff delay', () => {
      const delay0 = strategy.calculateDelay(0);
      const delay1 = strategy.calculateDelay(1);
      const delay2 = strategy.calculateDelay(2);

      expect(delay0).toBe(10);
      expect(delay1).toBe(20);
      expect(delay2).toBe(40);
    });

    it('should calculate linear backoff delay', () => {
      const strategy = new RetryStrategy({
        strategy: RetryStrategyType.LINEAR,
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 100,
        multiplier: 2,
        jitterFactor: 0,
      });

      expect(strategy.calculateDelay(0)).toBe(10);
      expect(strategy.calculateDelay(1)).toBe(20);
      expect(strategy.calculateDelay(2)).toBe(30);
    });

    it('should use fixed delay', () => {
      const strategy = new RetryStrategy({
        strategy: RetryStrategyType.FIXED,
        maxAttempts: 3,
        initialDelay: 50,
        maxDelay: 100,
        multiplier: 2,
        jitterFactor: 0,
      });

      expect(strategy.calculateDelay(0)).toBe(50);
      expect(strategy.calculateDelay(1)).toBe(50);
      expect(strategy.calculateDelay(2)).toBe(50);
    });

    it('should not retry when strategy is NONE', () => {
      const strategy = new RetryStrategy({
        strategy: RetryStrategyType.NONE,
      });

      expect(strategy.calculateDelay(0)).toBe(0);
    });

    it('should determine if should retry', () => {
      const error = new AppError(
        'INTERNAL_SERVER_ERROR',
        'Server error',
        500
      );

      expect(strategy.shouldRetry(error, 0)).toBe(true);
      expect(strategy.shouldRetry(error, 1)).toBe(true);
      expect(strategy.shouldRetry(error, 3)).toBe(false); // Max attempts reached
    });

    it('should not retry non-retryable errors', () => {
      const error = new AppError('FORBIDDEN', 'Forbidden', 403);

      expect(strategy.shouldRetry(error, 0)).toBe(false);
    });

    it('should use custom shouldRetry function', () => {
      const customStrategy = new RetryStrategy({
        maxAttempts: 3,
        shouldRetry: (error, attempt) => {
          // Custom logic: only retry for NETWORK_ERROR
          return (
            error instanceof AppError && error.code === 'NETWORK_ERROR'
          );
        },
      });

      const networkError = new AppError('NETWORK_ERROR', 'Network error');
      const otherError = new AppError('FORBIDDEN', 'Forbidden', 403);

      expect(customStrategy.shouldRetry(networkError, 0)).toBe(true);
      expect(customStrategy.shouldRetry(otherError, 0)).toBe(false);
    });

    it('should execute function successfully', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await strategy.execute(fn);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toHaveLength(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new AppError('NETWORK_ERROR', 'Network error'))
        .mockRejectedValueOnce(new AppError('NETWORK_ERROR', 'Network error'))
        .mockResolvedValueOnce('success');

      const result = await strategy.execute(fn);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toHaveLength(3);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max attempts', async () => {
      const error = new AppError('NETWORK_ERROR', 'Network error');
      const fn = vi.fn().mockRejectedValue(error);

      const result = await strategy.execute(fn);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.attempts).toHaveLength(3);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const error = new AppError('FORBIDDEN', 'Forbidden', 403);
      const fn = vi.fn().mockRejectedValue(error);

      const result = await strategy.execute(fn);

      expect(result.success).toBe(false);
      expect(result.attempts).toHaveLength(1); // Only one attempt
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should get statistics', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new AppError('NETWORK_ERROR', 'Network error'))
        .mockResolvedValueOnce('success');

      await strategy.execute(fn);
      const stats = strategy.getStats();

      expect(stats.totalAttempts).toBe(2);
      expect(stats.successAttempt).toBe(1);
      expect(stats.totalDuration).toBeGreaterThanOrEqual(0);
      expect(stats.averageDelay).toBeGreaterThan(0);
    });

    it('should clear attempts', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      await strategy.execute(fn);

      expect(strategy.getAttempts()).toHaveLength(1);

      strategy.clearAttempts();
      expect(strategy.getAttempts()).toHaveLength(0);
    });
  });

  describe('Convenience Functions', () => {
    it('should execute with retry using executeWithRetry', async () => {
      let attempt = 0;
      const fn = async () => {
        attempt++;
        if (attempt < 2) {
          throw new AppError('NETWORK_ERROR', 'Network error');
        }
        return 'success';
      };

      const result = await executeWithRetry(fn, {
        strategy: RetryStrategyType.EXPONENTIAL,
        maxAttempts: 3,
      });

      expect(result).toBe('success');
      expect(attempt).toBe(2);
    });

    it('should retry API call', async () => {
      let attempt = 0;
      const apiCall = async () => {
        attempt++;
        if (attempt < 2) {
          throw new AppError('NETWORK_ERROR', 'Network error');
        }
        return { data: 'success' };
      };

      const result = await retryApiCall(apiCall, 3, 10);

      expect(result).toEqual({ data: 'success' });
      expect(attempt).toBe(2);
    });

    it('should throw error when retries exhausted', async () => {
      const fn = async () => {
        throw new AppError('NETWORK_ERROR', 'Network error');
      };

      await expect(executeWithRetry(fn, { maxAttempts: 2 })).rejects.toThrow(
        AppError
      );
    });
  });
});

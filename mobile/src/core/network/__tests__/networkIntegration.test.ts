/**
 * Network Layer Integration Tests
 * テスト対象: MCPClient + Interceptors + Error Handling の統合
 */

import axios, { AxiosInstance } from 'axios';
import { MCPClient } from '@/core/network/mcp';
import {
  setupAuthInterceptor,
  setupErrorInterceptor,
  setupLoggingInterceptor,
  LogLevel,
  AppError,
} from '@/core/network/interceptors';
import {
  NetworkErrorHandler,
  ErrorRecoveryStrategy,
  RetryStrategy,
  RetryStrategyType,
} from '@/core/network/utils';
import { OAuth2Client } from '@/core/network/oauth';
import { SecureTokenStore } from '@/services/auth';

// Mock dependencies
jest.mock('@/services/auth');
jest.mock('@/core/network/oauth');
jest.mock('axios');

describe('Network Layer Integration', () => {
  let axiosInstance: AxiosInstance;
  let mcpClient: MCPClient;
  let errorHandler: NetworkErrorHandler;
  let retryStrategy: RetryStrategy;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Axios mock setup
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    jest.mocked(axios.create).mockReturnValue(mockAxiosInstance);

    mockAxiosInstance.interceptors.request.use.mockImplementation(
      (onFulfilled: any) => onFulfilled
    );
    mockAxiosInstance.interceptors.response.use.mockImplementation(
      (onFulfilled: any, onRejected: any) => ({ onFulfilled, onRejected })
    );

    // Initialize components
    axiosInstance = axios.create();

    mcpClient = new MCPClient({
      baseURL: 'https://api.example.com/mcp',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 100,
    });

    errorHandler = new NetworkErrorHandler({
      maxRetries: 3,
      initialRetryDelay: 100,
      maxRetryDelay: 1000,
      backoffMultiplier: 2,
    });

    retryStrategy = new RetryStrategy({
      strategy: RetryStrategyType.EXPONENTIAL,
      maxAttempts: 3,
      initialDelay: 50,
      maxDelay: 500,
      multiplier: 2,
      jitterFactor: 0,
    });

    // Setup token mock
    jest.mocked(SecureTokenStore.getToken).mockResolvedValue({
      accessToken: 'test_token',
      refreshToken: 'refresh_token',
      expiresAt: Date.now() + 3600000,
      tokenType: 'Bearer',
      issuedAt: Date.now(),
    });
  });

  describe('MCPClient + Error Handling', () => {
    it('should handle 401 error and trigger refresh', async () => {
      const onUnauthorized = jest.fn();

      const handler = new NetworkErrorHandler({
        maxRetries: 3,
        initialRetryDelay: 100,
        maxRetryDelay: 1000,
        backoffMultiplier: 2,
        onUnauthorized,
      });

      const error = new AppError('UNAUTHORIZED', 'Unauthorized', 401);
      const strategy = handler.getRecoveryStrategy(error);

      expect(strategy).toBe(ErrorRecoveryStrategy.REFRESH_TOKEN);
      await handler.handleError(error);
      expect(onUnauthorized).toHaveBeenCalled();
    });

    it('should handle network errors with retry', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(
          new AppError('NETWORK_ERROR', 'Network error')
        )
        .mockResolvedValueOnce('success');

      const result = await retryStrategy.execute(fn);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts.length).toBe(2);
    });

    it('should handle rate limiting with Retry-After', async () => {
      const error = new AppError(
        'TOO_MANY_REQUESTS',
        'Too many requests',
        429,
        { 'retry-after': '5' }
      );

      const strategy = errorHandler.getRecoveryStrategy(error);
      const delay = errorHandler.getRetryAfterDelay(error);

      expect(strategy).toBe(ErrorRecoveryStrategy.RATE_LIMIT_WAIT);
      expect(delay).toBe(5000); // 5 * 1000
    });

    it('should handle server errors with exponential backoff', async () => {
      const error = new AppError(
        'INTERNAL_SERVER_ERROR',
        'Server error',
        500
      );

      expect(errorHandler.isRetryable(error)).toBe(true);

      const delay1 = errorHandler.calculateRetryDelay(0);
      const delay2 = errorHandler.calculateRetryDelay(1);
      const delay3 = errorHandler.calculateRetryDelay(2);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it('should determine recovery strategy for each error type', () => {
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
          error: new AppError('NETWORK_ERROR', 'Network error'),
          expected: ErrorRecoveryStrategy.OFFLINE_MODE,
        },
        {
          error: new AppError(
            'INTERNAL_SERVER_ERROR',
            'Server error',
            500
          ),
          expected: ErrorRecoveryStrategy.RETRY,
        },
      ];

      for (const testCase of testCases) {
        const strategy = errorHandler.getRecoveryStrategy(testCase.error);
        expect(strategy).toBe(testCase.expected);
      }
    });
  });

  describe('Retry Strategy Integration', () => {
    it('should succeed after retries on transient errors', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new AppError('NETWORK_ERROR', 'Network error');
        }
        return 'success';
      };

      const result = await retryStrategy.execute(fn);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(attempts).toBe(3);
      expect(result.attempts.length).toBe(3);
    });

    it('should fail fast on non-retryable errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValue(
          new AppError('FORBIDDEN', 'Forbidden', 403)
        );

      const result = await retryStrategy.execute(fn);

      expect(result.success).toBe(false);
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });

    it('should track attempt statistics', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 2) {
          throw new AppError('NETWORK_ERROR', 'Network error');
        }
        return 'success';
      };

      const result = await retryStrategy.execute(fn);
      const stats = retryStrategy.getStats();

      expect(stats.totalAttempts).toBe(2);
      expect(stats.successAttempt).toBe(1);
      expect(stats.averageDelay).toBeGreaterThan(0);
    });

    it('should respect max retry attempts', async () => {
      const fn = vi
        .fn()
        .mockRejectedValue(
          new AppError('NETWORK_ERROR', 'Network error')
        );

      const result = await retryStrategy.execute(fn);

      expect(result.success).toBe(false);
      expect(fn).toHaveBeenCalledTimes(3); // maxAttempts
    });

    it('should add jitter to prevent thundering herd', async () => {
      const strategy = new RetryStrategy({
        strategy: RetryStrategyType.EXPONENTIAL,
        maxAttempts: 3,
        initialDelay: 100,
        maxDelay: 500,
        multiplier: 2,
        jitterFactor: 0.1,
      });

      const delays: number[] = [];
      for (let i = 0; i < 5; i++) {
        delays.push(strategy.calculateDelay(0));
      }

      // ジッターにより遅延が異なる
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should handle complete error recovery flow', async () => {
      const onUnauthorized = jest.fn();
      const handler = new NetworkErrorHandler({
        maxRetries: 3,
        initialRetryDelay: 50,
        maxRetryDelay: 500,
        backoffMultiplier: 2,
        onUnauthorized,
      });

      // Simulate API error
      const error = new AppError('UNAUTHORIZED', 'Unauthorized', 401);

      // Determine recovery strategy
      const strategy = handler.getRecoveryStrategy(error);
      expect(strategy).toBe(ErrorRecoveryStrategy.REFRESH_TOKEN);

      // Execute recovery callback
      await handler.handleError(error);
      expect(onUnauthorized).toHaveBeenCalled();

      // Simulate token refresh and retry
      const retryResult = await retryStrategy.execute(async () => {
        return 'success';
      });

      expect(retryResult.success).toBe(true);
    });

    it('should handle cascading errors', async () => {
      const errors = [
        new AppError('NETWORK_ERROR', 'Network error'),
        new AppError('INTERNAL_SERVER_ERROR', 'Server error', 500),
        new AppError('BAD_GATEWAY', 'Bad gateway', 502),
      ];

      for (const error of errors) {
        const strategy = errorHandler.getRecoveryStrategy(error);
        expect([
          ErrorRecoveryStrategy.OFFLINE_MODE,
          ErrorRecoveryStrategy.RETRY,
        ]).toContain(strategy);
      }
    });

    it('should recover from multiple transient failures', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        if (callCount === 1) {
          throw new AppError('NETWORK_ERROR', 'Network error');
        }
        if (callCount === 2) {
          throw new AppError('INTERNAL_SERVER_ERROR', 'Server error', 500);
        }
        return 'success';
      };

      const result = await retryStrategy.execute(fn);

      expect(result.success).toBe(true);
      expect(callCount).toBe(3);
    });
  });

  describe('Network Error Scenario Testing', () => {
    it('should handle timeout errors', async () => {
      const error = new AppError(
        'GATEWAY_TIMEOUT',
        'Request timeout',
        504
      );

      expect(errorHandler.isRetryable(error)).toBe(true);

      const strategy = errorHandler.getRecoveryStrategy(error);
      expect(strategy).toBe(ErrorRecoveryStrategy.RETRY);
    });

    it('should handle connection refused errors', async () => {
      const error = new AppError(
        'NETWORK_ERROR',
        'Connection refused'
      );

      expect(errorHandler.isRetryable(error)).toBe(true);

      const strategy = errorHandler.getRecoveryStrategy(error);
      expect(strategy).toBe(ErrorRecoveryStrategy.OFFLINE_MODE);
    });

    it('should handle DNS resolution errors', async () => {
      const error = new AppError(
        'NETWORK_ERROR',
        'DNS resolution failed'
      );

      const strategy = errorHandler.getRecoveryStrategy(error);
      expect(strategy).toBe(ErrorRecoveryStrategy.OFFLINE_MODE);
    });

    it('should handle SSL certificate errors', async () => {
      const error = new AppError(
        'NETWORK_ERROR',
        'SSL certificate verification failed'
      );

      const strategy = errorHandler.getRecoveryStrategy(error);
      expect(strategy).toBe(ErrorRecoveryStrategy.OFFLINE_MODE);
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle rapid sequential requests', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const results = await Promise.all([
        retryStrategy.execute(() => fn()),
        retryStrategy.execute(() => fn()),
        retryStrategy.execute(() => fn()),
      ]);

      expect(results.every((r) => r.success)).toBe(true);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should handle retry context management', () => {
      const error = new AppError('TEST_ERROR', 'Test');

      // Save multiple contexts
      for (let i = 0; i < 5; i++) {
        const context = errorHandler.createRetryContext(error, i);
        errorHandler.saveRetryContext(`request_${i}`, context);
      }

      // Verify all contexts are saved
      for (let i = 0; i < 5; i++) {
        expect(errorHandler.getRetryContext(`request_${i}`)).toBeDefined();
      }

      // Clear all
      errorHandler.clearAllRetryContexts();
      expect(errorHandler.getRetryContext('request_0')).toBeUndefined();
    });

    it('should handle long retry chains', async () => {
      let attempts = 0;
      const maxAttempts = 10;
      const strategy = new RetryStrategy({
        maxAttempts,
        initialDelay: 1,
        maxDelay: 10,
      });

      const fn = async () => {
        attempts++;
        if (attempts < maxAttempts) {
          throw new AppError('NETWORK_ERROR', 'Network error');
        }
        return 'success';
      };

      const result = await strategy.execute(fn);

      expect(result.success).toBe(true);
      expect(attempts).toBe(maxAttempts);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null error gracefully', () => {
      const strategy = errorHandler.getRecoveryStrategy(new Error('Generic error'));
      expect([
        ErrorRecoveryStrategy.SHOW_ERROR,
        ErrorRecoveryStrategy.RETRY,
      ]).toContain(strategy);
    });

    it('should handle missing error details', () => {
      const error = new AppError('UNKNOWN_ERROR', 'Unknown error');
      const strategy = errorHandler.getRecoveryStrategy(error);
      expect(strategy).toBe(ErrorRecoveryStrategy.SHOW_ERROR);
    });

    it('should handle zero retry delay calculation', () => {
      const delay = errorHandler.calculateRetryDelay(0);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(errorHandler['config'].maxRetryDelay);
    });

    it('should handle very large retry attempts', () => {
      const delay = errorHandler.calculateRetryDelay(100);
      expect(delay).toBeLessThanOrEqual(
        errorHandler['config'].maxRetryDelay
      );
    });
  });
});

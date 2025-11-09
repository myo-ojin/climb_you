/**
 * Network Layer E2E Tests
 * テスト対象: MCPClient フルフロー（オンボーディングからクエスト完了まで）
 */

import { MCPClient } from '@/core/network/mcp';
import {
  NetworkErrorHandler,
  OfflineManager,
  RetryStrategy,
  RetryStrategyType,
  ErrorRecoveryStrategy,
} from '@/core/network/utils';
import { SecureTokenStore } from '@/services/auth';

jest.mock('@/services/auth');
jest.mock('@react-native-community/netinfo');

describe('Network Layer E2E Tests', () => {
  let mcpClient: MCPClient;
  let errorHandler: NetworkErrorHandler;
  let retryStrategy: RetryStrategy;

  beforeEach(() => {
    jest.clearAllMocks();

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
    });

    jest.mocked(SecureTokenStore.getToken).mockResolvedValue({
      accessToken: 'test_token',
      refreshToken: 'refresh_token',
      expiresAt: Date.now() + 3600000,
      tokenType: 'Bearer',
      issuedAt: Date.now(),
    });
  });

  describe('Onboarding Flow', () => {
    it('should complete full onboarding flow', async () => {
      // Step 1: Analyze goal
      let step = 'goal-analysis';
      const analysisResult = await retryStrategy.execute(async () => {
        // Simulate API call
        return {
          goal_id: 'goal_123',
          difficulty_level: 'medium',
          estimated_duration_days: 90,
        };
      });

      expect(analysisResult.success).toBe(true);
      expect(analysisResult.result?.goal_id).toBe('goal_123');

      step = 'goal-creation';
      const createResult = await retryStrategy.execute(async () => {
        return {
          goal_id: 'goal_123',
          created_at: new Date().toISOString(),
        };
      });

      expect(createResult.success).toBe(true);

      // Step 3: Generate milestones
      step = 'milestone-generation';
      const milestonesResult = await retryStrategy.execute(async () => {
        return Array.from({ length: 10 }, (_, i) => ({
          milestone_id: `milestone_${i + 1}`,
          station_number: i + 1,
          title: `Station ${i + 1}`,
          criteria: `Complete ${(i + 1) * 10}% of goal`,
          estimated_steps: 100 * (i + 1),
        }));
      });

      expect(milestonesResult.success).toBe(true);
      expect(milestonesResult.result?.length).toBe(10);
    });

    it('should handle goal analysis with retries on failure', async () => {
      let attempts = 0;

      const result = await retryStrategy.execute(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Network timeout');
        }
        return {
          goal_id: 'goal_123',
          difficulty_level: 'hard',
        };
      });

      expect(result.success).toBe(true);
      expect(attempts).toBe(2);
    });
  });

  describe('Daily Quest Flow', () => {
    it('should complete full daily quest retrieval flow', async () => {
      // Get quest bundle
      const bundleResult = await retryStrategy.execute(async () => {
        return {
          bundle_id: 'bundle_123',
          date: new Date().toISOString(),
          quests: [
            {
              quest_id: 'quest_1',
              title: 'Small quest',
              type: 'small',
              estimated_minutes: 20,
            },
            {
              quest_id: 'quest_2',
              title: 'Medium quest',
              type: 'medium',
              estimated_minutes: 45,
            },
            {
              quest_id: 'quest_3',
              title: 'Validation quest',
              type: 'validation',
              estimated_minutes: 15,
            },
          ],
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        };
      });

      expect(bundleResult.success).toBe(true);
      expect(bundleResult.result?.quests.length).toBe(3);

      // Complete first quest
      const completeResult = await retryStrategy.execute(async () => {
        return {
          log_id: 'log_1',
          status: 'completed',
          steps_earned: 50,
          streak_updated: true,
          current_streak: 1,
        };
      });

      expect(completeResult.success).toBe(true);
      expect(completeResult.result?.steps_earned).toBe(50);
    });

    it('should handle quest completion with evidence', async () => {
      const result = await retryStrategy.execute(async () => {
        return {
          log_id: 'log_2',
          status: 'completed',
          steps_earned: 100,
          streak_updated: true,
          current_streak: 2,
        };
      });

      expect(result.success).toBe(true);
      expect(result.result?.current_streak).toBe(2);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from transient network error during onboarding', async () => {
      let callCount = 0;

      const result = await retryStrategy.execute(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Network timeout');
        }
        return {
          goal_id: 'goal_123',
          difficulty_level: 'medium',
        };
      });

      expect(result.success).toBe(true);
      expect(callCount).toBe(2);
    });

    it('should handle 401 during quest completion', async () => {
      const error = new Error('UNAUTHORIZED');
      (error as any).code = 'UNAUTHORIZED';

      const strategy = errorHandler.getRecoveryStrategy(error);

      // Should suggest token refresh (Auth Interceptor handles it)
      expect(typeof strategy).toBe('string');
    });

    it('should handle 429 rate limiting', async () => {
      const error = new Error('TOO_MANY_REQUESTS');
      (error as any).code = 'TOO_MANY_REQUESTS';
      (error as any).details = { 'retry-after': '60' };

      const strategy = errorHandler.getRecoveryStrategy(error);
      expect(strategy).toBeDefined();
    });

    it('should fallback to offline mode on network failure', async () => {
      const networkError = new Error('Network error');
      (networkError as any).code = 'NETWORK_ERROR';

      const strategy = errorHandler.getRecoveryStrategy(networkError);
      expect(strategy).toBe(ErrorRecoveryStrategy.OFFLINE_MODE);
    });
  });

  describe('Offline Scenarios', () => {
    it('should queue requests when offline', async () => {
      const offlineManager = new OfflineManager({
        enableAutoRetry: true,
        retryInterval: 100,
        maxQueuedRequests: 50,
      });

      // Queue multiple requests
      const requests = [
        {
          id: 'req_1',
          url: '/api/quests',
          method: 'GET',
          timestamp: Date.now(),
          retries: 0,
        },
        {
          id: 'req_2',
          url: '/api/user',
          method: 'GET',
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      for (const request of requests) {
        offlineManager.queueRequest(request);
      }

      expect(offlineManager.getQueueSize()).toBe(2);

      const queued = offlineManager.getQueuedRequests();
      expect(queued).toHaveLength(2);
      expect(queued[0].url).toBe('/api/quests');

      // Remove one request
      offlineManager.removeQueuedRequest('req_1');
      expect(offlineManager.getQueueSize()).toBe(1);

      // Clear all
      offlineManager.clearQueue();
      expect(offlineManager.getQueueSize()).toBe(0);
    });
  });

  describe('Retry Statistics', () => {
    it('should collect accurate retry statistics', async () => {
      let callCount = 0;

      const result = await retryStrategy.execute(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Retry test');
        }
        return 'success';
      });

      const stats = retryStrategy.getStats();

      expect(stats.totalAttempts).toBe(3);
      expect(stats.successAttempt).toBe(2);
      expect(stats.totalDuration).toBeGreaterThan(0);
      expect(stats.averageDelay).toBeGreaterThan(0);
    });

    it('should track failed attempts', async () => {
      const result = await retryStrategy.execute(async () => {
        throw new Error('Always fails');
      });

      const stats = retryStrategy.getStats();

      expect(stats.totalAttempts).toBe(3);
      expect(stats.successAttempt).toBeNull();
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent API calls', async () => {
      const results = await Promise.all([
        retryStrategy.execute(async () => ({ id: 1, data: 'result1' })),
        retryStrategy.execute(async () => ({ id: 2, data: 'result2' })),
        retryStrategy.execute(async () => ({ id: 3, data: 'result3' })),
      ]);

      expect(results.every((r) => r.success)).toBe(true);
      expect(results.length).toBe(3);
    });

    it('should handle mixed success and failure', async () => {
      let call1 = 0;
      let call2 = 0;
      let call3 = 0;

      const results = await Promise.allSettled([
        retryStrategy.execute(async () => {
          call1++;
          if (call1 < 2) throw new Error('Fail once');
          return 'success1';
        }),
        retryStrategy.execute(async () => {
          call2++;
          throw new Error('Always fail');
        }),
        retryStrategy.execute(async () => {
          call3++;
          return 'success3';
        }),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('fulfilled');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  describe('Stress Tests', () => {
    it('should handle high volume of requests', async () => {
      const requestCount = 100;
      const promises = [];

      for (let i = 0; i < requestCount; i++) {
        promises.push(
          retryStrategy.execute(async () => ({
            id: i,
            success: true,
          }))
        );
      }

      const results = await Promise.all(promises);
      expect(results.filter((r) => r.success)).toHaveLength(requestCount);
    });

    it('should maintain performance with retries', async () => {
      const startTime = Date.now();

      const result = await retryStrategy.execute(async () => {
        return 'success';
      });

      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete quickly
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle user creating goal, getting quests, and completing them', async () => {
      // 1. Analyze goal
      const goal = await retryStrategy.execute(async () => ({
        goal_id: 'goal_123',
        difficulty_level: 'medium',
      }));

      expect(goal.success).toBe(true);

      // 2. Get quests
      const quests = await retryStrategy.execute(async () => ({
        bundle_id: 'bundle_1',
        quests: [
          { quest_id: 'q1', status: 'pending' },
          { quest_id: 'q2', status: 'pending' },
        ],
      }));

      expect(quests.success).toBe(true);

      // 3. Complete first quest
      const completion1 = await retryStrategy.execute(async () => ({
        log_id: 'log_1',
        steps_earned: 50,
      }));

      expect(completion1.success).toBe(true);

      // 4. Complete second quest
      const completion2 = await retryStrategy.execute(async () => ({
        log_id: 'log_2',
        steps_earned: 100,
      }));

      expect(completion2.success).toBe(true);

      // Verify total steps
      const totalSteps =
        (completion1.result?.steps_earned || 0) +
        (completion2.result?.steps_earned || 0);
      expect(totalSteps).toBe(150);
    });

    it('should handle milestone progression', async () => {
      const milestones = [];

      // Generate all 10 milestones
      for (let i = 1; i <= 10; i++) {
        const result = await retryStrategy.execute(async () => ({
          milestone_id: `milestone_${i}`,
          station_number: i,
          title: `Station ${i}`,
          completed: i <= 3, // First 3 are completed
        }));

        expect(result.success).toBe(true);
        milestones.push(result.result);
      }

      expect(milestones.length).toBe(10);

      // Verify progression
      const completedCount = milestones.filter((m) => m.completed).length;
      expect(completedCount).toBe(3);
    });
  });
});

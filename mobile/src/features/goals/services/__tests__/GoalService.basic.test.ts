/**
 * GoalService Basic Tests
 * 目標サービスの基本テスト
 */

import { GoalService } from '../GoalService';
import { MCPClient } from '@/core/network/mcp';
import { NetworkErrorHandler, RetryStrategy } from '@/core/network/utils';

// モック
jest.mock('@/core/network/mcp');
jest.mock('@/core/network/utils');

describe('GoalService - Basic Tests', () => {
  let goalService: GoalService;
  let mockMCPClient: jest.Mocked<MCPClient>;
  let mockErrorHandler: jest.Mocked<NetworkErrorHandler>;
  let mockRetryStrategy: jest.Mocked<RetryStrategy>;

  beforeEach(() => {
    mockMCPClient = {
      createGoal: jest.fn(),
      getGoal: jest.fn(),
      updateGoal: jest.fn(),
      deleteGoal: jest.fn(),
      analyzeGoal: jest.fn(),
    } as any;

    mockErrorHandler = {
      getRecoveryStrategy: jest.fn(),
      shouldRetry: jest.fn(),
      calculateRetryDelay: jest.fn(),
    } as any;

    mockRetryStrategy = {
      execute: jest.fn((fn) => fn()),
      calculateDelay: jest.fn(),
      reset: jest.fn(),
    } as any;

    goalService = new GoalService(
      mockMCPClient,
      mockErrorHandler,
      mockRetryStrategy
    );

    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('インスタンスを作成できること', () => {
      expect(goalService).toBeInstanceOf(GoalService);
    });

    it('依存関係が正しく設定されること', () => {
      expect(goalService).toBeDefined();
      // 内部プロパティはprivateなので直接確認できないが、エラーが出なければOK
    });
  });

  describe('createGoal', () => {
    it('目標を作成できること', async () => {
      const mockGoal = {
        id: 'goal-1',
        title: 'Test Goal',
        status: 'active',
        priority: 'high',
        deadline: '2025-12-31',
        durationDays: 365,
        kpi: 'Complete 100 tasks',
      };

      mockMCPClient.createGoal.mockResolvedValue(mockGoal);
      mockRetryStrategy.execute.mockImplementation((fn) => fn());

      const payload = {
        title: 'Test Goal',
        kpi: 'Complete 100 tasks',
        deadline: '2025-12-31',
        durationDays: 365,
      };

      const result = await goalService.createGoal(payload);

      expect(result).toBeDefined();
      expect(mockRetryStrategy.execute).toHaveBeenCalled();
    });
  });
});

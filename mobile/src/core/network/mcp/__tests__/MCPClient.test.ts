/**
 * MCPClient Tests
 * テスト対象: MCP（Model Context Protocol）クライアント
 */

import axios from 'axios';
import { MCPClient, NetworkError } from '../MCPClient';
import { SecureTokenStore } from '@/services/auth';
import {
  MCPClientConfig,
  GoalAnalysisResponse,
  MilestoneResponse,
  QuestBundleResponse,
} from '../types';

// Mock dependencies
jest.mock('axios');
jest.mock('@/services/auth');

describe('MCPClient', () => {
  let client: MCPClient;
  let config: MCPClientConfig;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    config = {
      baseURL: 'https://api.example.com/mcp',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    };

    // Mock axios.create
    mockAxiosInstance = {
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    jest.mocked(axios.create).mockReturnValue(mockAxiosInstance);

    // Axios interceptor setup
    mockAxiosInstance.interceptors.request.use.mockImplementation(
      (onFulfilled: any) => onFulfilled
    );
    mockAxiosInstance.interceptors.response.use.mockImplementation(
      (onFulfilled: any, onRejected: any) => ({ onFulfilled, onRejected })
    );

    jest.mocked(SecureTokenStore.getToken).mockResolvedValue({
      accessToken: 'test_token_123',
      refreshToken: 'refresh_token',
      expiresAt: Date.now() + 3600000,
      tokenType: 'Bearer',
      issuedAt: Date.now(),
    });

    client = new MCPClient(config);
  });

  describe('Initialization', () => {
    it('should create MCPClient with config', () => {
      expect(client).toBeDefined();
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: config.baseURL,
          timeout: config.timeout,
        })
      );
    });

    it('should setup request interceptor', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('should setup response interceptor', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('analyzeGoal', () => {
    it('should analyze goal with SMART + WOOP', async () => {
      const mockResponse = {
        goal_id: 'goal_123',
        smart_analysis: {
          specific: 'Run a marathon',
          measurable: '42.195 km',
          achievable: 'With training',
          relevant: 'Personal fitness goal',
          time_bound: 'Within 6 months',
        },
        woop_analysis: {
          wish: 'Run a full marathon',
          outcome: 'Complete a marathon',
          obstacle: 'Time management',
          plan: 'Train daily for 30 minutes',
        },
        difficulty_level: 'hard',
        estimated_duration_days: 180,
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: mockResponse,
          id: '1',
        },
      });

      const result = await client.analyzeGoal('Run a marathon', 'Personal fitness goal');

      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/rpc',
        expect.objectContaining({
          method: 'goal.analyze',
          params: { goal: 'Run a marathon', context: 'Personal fitness goal' },
        }),
        expect.any(Object)
      );
    });

    it('should use cache for repeated goal analysis', async () => {
      const mockResponse: GoalAnalysisResponse = {
        goal_id: 'goal_123',
        smart_analysis: {
          specific: 'Test goal',
          measurable: 'Metric',
          achievable: 'Yes',
          relevant: 'Yes',
          time_bound: '3 months',
        },
        woop_analysis: {
          wish: 'Test',
          outcome: 'Achieve goal',
          obstacle: 'Time',
          plan: 'Daily work',
        },
        difficulty_level: 'medium',
        estimated_duration_days: 90,
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: mockResponse,
          id: '1',
        },
      });

      // First call
      await client.analyzeGoal('Test goal');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await client.analyzeGoal('Test goal');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should handle goal analysis error', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid goal format' },
        },
        message: 'Request failed',
      });

      await expect(client.analyzeGoal('Invalid goal')).rejects.toThrow(NetworkError);
    });
  });

  describe('generateMilestones', () => {
    it('should generate 10 milestones', async () => {
      const mockResponse: MilestoneResponse[] = Array.from({ length: 10 }, (_, i) => ({
        milestone_id: `milestone_${i + 1}`,
        station_number: i + 1,
        title: `Station ${i + 1}`,
        description: `Milestone at station ${i + 1}`,
        criteria: `Complete ${(i + 1) * 10}% of goal`,
        estimated_steps: 100 * (i + 1),
      }));

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: mockResponse,
          id: '1',
        },
      });

      const result = await client.generateMilestones(
        'goal_123',
        'Run a marathon',
        'hard',
        180
      );

      expect(result).toHaveLength(10);
      expect(result[0].station_number).toBe(1);
      expect(result[9].station_number).toBe(10);
    });

    it('should call milestone.generate method', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: [],
          id: '1',
        },
      });

      await client.generateMilestones('goal_123', 'Test goal', 'medium', 90);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/rpc',
        expect.objectContaining({
          method: 'milestone.generate',
          params: {
            goal_id: 'goal_123',
            goal: 'Test goal',
            difficulty_level: 'medium',
            duration_days: 90,
          },
        }),
        expect.any(Object)
      );
    });

    it('should handle milestone generation error', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
        message: 'Request failed',
      });

      await expect(
        client.generateMilestones('goal_123', 'Test goal', 'medium', 90)
      ).rejects.toThrow(NetworkError);
    });
  });

  describe('getQuestBundle', () => {
    it('should fetch today\'s quest bundle', async () => {
      const mockResponse: QuestBundleResponse = {
        bundle_id: 'bundle_123',
        date: '2025-10-22',
        quests: [
          {
            quest_id: 'quest_1',
            title: 'Small quest',
            description: '15-30 min quest',
            type: 'small',
            estimated_minutes: 25,
            completion_criteria: 'Complete task',
            evidence_type: 'text',
            difficulty: 'easy',
          },
          {
            quest_id: 'quest_2',
            title: 'Medium quest',
            description: '30-60 min quest',
            type: 'medium',
            estimated_minutes: 45,
            completion_criteria: 'Complete task',
            evidence_type: 'image',
            difficulty: 'medium',
          },
          {
            quest_id: 'quest_3',
            title: 'Validation quest',
            description: '10-20 min quest',
            type: 'validation',
            estimated_minutes: 15,
            completion_criteria: 'Review and validate',
            evidence_type: 'none',
            difficulty: 'easy',
          },
        ],
        expires_at: '2025-10-23T00:00:00Z',
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: mockResponse,
          id: '1',
        },
      });

      const userProfile = {
        commit_time: 'morning',
        available_minutes_per_day: 120,
        difficulty_preference: 'medium' as const,
        quest_type_preference: ['small', 'medium'],
      };

      const result = await client.getQuestBundle(
        'user_123',
        'milestone_1',
        userProfile
      );

      expect(result.quests).toHaveLength(3);
      expect(result.quests[0].type).toBe('small');
      expect(result.quests[1].type).toBe('medium');
    });

    it('should call quest.generate method with all parameters', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: {
            bundle_id: 'bundle_123',
            date: '2025-10-22',
            quests: [],
            expires_at: '2025-10-23T00:00:00Z',
          },
          id: '1',
        },
      });

      const userProfile = {
        commit_time: 'morning',
        available_minutes_per_day: 120,
        difficulty_preference: 'medium' as const,
        quest_type_preference: ['small'],
      };

      await client.getQuestBundle('user_123', 'milestone_1', userProfile);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/rpc',
        expect.objectContaining({
          method: 'quest.generate',
          params: expect.objectContaining({
            user_id: 'user_123',
            current_milestone_id: 'milestone_1',
            user_profile: userProfile,
          }),
        }),
        expect.any(Object)
      );
    });

    it('should cache quest bundle', async () => {
      const mockResponse: QuestBundleResponse = {
        bundle_id: 'bundle_123',
        date: '2025-10-22',
        quests: [],
        expires_at: '2025-10-23T00:00:00Z',
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: mockResponse,
          id: '1',
        },
      });

      const userProfile = {
        commit_time: 'morning',
        available_minutes_per_day: 120,
        difficulty_preference: 'medium' as const,
        quest_type_preference: [],
      };

      // First call
      await client.getQuestBundle('user_123', 'milestone_1', userProfile);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await client.getQuestBundle('user_123', 'milestone_1', userProfile);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('completeQuest', () => {
    it('should complete quest with status and evidence', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: {
            log_id: 'log_123',
            status: 'completed',
            steps_earned: 100,
            streak_updated: true,
            current_streak: 5,
          },
          id: '1',
        },
      });

      const result = await client.completeQuest(
        'user_123',
        'quest_1',
        'completed',
        {
          actualMinutes: 25,
          evidence: {
            type: 'text',
            content: 'Quest completed successfully',
          },
        }
      );

      expect(result.status).toBe('completed');
      expect(result.steps_earned).toBe(100);
      expect(result.current_streak).toBe(5);
    });

    it('should handle quest skip', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: {
            log_id: 'log_124',
            status: 'skipped',
            steps_earned: 0,
            streak_updated: false,
            current_streak: 4,
          },
          id: '1',
        },
      });

      const result = await client.completeQuest(
        'user_123',
        'quest_1',
        'skipped',
        { skipReason: 'Too busy' }
      );

      expect(result.status).toBe('skipped');
      expect(result.steps_earned).toBe(0);
    });

    it('should handle quest obstruction', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: {
            log_id: 'log_125',
            status: 'obstructed',
            steps_earned: 0,
            streak_updated: false,
            current_streak: 4,
          },
          id: '1',
        },
      });

      const result = await client.completeQuest(
        'user_123',
        'quest_1',
        'obstructed',
        { obstructionReason: 'Unexpected event occurred' }
      );

      expect(result.status).toBe('obstructed');
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile with cache', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: {
            user_id: 'user_123',
            profile_id: 'profile_123',
            commit_time: 'morning',
            available_minutes_per_day: 120,
            difficulty_preference: 'medium',
            quest_type_preference: ['small', 'medium'],
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-10-22T00:00:00Z',
          },
          id: '1',
        },
      });

      const result = await client.getUserProfile('user_123');

      expect(result.user_id).toBe('user_123');
      expect(result.commit_time).toBe('morning');
    });

    it('should cache user profile', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: {
            user_id: 'user_123',
            profile_id: 'profile_123',
            commit_time: 'morning',
            available_minutes_per_day: 120,
            difficulty_preference: 'medium',
            quest_type_preference: [],
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-10-22T00:00:00Z',
          },
          id: '1',
        },
      });

      // First call
      await client.getUserProfile('user_123');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await client.getUserProfile('user_123');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Management', () => {
    it('should clear all cache', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: { goal_id: 'goal_123' },
          id: '1',
        },
      });

      await client.analyzeGoal('Test goal');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);

      client.clearCache();

      await client.analyzeGoal('Test goal');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });

    it('should clear cache by method', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: { goal_id: 'goal_123' },
          id: '1',
        },
      });

      await client.analyzeGoal('Goal 1');
      await client.analyzeGoal('Goal 2');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);

      client.clearCacheByMethod('goal.analyze');

      await client.analyzeGoal('Goal 1');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: { status: 'healthy', version: '1.0.0' },
          id: '1',
        },
      });

      const result = await client.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.version).toBe('1.0.0');
    });

    it('should not cache health check', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          jsonrpc: '2.0',
          result: { status: 'healthy', version: '1.0.0' },
          id: '1',
        },
      });

      await client.healthCheck();
      await client.healthCheck();

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 Unauthorized', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        response: { status: 401, data: { message: 'Unauthorized' } },
        message: 'Request failed',
      });

      await expect(client.analyzeGoal('Test')).rejects.toThrow(NetworkError);
    });

    it('should handle 500 Server Error', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        response: { status: 500, data: { message: 'Internal server error' } },
        message: 'Request failed',
      });

      await expect(client.analyzeGoal('Test')).rejects.toThrow(NetworkError);
    });

    it('should handle network timeout', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        message: 'timeout of 30000ms exceeded',
      });

      await expect(client.analyzeGoal('Test')).rejects.toThrow(NetworkError);
    });
  });
});

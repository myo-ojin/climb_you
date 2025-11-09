/**
 * GoalRepositoryImpl Tests
 * 目標リポジトリの実装テスト
 */

import { GoalRepositoryImpl } from './GoalRepositoryImpl';
import type { MCPClient } from '@/core/network/mcp';
import type { LocalDataSource } from '../datasources/LocalDataSource';
import type { Goal } from '@/core/domain/entities/Goal';
import { GoalStatus } from '@/core/domain/entities/Goal';
import type { CreateGoalDTO } from '@/core/domain/repositories/GoalRepository';

// モック定義
class MockMCPClient implements Partial<MCPClient> {
  analyzeGoal = jest.fn();
  createGoal = jest.fn();
}

class MockLocalDataSource implements Partial<LocalDataSource> {
  saveGoal = jest.fn();
  getGoalById = jest.fn();
  getUserGoals = jest.fn();
  updateGoal = jest.fn();
}

describe('GoalRepositoryImpl', () => {
  let repository: GoalRepositoryImpl;
  let mockMCP: MockMCPClient;
  let mockLocal: MockLocalDataSource;

  const mockGoal: Goal = {
    id: 'goal-1',
    userId: 'user-1',
    title: 'テスト目標',
    kpi: '毎日30分の運動',
    duration: '3ヶ月',
    deadline: new Date('2025-03-01'),
    obstacles: ['時間がない', '疲れる'],
    plans: ['朝起きたらすぐ運動する', '運動後にご褒美を用意する'],
    status: GoalStatus.ACTIVE,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    mockMCP = new MockMCPClient();
    mockLocal = new MockLocalDataSource();
    repository = new GoalRepositoryImpl(
      mockLocal as LocalDataSource,
      mockMCP as MCPClient
    );
    jest.clearAllMocks();
  });

  describe('analyzeGoal', () => {
    it('MCPを使用して目標を分析できること', async () => {
      const mockResponse = {
        smart_analysis: {
          specific: 'Yes, the goal is specific',
          measurable: 'Yes, measurable',
          achievable: 'Yes, achievable',
          relevant: 'Yes, relevant',
          time_bound: 'Yes, time-bound',
        },
        woop_analysis: {
          wish: 'I want to exercise daily',
          outcome: 'I will be healthier',
          obstacle: 'I do not have time',
          plan: 'I will wake up early',
        },
      };

      mockMCP.analyzeGoal.mockResolvedValue(mockResponse);

      const result = await repository.analyzeGoal('毎日運動する');

      expect(mockMCP.analyzeGoal).toHaveBeenCalledWith('毎日運動する', undefined);
      expect(result.isComplete).toBe(true);
      expect(result.smartAnalysis.specific).toBe(true);
      expect(result.smartAnalysis.measurable).toBe(true);
      expect(result.smartAnalysis.achievable).toBe(true);
      expect(result.smartAnalysis.relevant).toBe(true);
      expect(result.smartAnalysis.timeBound).toBe(true);
      expect(result.woopAnalysis.wish).toBe('I want to exercise daily');
      expect(result.woopAnalysis.obstacles).toEqual(['I do not have time']);
      expect(result.woopAnalysis.plan).toEqual(['I will wake up early']);
    });

    it('日本語の分析レスポンスも処理できること', async () => {
      const mockResponse = {
        smart_analysis: {
          specific: 'はい、具体的です',
          measurable: 'はい、測定可能です',
          achievable: 'はい、達成可能です',
          relevant: 'はい、関連性があります',
          time_bound: 'はい、期限が設定されています',
        },
        woop_analysis: {
          wish: '毎日運動したい',
          outcome: '健康になる',
          obstacle: '時間がない',
          plan: '朝早く起きる',
        },
      };

      mockMCP.analyzeGoal.mockResolvedValue(mockResponse);

      const result = await repository.analyzeGoal('毎日運動する', '健康的な生活');

      expect(mockMCP.analyzeGoal).toHaveBeenCalledWith('毎日運動する', '健康的な生活');
      expect(result.smartAnalysis.specific).toBe(true);
      expect(result.smartAnalysis.measurable).toBe(true);
      expect(result.woopAnalysis.wish).toBe('毎日運動したい');
    });

    it('MCPエラー時に例外をスローすること', async () => {
      mockMCP.analyzeGoal.mockRejectedValue(new Error('Network error'));

      await expect(repository.analyzeGoal('目標')).rejects.toThrow('Network error');
    });
  });

  describe('createGoal', () => {
    it('目標を作成してローカルに保存できること', async () => {
      const goalData: CreateGoalDTO = {
        userId: 'user-1',
        title: 'テスト目標',
        kpi: '毎日30分の運動',
        duration: '3ヶ月',
        deadline: new Date('2025-03-01'),
        obstacles: ['時間がない'],
        plans: ['朝起きたらすぐ運動する'],
      };

      mockLocal.saveGoal.mockResolvedValue(undefined);

      const result = await repository.createGoal(goalData);

      expect(result.userId).toBe('user-1');
      expect(result.title).toBe('テスト目標');
      expect(result.kpi).toBe('毎日30分の運動');
      expect(result.status).toBe(GoalStatus.ACTIVE);
      expect(result.id).toMatch(/^goal_/);
      expect(mockLocal.saveGoal).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          title: 'テスト目標',
          status: GoalStatus.ACTIVE,
        })
      );
    });

    it('ローカル保存失敗時に例外をスローすること', async () => {
      const goalData: CreateGoalDTO = {
        userId: 'user-1',
        title: 'テスト目標',
        kpi: '毎日30分の運動',
        duration: '3ヶ月',
        obstacles: [],
        plans: [],
      };

      mockLocal.saveGoal.mockRejectedValue(new Error('Database error'));

      await expect(repository.createGoal(goalData)).rejects.toThrow('Database error');
    });

    it('作成時にタイムスタンプが設定されること', async () => {
      const goalData: CreateGoalDTO = {
        userId: 'user-1',
        title: 'テスト目標',
        kpi: 'KPI',
        duration: '1ヶ月',
        obstacles: [],
        plans: [],
      };

      mockLocal.saveGoal.mockResolvedValue(undefined);

      const before = Date.now();
      const result = await repository.createGoal(goalData);
      const after = Date.now();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after);
      expect(result.updatedAt.getTime()).toBe(result.createdAt.getTime());
    });
  });

  describe('getGoalById', () => {
    it('IDで目標を取得できること', async () => {
      mockLocal.getGoalById.mockResolvedValue(mockGoal);

      const result = await repository.getGoalById('goal-1');

      expect(result).toEqual(mockGoal);
      expect(mockLocal.getGoalById).toHaveBeenCalledWith('goal-1');
    });

    it('目標が見つからない場合はnullを返すこと', async () => {
      mockLocal.getGoalById.mockResolvedValue(null);

      const result = await repository.getGoalById('non-existent');

      expect(result).toBeNull();
      expect(mockLocal.getGoalById).toHaveBeenCalledWith('non-existent');
    });

    it('データベースエラー時に例外をスローすること', async () => {
      mockLocal.getGoalById.mockRejectedValue(new Error('DB error'));

      await expect(repository.getGoalById('goal-1')).rejects.toThrow('DB error');
    });
  });

  describe('getUserGoals', () => {
    it('ユーザーの全目標を取得できること', async () => {
      const mockGoals = [mockGoal, { ...mockGoal, id: 'goal-2', title: '目標2' }];
      mockLocal.getUserGoals.mockResolvedValue(mockGoals);

      const result = await repository.getUserGoals('user-1');

      expect(result).toEqual(mockGoals);
      expect(result).toHaveLength(2);
      expect(mockLocal.getUserGoals).toHaveBeenCalledWith('user-1');
    });

    it('目標がない場合は空配列を返すこと', async () => {
      mockLocal.getUserGoals.mockResolvedValue([]);

      const result = await repository.getUserGoals('user-1');

      expect(result).toEqual([]);
      expect(mockLocal.getUserGoals).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getUserGoal', () => {
    it('ユーザーIDで目標を取得できること', async () => {
      const mockLocal2 = mockLocal as MockLocalDataSource & { getGoal: jest.Mock };
      mockLocal2.getGoal = jest.fn().mockResolvedValue(mockGoal);

      const result = await repository.getUserGoal('user-1');

      expect(result).toEqual(mockGoal);
      expect(mockLocal2.getGoal).toHaveBeenCalledWith('user-1');
    });

    it('目標が見つからない場合はnullを返すこと', async () => {
      const mockLocal2 = mockLocal as MockLocalDataSource & { getGoal: jest.Mock };
      mockLocal2.getGoal = jest.fn().mockResolvedValue(null);

      const result = await repository.getUserGoal('user-1');

      expect(result).toBeNull();
    });
  });

  describe('updateGoal', () => {
    it('目標を更新できること', async () => {
      const updatedGoal = { ...mockGoal, title: '更新された目標' };
      mockLocal.updateGoal.mockResolvedValue(undefined);

      const result = await repository.updateGoal(updatedGoal);

      expect(result.title).toBe('更新された目標');
      expect(mockLocal.updateGoal).toHaveBeenCalledWith(
        expect.objectContaining({ title: '更新された目標' })
      );
    });

    it('更新時にupdatedAtが更新されること', async () => {
      const oldDate = new Date('2025-01-01');
      const goalToUpdate = { ...mockGoal, updatedAt: oldDate };
      mockLocal.updateGoal.mockResolvedValue(undefined);

      const before = Date.now();
      const result = await repository.updateGoal(goalToUpdate);
      const after = Date.now();

      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after);
      expect(result.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('更新失敗時に例外をスローすること', async () => {
      mockLocal.updateGoal.mockRejectedValue(new Error('Update failed'));

      await expect(repository.updateGoal(mockGoal)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteGoal', () => {
    it('目標を削除できること', async () => {
      const mockLocal2 = mockLocal as MockLocalDataSource & { deleteGoal: jest.Mock };
      mockLocal2.deleteGoal = jest.fn().mockResolvedValue(undefined);

      await repository.deleteGoal('goal-1');

      expect(mockLocal2.deleteGoal).toHaveBeenCalledWith('goal-1');
    });

    it('削除失敗時に例外をスローすること', async () => {
      const mockLocal2 = mockLocal as MockLocalDataSource & { deleteGoal: jest.Mock };
      mockLocal2.deleteGoal = jest.fn().mockRejectedValue(new Error('Delete failed'));

      await expect(repository.deleteGoal('goal-1')).rejects.toThrow('Delete failed');
    });
  });
});

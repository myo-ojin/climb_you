/**
 * GoalUseCase Basic Tests
 * 目標ユースケースの基本テスト
 */

import { GoalUseCase } from '../GoalUseCase';
import type { GoalRepository, GoalAnalysisResult, CreateGoalDTO } from '../../repositories/GoalRepository';
import type { Goal } from '../../entities/Goal';

describe('GoalUseCase - Basic Tests', () => {
  let goalUseCase: GoalUseCase;
  let mockRepository: jest.Mocked<GoalRepository>;

  beforeEach(() => {
    mockRepository = {
      analyzeGoal: jest.fn(),
      createGoal: jest.fn(),
      getGoalById: jest.fn(),
      getUserGoal: jest.fn(),
      updateGoal: jest.fn(),
      deleteGoal: jest.fn(),
    } as any;

    goalUseCase = new GoalUseCase(mockRepository);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('インスタンスを作成できること', () => {
      expect(goalUseCase).toBeInstanceOf(GoalUseCase);
    });
  });

  describe('analyzeGoal', () => {
    it('目標を分析できること', async () => {
      const mockAnalysis: GoalAnalysisResult = {
        smartAnalysis: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          timeBound: true,
          score: 5,
        },
        woopAnalysis: {
          wish: 'Get fit',
          outcome: 'Feel healthier',
          obstacles: ['No time'],
          plan: 'Wake up early',
        },
      };

      mockRepository.analyzeGoal.mockResolvedValue(mockAnalysis);

      const result = await goalUseCase.analyzeGoal('毎日運動する');

      expect(result).toEqual(mockAnalysis);
      expect(mockRepository.analyzeGoal).toHaveBeenCalledWith('毎日運動する', undefined);
    });

    it('空の目標テキストでエラーをスローすること', async () => {
      await expect(goalUseCase.analyzeGoal('')).rejects.toThrow('Goal text is required');
      await expect(goalUseCase.analyzeGoal('   ')).rejects.toThrow('Goal text is required');
    });
  });

  describe('createGoal', () => {
    it('目標を作成できること', async () => {
      const mockGoal: Goal = {
        id: 'goal-1',
        userId: 'user-1',
        title: 'Test Goal',
        kpi: 'Complete 100 tasks',
        deadline: '2025-12-31',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRepository.createGoal.mockResolvedValue(mockGoal);

      const goalData: CreateGoalDTO = {
        userId: 'user-1',
        title: 'Test Goal',
        kpi: 'Complete 100 tasks',
        deadline: '2025-12-31',
      };

      const result = await goalUseCase.createGoal(goalData);

      expect(result).toEqual(mockGoal);
      expect(mockRepository.createGoal).toHaveBeenCalledWith(goalData);
    });

    it('タイトルがない場合はエラーをスローすること', async () => {
      const goalData: CreateGoalDTO = {
        userId: 'user-1',
        title: '',
        kpi: 'Complete 100 tasks',
        deadline: '2025-12-31',
      };

      await expect(goalUseCase.createGoal(goalData)).rejects.toThrow('Goal title is required');
    });

    it('User IDがない場合はエラーをスローすること', async () => {
      const goalData: CreateGoalDTO = {
        userId: '',
        title: 'Test Goal',
        kpi: 'Complete 100 tasks',
        deadline: '2025-12-31',
      };

      await expect(goalUseCase.createGoal(goalData)).rejects.toThrow('User ID is required');
    });
  });

  describe('getGoal', () => {
    it('目標を取得できること', async () => {
      const mockGoal: Goal = {
        id: 'goal-1',
        userId: 'user-1',
        title: 'Test Goal',
        kpi: 'Complete 100 tasks',
        deadline: '2025-12-31',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRepository.getGoalById.mockResolvedValue(mockGoal);

      const result = await goalUseCase.getGoal('goal-1');

      expect(result).toEqual(mockGoal);
      expect(mockRepository.getGoalById).toHaveBeenCalledWith('goal-1');
    });

    it('Goal IDがない場合はエラーをスローすること', async () => {
      await expect(goalUseCase.getGoal('')).rejects.toThrow('Goal ID is required');
    });
  });
});

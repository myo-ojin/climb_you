/**
 * MilestoneUseCase Basic Tests
 * マイルストーンユースケースの基本テスト
 */

import { MilestoneUseCase } from '../MilestoneUseCase';
import type { MilestoneRepository, GenerateMilestonesDTO } from '../../repositories/MilestoneRepository';
import type { Milestone } from '../../entities/Milestone';

describe('MilestoneUseCase - Basic Tests', () => {
  let milestoneUseCase: MilestoneUseCase;
  let mockRepository: jest.Mocked<MilestoneRepository>;

  beforeEach(() => {
    mockRepository = {
      generateMilestones: jest.fn(),
      createMilestone: jest.fn(),
      getMilestoneById: jest.fn(),
      getMilestonesByGoalId: jest.fn(),
      updateMilestone: jest.fn(),
      deleteMilestone: jest.fn(),
      batchCreateMilestones: jest.fn(),
      batchDeleteMilestonesByGoalId: jest.fn(),
    } as any;

    milestoneUseCase = new MilestoneUseCase(mockRepository);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('インスタンスを作成できること', () => {
      expect(milestoneUseCase).toBeInstanceOf(MilestoneUseCase);
    });
  });

  describe('generateMilestones', () => {
    it('10合目のマイルストーンを生成できること', async () => {
      const mockMilestones: Milestone[] = Array.from({ length: 10 }, (_, i) => ({
        id: `milestone-${i + 1}`,
        goalId: 'goal-1',
        station: i + 1,
        title: `Station ${i + 1}`,
        description: `Description for station ${i + 1}`,
        completionCriteria: 'Criteria',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      mockRepository.generateMilestones.mockResolvedValue(mockMilestones);

      const params: GenerateMilestonesDTO = {
        goalId: 'goal-1',
        goalText: '毎日運動する',
        kpi: '100回達成',
        durationDays: 100,
      };

      const result = await milestoneUseCase.generateMilestones(params);

      expect(result).toHaveLength(10);
      expect(result).toEqual(mockMilestones);
      expect(mockRepository.generateMilestones).toHaveBeenCalledWith(params);
    });

    it('Goal IDがない場合はエラーをスローすること', async () => {
      const params: GenerateMilestonesDTO = {
        goalId: '',
        goalText: '毎日運動する',
        kpi: '100回達成',
        durationDays: 100,
      };

      await expect(milestoneUseCase.generateMilestones(params)).rejects.toThrow('Goal ID is required');
    });

    it('Goal textがない場合はエラーをスローすること', async () => {
      const params: GenerateMilestonesDTO = {
        goalId: 'goal-1',
        goalText: '',
        kpi: '100回達成',
        durationDays: 100,
      };

      await expect(milestoneUseCase.generateMilestones(params)).rejects.toThrow('Goal text is required');
    });

    it('期間が0以下の場合はエラーをスローすること', async () => {
      const params: GenerateMilestonesDTO = {
        goalId: 'goal-1',
        goalText: '毎日運動する',
        kpi: '100回達成',
        durationDays: 0,
      };

      await expect(milestoneUseCase.generateMilestones(params)).rejects.toThrow('Duration must be positive');
    });

    it('10合目以外が返された場合はエラーをスローすること', async () => {
      const mockMilestones: Milestone[] = Array.from({ length: 5 }, (_, i) => ({
        id: `milestone-${i + 1}`,
        goalId: 'goal-1',
        station: i + 1,
        title: `Station ${i + 1}`,
        description: `Description for station ${i + 1}`,
        completionCriteria: 'Criteria',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      mockRepository.generateMilestones.mockResolvedValue(mockMilestones);

      const params: GenerateMilestonesDTO = {
        goalId: 'goal-1',
        goalText: '毎日運動する',
        kpi: '100回達成',
        durationDays: 100,
      };

      await expect(milestoneUseCase.generateMilestones(params)).rejects.toThrow('Expected 10 milestones, but got 5');
    });
  });

  describe('createMilestone', () => {
    it('マイルストーンを作成できること', async () => {
      const mockMilestone: Milestone = {
        id: 'milestone-1',
        goalId: 'goal-1',
        station: 5,
        title: 'Station 5',
        description: 'Halfway point',
        completionCriteria: 'Complete 50%',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRepository.createMilestone.mockResolvedValue(mockMilestone);

      const result = await milestoneUseCase.createMilestone(mockMilestone);

      expect(result).toEqual(mockMilestone);
      expect(mockRepository.createMilestone).toHaveBeenCalledWith(mockMilestone);
    });

    it('Goal IDがない場合はエラーをスローすること', async () => {
      const milestone: Milestone = {
        id: 'milestone-1',
        goalId: '',
        station: 5,
        title: 'Station 5',
        description: 'Halfway point',
        completionCriteria: 'Complete 50%',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await expect(milestoneUseCase.createMilestone(milestone)).rejects.toThrow('Goal ID is required');
    });

    it('Stationが範囲外の場合はエラーをスローすること', async () => {
      const milestone: Milestone = {
        id: 'milestone-1',
        goalId: 'goal-1',
        station: 11,
        title: 'Station 11',
        description: 'Invalid station',
        completionCriteria: 'Invalid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await expect(milestoneUseCase.createMilestone(milestone)).rejects.toThrow('Station must be between 1 and 10');
    });
  });
});

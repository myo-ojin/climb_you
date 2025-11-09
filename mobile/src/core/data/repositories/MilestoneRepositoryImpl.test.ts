/**
 * MilestoneRepositoryImpl Tests
 * マイルストーンリポジトリの実装テスト
 */

import { MilestoneRepositoryImpl } from './MilestoneRepositoryImpl';
import type { MCPClient } from '@/core/network/mcp';
import type { LocalDataSource } from '../datasources/LocalDataSource';
import type { Milestone } from '@/core/domain/entities/Milestone';
import { MilestoneStatus } from '@/core/domain/entities/Milestone';
import type { GenerateMilestonesDTO } from '@/core/domain/repositories/MilestoneRepository';

// モック定義
class MockMCPClient implements Partial<MCPClient> {
  generateMilestones = jest.fn();
}

class MockLocalDataSource implements Partial<LocalDataSource> {
  saveMilestone = jest.fn();
  saveMilestones = jest.fn();
  getMilestone = jest.fn();
  getMilestones = jest.fn();
  updateMilestone = jest.fn();
  deleteMilestone = jest.fn();
  deleteGoalMilestones = jest.fn();
}

describe('MilestoneRepositoryImpl', () => {
  let repository: MilestoneRepositoryImpl;
  let mockMCP: MockMCPClient;
  let mockLocal: MockLocalDataSource;

  const mockMilestone: Milestone = {
    id: 'milestone-1',
    goalId: 'goal-1',
    station: 1,
    title: '第1合目',
    description: '基礎を固める',
    achievementCriteria: '基本的な習慣を身につける',
    targetSteps: 1000,
    status: MilestoneStatus.NOT_STARTED,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    mockMCP = new MockMCPClient();
    mockLocal = new MockLocalDataSource();
    repository = new MilestoneRepositoryImpl(
      mockLocal as LocalDataSource,
      mockMCP as MCPClient
    );
    jest.clearAllMocks();
  });

  describe('generateMilestones', () => {
    it('MCPを使用して10合目のマイルストーンを生成できること', async () => {
      const params: GenerateMilestonesDTO = {
        goalId: 'goal-1',
        goalText: '毎日運動する',
        difficulty: 'medium',
        durationDays: 90,
      };

      const mockMCPResponse = [
        {
          milestone_id: 'milestone-1',
          station_number: 1,
          title: '第1合目',
          description: '基礎を固める',
          criteria: '基本的な習慣を身につける',
          estimated_steps: 1000,
        },
        {
          milestone_id: 'milestone-2',
          station_number: 2,
          title: '第2合目',
          description: '習慣化する',
          criteria: '継続して実践できる',
          estimated_steps: 1000,
        },
      ];

      mockMCP.generateMilestones.mockResolvedValue(mockMCPResponse);
      mockLocal.saveMilestones.mockResolvedValue(undefined);

      const result = await repository.generateMilestones(params);

      expect(mockMCP.generateMilestones).toHaveBeenCalledWith(
        'goal-1',
        '毎日運動する',
        'medium',
        90
      );
      expect(result).toHaveLength(2);
      expect(result[0].station).toBe(1);
      expect(result[0].goalId).toBe('goal-1');
      expect(result[0].status).toBe(MilestoneStatus.NOT_STARTED);
      expect(result[1].station).toBe(2);
      expect(mockLocal.saveMilestones).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ station: 1 }),
          expect.objectContaining({ station: 2 }),
        ])
      );
    });

    it('MCP生成失敗時に例外をスローすること', async () => {
      const params: GenerateMilestonesDTO = {
        goalId: 'goal-1',
        goalText: 'test',
        difficulty: 'easy',
        durationDays: 30,
      };

      mockMCP.generateMilestones.mockRejectedValue(new Error('MCP error'));

      await expect(repository.generateMilestones(params)).rejects.toThrow('MCP error');
    });

    it('ローカル保存失敗時に例外をスローすること', async () => {
      const params: GenerateMilestonesDTO = {
        goalId: 'goal-1',
        goalText: 'test',
        difficulty: 'easy',
        durationDays: 30,
      };

      mockMCP.generateMilestones.mockResolvedValue([
        {
          milestone_id: 'milestone-1',
          station_number: 1,
          title: 'test',
          description: 'test',
          criteria: 'test',
          estimated_steps: 1000,
        },
      ]);
      mockLocal.saveMilestones.mockRejectedValue(new Error('DB error'));

      await expect(repository.generateMilestones(params)).rejects.toThrow('DB error');
    });
  });

  describe('createMilestone', () => {
    it('マイルストーンを作成できること', async () => {
      mockLocal.saveMilestone.mockResolvedValue(undefined);

      const result = await repository.createMilestone(mockMilestone);

      expect(result).toEqual(mockMilestone);
      expect(mockLocal.saveMilestone).toHaveBeenCalledWith(mockMilestone);
    });

    it('作成失敗時に例外をスローすること', async () => {
      mockLocal.saveMilestone.mockRejectedValue(new Error('Save failed'));

      await expect(repository.createMilestone(mockMilestone)).rejects.toThrow(
        'Save failed'
      );
    });
  });

  describe('createMilestones', () => {
    it('複数のマイルストーンを一括作成できること', async () => {
      const milestones = [
        mockMilestone,
        { ...mockMilestone, id: 'milestone-2', station: 2 },
      ];
      mockLocal.saveMilestones.mockResolvedValue(undefined);

      const result = await repository.createMilestones(milestones);

      expect(result).toEqual(milestones);
      expect(result).toHaveLength(2);
      expect(mockLocal.saveMilestones).toHaveBeenCalledWith(milestones);
    });

    it('一括作成失敗時に例外をスローすること', async () => {
      mockLocal.saveMilestones.mockRejectedValue(new Error('Batch save failed'));

      await expect(repository.createMilestones([mockMilestone])).rejects.toThrow(
        'Batch save failed'
      );
    });
  });

  describe('getMilestoneById', () => {
    it('IDでマイルストーンを取得できること', async () => {
      mockLocal.getMilestone.mockResolvedValue(mockMilestone);

      const result = await repository.getMilestoneById('milestone-1');

      expect(result).toEqual(mockMilestone);
      expect(mockLocal.getMilestone).toHaveBeenCalledWith('milestone-1');
    });

    it('マイルストーンが見つからない場合はnullを返すこと', async () => {
      mockLocal.getMilestone.mockResolvedValue(null);

      const result = await repository.getMilestoneById('non-existent');

      expect(result).toBeNull();
      expect(mockLocal.getMilestone).toHaveBeenCalledWith('non-existent');
    });

    it('取得失敗時に例外をスローすること', async () => {
      mockLocal.getMilestone.mockRejectedValue(new Error('DB error'));

      await expect(repository.getMilestoneById('milestone-1')).rejects.toThrow(
        'DB error'
      );
    });
  });

  describe('getGoalMilestones', () => {
    it('目標IDで全マイルストーンを取得できること', async () => {
      const milestones = [
        mockMilestone,
        { ...mockMilestone, id: 'milestone-2', station: 2 },
        { ...mockMilestone, id: 'milestone-3', station: 3 },
      ];
      mockLocal.getMilestones.mockResolvedValue(milestones);

      const result = await repository.getGoalMilestones('goal-1');

      expect(result).toEqual(milestones);
      expect(result).toHaveLength(3);
      expect(mockLocal.getMilestones).toHaveBeenCalledWith('goal-1');
    });

    it('マイルストーンがない場合は空配列を返すこと', async () => {
      mockLocal.getMilestones.mockResolvedValue([]);

      const result = await repository.getGoalMilestones('goal-1');

      expect(result).toEqual([]);
      expect(mockLocal.getMilestones).toHaveBeenCalledWith('goal-1');
    });

    it('取得失敗時に例外をスローすること', async () => {
      mockLocal.getMilestones.mockRejectedValue(new Error('Fetch error'));

      await expect(repository.getGoalMilestones('goal-1')).rejects.toThrow(
        'Fetch error'
      );
    });
  });

  describe('updateMilestone', () => {
    it('マイルストーンを更新できること', async () => {
      const updatedMilestone = { ...mockMilestone, title: '更新された第1合目' };
      mockLocal.updateMilestone.mockResolvedValue(undefined);

      const result = await repository.updateMilestone(updatedMilestone);

      expect(result.title).toBe('更新された第1合目');
      expect(mockLocal.updateMilestone).toHaveBeenCalledWith(
        expect.objectContaining({ title: '更新された第1合目' })
      );
    });

    it('更新時にupdatedAtが更新されること', async () => {
      const oldDate = new Date('2025-01-01');
      const milestoneToUpdate = { ...mockMilestone, updatedAt: oldDate };
      mockLocal.updateMilestone.mockResolvedValue(undefined);

      const before = Date.now();
      const result = await repository.updateMilestone(milestoneToUpdate);
      const after = Date.now();

      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after);
      expect(result.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('更新失敗時に例外をスローすること', async () => {
      mockLocal.updateMilestone.mockRejectedValue(new Error('Update failed'));

      await expect(repository.updateMilestone(mockMilestone)).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('deleteMilestone', () => {
    it('マイルストーンを削除できること', async () => {
      mockLocal.deleteMilestone.mockResolvedValue(undefined);

      await repository.deleteMilestone('milestone-1');

      expect(mockLocal.deleteMilestone).toHaveBeenCalledWith('milestone-1');
    });

    it('削除失敗時に例外をスローすること', async () => {
      mockLocal.deleteMilestone.mockRejectedValue(new Error('Delete failed'));

      await expect(repository.deleteMilestone('milestone-1')).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  describe('deleteGoalMilestones', () => {
    it('目標の全マイルストーンを削除できること', async () => {
      mockLocal.deleteGoalMilestones.mockResolvedValue(undefined);

      await repository.deleteGoalMilestones('goal-1');

      expect(mockLocal.deleteGoalMilestones).toHaveBeenCalledWith('goal-1');
    });

    it('一括削除失敗時に例外をスローすること', async () => {
      mockLocal.deleteGoalMilestones.mockRejectedValue(
        new Error('Batch delete failed')
      );

      await expect(repository.deleteGoalMilestones('goal-1')).rejects.toThrow(
        'Batch delete failed'
      );
    });
  });
});

/**
 * Milestone Repository Implementation
 * マイルストーンデータの永続化とMCP通信の実装
 */

import { Milestone, MilestoneStatus } from '@/core/domain/entities/Milestone';
import {
  MilestoneRepository,
  GenerateMilestonesDTO,
} from '@/core/domain/repositories/MilestoneRepository';
import { LocalDataSource } from '../datasources/LocalDataSource';
import { MCPClient } from '@/core/network/mcp/MCPClient';
import { MilestoneMapper } from '../models/MilestoneModel';

export class MilestoneRepositoryImpl implements MilestoneRepository {
  constructor(
    private localDataSource: LocalDataSource,
    private mcpClient: MCPClient
  ) {}

  /**
   * MCPを使用してマイルストーンを生成（10合目）
   */
  async generateMilestones(
    params: GenerateMilestonesDTO
  ): Promise<Milestone[]> {
    try {
      const response = await this.mcpClient.generateMilestones(
        params.goalId,
        params.goalText,
        params.difficulty,
        params.durationDays
      );

      // MCPレスポンスをMilestoneエンティティに変換
      const milestones: Milestone[] = response.map((item, index) => ({
        id: item.milestone_id,
        goalId: params.goalId,
        station: item.station_number,
        title: item.title,
        description: item.description,
        achievementCriteria: item.criteria,
        targetSteps: item.estimated_steps,
        status: MilestoneStatus.NOT_STARTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // ローカルに保存
      await this.localDataSource.saveMilestones(milestones);

      return milestones;
    } catch (error) {
      console.error('Failed to generate milestones:', error);
      throw error;
    }
  }

  /**
   * マイルストーンを作成（ローカル保存）
   */
  async createMilestone(milestone: Milestone): Promise<Milestone> {
    try {
      await this.localDataSource.saveMilestone(milestone);
      return milestone;
    } catch (error) {
      console.error('Failed to create milestone:', error);
      throw error;
    }
  }

  /**
   * 複数のマイルストーンを一括作成
   */
  async createMilestones(milestones: Milestone[]): Promise<Milestone[]> {
    try {
      await this.localDataSource.saveMilestones(milestones);
      return milestones;
    } catch (error) {
      console.error('Failed to create milestones:', error);
      throw error;
    }
  }

  /**
   * マイルストーンIDで取得
   */
  async getMilestoneById(id: string): Promise<Milestone | null> {
    try {
      return await this.localDataSource.getMilestone(id);
    } catch (error) {
      console.error('Failed to get milestone by id:', error);
      throw error;
    }
  }

  /**
   * 目標IDで全マイルストーンを取得
   */
  async getGoalMilestones(goalId: string): Promise<Milestone[]> {
    try {
      return await this.localDataSource.getMilestones(goalId);
    } catch (error) {
      console.error('Failed to get goal milestones:', error);
      throw error;
    }
  }

  /**
   * マイルストーンを更新
   */
  async updateMilestone(milestone: Milestone): Promise<Milestone> {
    try {
      milestone.updatedAt = new Date();
      await this.localDataSource.updateMilestone(milestone);
      return milestone;
    } catch (error) {
      console.error('Failed to update milestone:', error);
      throw error;
    }
  }

  /**
   * マイルストーンを削除
   */
  async deleteMilestone(id: string): Promise<void> {
    try {
      await this.localDataSource.deleteMilestone(id);
    } catch (error) {
      console.error('Failed to delete milestone:', error);
      throw error;
    }
  }

  /**
   * 目標の全マイルストーンを削除
   */
  async deleteGoalMilestones(goalId: string): Promise<void> {
    try {
      await this.localDataSource.deleteGoalMilestones(goalId);
    } catch (error) {
      console.error('Failed to delete goal milestones:', error);
      throw error;
    }
  }
}

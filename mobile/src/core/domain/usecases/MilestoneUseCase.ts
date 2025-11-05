/**
 * Milestone Use Case
 * マイルストーンに関するビジネスロジック
 */

import { Milestone } from '../entities/Milestone';
import {
  MilestoneRepository,
  GenerateMilestonesDTO,
} from '../repositories/MilestoneRepository';

export class MilestoneUseCase {
  constructor(private milestoneRepository: MilestoneRepository) {}

  /**
   * マイルストーンを生成（10合目）
   */
  async generateMilestones(
    params: GenerateMilestonesDTO
  ): Promise<Milestone[]> {
    // バリデーション
    if (!params.goalId) {
      throw new Error('Goal ID is required');
    }

    if (!params.goalText || params.goalText.trim().length === 0) {
      throw new Error('Goal text is required');
    }

    if (params.durationDays <= 0) {
      throw new Error('Duration must be positive');
    }

    const milestones = await this.milestoneRepository.generateMilestones(
      params
    );

    // 10合目であることを検証
    if (milestones.length !== 10) {
      throw new Error(
        `Expected 10 milestones, but got ${milestones.length}`
      );
    }

    return milestones;
  }

  /**
   * マイルストーンを作成
   */
  async createMilestone(milestone: Milestone): Promise<Milestone> {
    // バリデーション
    if (!milestone.goalId) {
      throw new Error('Goal ID is required');
    }

    if (milestone.station < 1 || milestone.station > 10) {
      throw new Error('Station must be between 1 and 10');
    }

    return this.milestoneRepository.createMilestone(milestone);
  }

  /**
   * 複数のマイルストーンを一括作成
   */
  async createMilestones(milestones: Milestone[]): Promise<Milestone[]> {
    if (!milestones || milestones.length === 0) {
      throw new Error('Milestones array is required');
    }

    return this.milestoneRepository.createMilestones(milestones);
  }

  /**
   * マイルストーンを取得
   */
  async getMilestone(id: string): Promise<Milestone | null> {
    if (!id) {
      throw new Error('Milestone ID is required');
    }

    return this.milestoneRepository.getMilestoneById(id);
  }

  /**
   * 目標の全マイルストーンを取得
   */
  async getGoalMilestones(goalId: string): Promise<Milestone[]> {
    if (!goalId) {
      throw new Error('Goal ID is required');
    }

    return this.milestoneRepository.getGoalMilestones(goalId);
  }

  /**
   * マイルストーンを更新
   */
  async updateMilestone(milestone: Milestone): Promise<Milestone> {
    if (!milestone.id) {
      throw new Error('Milestone ID is required');
    }

    return this.milestoneRepository.updateMilestone(milestone);
  }

  /**
   * マイルストーンを削除
   */
  async deleteMilestone(id: string): Promise<void> {
    if (!id) {
      throw new Error('Milestone ID is required');
    }

    return this.milestoneRepository.deleteMilestone(id);
  }

  /**
   * 目標の全マイルストーンを削除
   */
  async deleteGoalMilestones(goalId: string): Promise<void> {
    if (!goalId) {
      throw new Error('Goal ID is required');
    }

    return this.milestoneRepository.deleteGoalMilestones(goalId);
  }
}

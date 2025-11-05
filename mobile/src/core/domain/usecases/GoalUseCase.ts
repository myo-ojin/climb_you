/**
 * Goal Use Case
 * 目標に関するビジネスロジック
 */

import { Goal } from '../entities/Goal';
import {
  GoalRepository,
  GoalAnalysisResult,
  CreateGoalDTO,
} from '../repositories/GoalRepository';

export class GoalUseCase {
  constructor(private goalRepository: GoalRepository) {}

  /**
   * 目標を分析（SMART + WOOP）
   */
  async analyzeGoal(
    goalText: string,
    context?: string
  ): Promise<GoalAnalysisResult> {
    if (!goalText || goalText.trim().length === 0) {
      throw new Error('Goal text is required');
    }

    return this.goalRepository.analyzeGoal(goalText, context);
  }

  /**
   * 目標を作成
   */
  async createGoal(goalData: CreateGoalDTO): Promise<Goal> {
    // バリデーション
    if (!goalData.title || goalData.title.trim().length === 0) {
      throw new Error('Goal title is required');
    }

    if (!goalData.userId) {
      throw new Error('User ID is required');
    }

    return this.goalRepository.createGoal(goalData);
  }

  /**
   * 目標を取得
   */
  async getGoal(id: string): Promise<Goal | null> {
    if (!id) {
      throw new Error('Goal ID is required');
    }

    return this.goalRepository.getGoalById(id);
  }

  /**
   * ユーザーの目標を取得
   */
  async getUserGoal(userId: string): Promise<Goal | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return this.goalRepository.getUserGoal(userId);
  }

  /**
   * 目標を更新
   */
  async updateGoal(goal: Goal): Promise<Goal> {
    if (!goal.id) {
      throw new Error('Goal ID is required');
    }

    return this.goalRepository.updateGoal(goal);
  }

  /**
   * 目標を削除
   */
  async deleteGoal(id: string): Promise<void> {
    if (!id) {
      throw new Error('Goal ID is required');
    }

    return this.goalRepository.deleteGoal(id);
  }

  /**
   * ユーザーの全目標を取得
   */
  async getUserGoals(userId: string): Promise<Goal[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return this.goalRepository.getUserGoals(userId);
  }
}

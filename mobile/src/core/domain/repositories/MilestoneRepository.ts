/**
 * Milestone Repository Interface
 * マイルストーンデータの永続化とMCP通信を抽象化
 */

import { Milestone } from '../entities/Milestone';

export interface GenerateMilestonesDTO {
  goalId: string;
  goalText: string;
  difficulty: 'easy' | 'medium' | 'hard';
  durationDays: number;
}

/**
 * MilestoneRepository Interface
 * ドメイン層で定義し、データ層で実装する
 */
export interface MilestoneRepository {
  /**
   * MCPを使用してマイルストーンを生成（10合目）
   */
  generateMilestones(params: GenerateMilestonesDTO): Promise<Milestone[]>;

  /**
   * マイルストーンを作成（ローカル保存）
   */
  createMilestone(milestone: Milestone): Promise<Milestone>;

  /**
   * 複数のマイルストーンを一括作成
   */
  createMilestones(milestones: Milestone[]): Promise<Milestone[]>;

  /**
   * マイルストーンIDで取得
   */
  getMilestoneById(id: string): Promise<Milestone | null>;

  /**
   * 目標IDで全マイルストーンを取得
   */
  getGoalMilestones(goalId: string): Promise<Milestone[]>;

  /**
   * マイルストーンを更新
   */
  updateMilestone(milestone: Milestone): Promise<Milestone>;

  /**
   * マイルストーンを削除
   */
  deleteMilestone(id: string): Promise<void>;

  /**
   * 目標の全マイルストーンを削除
   */
  deleteGoalMilestones(goalId: string): Promise<void>;
}

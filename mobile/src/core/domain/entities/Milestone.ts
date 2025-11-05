/**
 * Milestone Entity
 * 山登りの各合目を表すエンティティ
 */

export enum MilestoneStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

// 後方互換性のため
export const StationStatus = MilestoneStatus;

export interface Milestone {
  id: string;
  goalId: string;
  station: number; // 1-10
  title: string;
  description?: string;
  estimatedDuration?: string; // 推定期間（例: "2週間"）
  achievementCriteria?: string; // 達成条件
  targetSteps?: number; // 到達に必要な歩数（オプション）
  completionCriteria?: string; // 完了基準（後方互換性）
  status: MilestoneStatus;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MilestoneAchievement {
  id: string;
  milestoneId: string;
  userId: string;
  evidence?: string;
  achievedAt: Date;
  createdAt: Date;
}

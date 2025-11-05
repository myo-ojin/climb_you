/**
 * Goal Entity
 * ユーザーの長期目標を表すエンティティ
 */

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  kpi: string; // Key Performance Indicator
  duration: string; // 目標達成の期間（例：3ヶ月）
  deadline?: Date;
  obstacles: string[]; // WOOP: Obstacles
  plans: string[]; // WOOP: Plan
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalAnalysis {
  goal: Goal;
  smartAnalysis: {
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
  };
  woopAnalysis: {
    wish: string;
    outcome: string;
    obstacle: string;
    plan: string;
  };
}

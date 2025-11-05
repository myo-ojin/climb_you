/**
 * Goal Repository Interface
 * 目標データの永続化とMCP通信を抽象化
 */

import { Goal } from '../entities/Goal';

export interface GoalAnalysisResult {
  isComplete: boolean;
  missingElements: string[];
  suggestions: string[];
  smartAnalysis?: {
    specific: boolean;
    measurable: boolean;
    achievable: boolean;
    relevant: boolean;
    timeBound: boolean;
  };
  woopAnalysis?: {
    wish: string;
    outcome: string;
    obstacles: string[];
    plan: string[];
  };
}

export interface CreateGoalDTO {
  userId: string;
  title: string;
  kpi: string;
  duration: string;
  deadline?: Date;
  obstacles: string[];
  plans: string[];
}

/**
 * GoalRepository Interface
 * ドメイン層で定義し、データ層で実装する
 */
export interface GoalRepository {
  /**
   * MCPを使用して目標を分析（SMART + WOOP）
   */
  analyzeGoal(goalText: string, context?: string): Promise<GoalAnalysisResult>;

  /**
   * 目標を作成（ローカル＋MCP同期）
   */
  createGoal(goal: CreateGoalDTO): Promise<Goal>;

  /**
   * 目標IDで取得
   */
  getGoalById(id: string): Promise<Goal | null>;

  /**
   * ユーザーIDで目標を取得
   */
  getUserGoal(userId: string): Promise<Goal | null>;

  /**
   * 目標を更新
   */
  updateGoal(goal: Goal): Promise<Goal>;

  /**
   * 目標を削除
   */
  deleteGoal(id: string): Promise<void>;

  /**
   * ユーザーの全目標を取得
   */
  getUserGoals(userId: string): Promise<Goal[]>;
}

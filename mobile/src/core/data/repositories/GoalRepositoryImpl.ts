/**
 * Goal Repository Implementation
 * 目標データの永続化とMCP通信の実装
 */

import { Goal, GoalStatus } from '@/core/domain/entities/Goal';
import {
  GoalRepository,
  GoalAnalysisResult,
  CreateGoalDTO,
} from '@/core/domain/repositories/GoalRepository';
import { LocalDataSource } from '../datasources/LocalDataSource';
import { MCPClient } from '@/core/network/mcp/MCPClient';
import { GoalMapper } from '../models/GoalModel';

export class GoalRepositoryImpl implements GoalRepository {
  constructor(
    private localDataSource: LocalDataSource,
    private mcpClient: MCPClient
  ) {}

  /**
   * MCPを使用して目標を分析（SMART + WOOP）
   */
  async analyzeGoal(
    goalText: string,
    context?: string
  ): Promise<GoalAnalysisResult> {
    try {
      const response = await this.mcpClient.analyzeGoal(goalText, context);

      // MCPレスポンスをGoalAnalysisResultに変換
      return {
        isComplete: true, // MCPが成功したら完了とみなす
        missingElements: [],
        suggestions: [],
        smartAnalysis: {
          specific: response.smart_analysis.specific.includes('Yes') || response.smart_analysis.specific.includes('はい'),
          measurable: response.smart_analysis.measurable.includes('Yes') || response.smart_analysis.measurable.includes('はい'),
          achievable: response.smart_analysis.achievable.includes('Yes') || response.smart_analysis.achievable.includes('はい'),
          relevant: response.smart_analysis.relevant.includes('Yes') || response.smart_analysis.relevant.includes('はい'),
          timeBound: response.smart_analysis.time_bound.includes('Yes') || response.smart_analysis.time_bound.includes('はい'),
        },
        woopAnalysis: {
          wish: response.woop_analysis.wish,
          outcome: response.woop_analysis.outcome,
          obstacles: [response.woop_analysis.obstacle], // 単数形を配列に変換
          plan: [response.woop_analysis.plan], // 単数形を配列に変換
        },
      };
    } catch (error) {
      console.error('Failed to analyze goal:', error);
      throw error;
    }
  }

  /**
   * 目標を作成（ローカル＋MCP同期）
   */
  async createGoal(goalData: CreateGoalDTO): Promise<Goal> {
    try {
      const now = new Date();
      const goal: Goal = {
        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: goalData.userId,
        title: goalData.title,
        kpi: goalData.kpi,
        duration: goalData.duration,
        deadline: goalData.deadline,
        obstacles: goalData.obstacles,
        plans: goalData.plans,
        status: GoalStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      };

      // ローカルに保存
      await this.localDataSource.saveGoal(goal);

      // TODO: MCPに同期（バックグラウンドで実行）
      // await this.mcpClient.createGoal(...)

      return goal;
    } catch (error) {
      console.error('Failed to create goal:', error);
      throw error;
    }
  }

  /**
   * 目標IDで取得
   */
  async getGoalById(id: string): Promise<Goal | null> {
    try {
      return await this.localDataSource.getGoalById(id);
    } catch (error) {
      console.error('Failed to get goal by id:', error);
      throw error;
    }
  }

  /**
   * ユーザーIDで目標を取得
   */
  async getUserGoal(userId: string): Promise<Goal | null> {
    try {
      return await this.localDataSource.getGoal(userId);
    } catch (error) {
      console.error('Failed to get user goal:', error);
      throw error;
    }
  }

  /**
   * 目標を更新
   */
  async updateGoal(goal: Goal): Promise<Goal> {
    try {
      goal.updatedAt = new Date();
      await this.localDataSource.updateGoal(goal);

      // TODO: MCPに同期（バックグラウンドで実行）

      return goal;
    } catch (error) {
      console.error('Failed to update goal:', error);
      throw error;
    }
  }

  /**
   * 目標を削除
   */
  async deleteGoal(id: string): Promise<void> {
    try {
      await this.localDataSource.deleteGoal(id);

      // TODO: MCPに同期（バックグラウンドで実行）
    } catch (error) {
      console.error('Failed to delete goal:', error);
      throw error;
    }
  }

  /**
   * ユーザーの全目標を取得
   */
  async getUserGoals(userId: string): Promise<Goal[]> {
    try {
      return await this.localDataSource.getUserGoals(userId);
    } catch (error) {
      console.error('Failed to get user goals:', error);
      throw error;
    }
  }
}

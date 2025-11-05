/**
 * Goal Management Service
 * 目標のCRUD操作とビジネスロジック管理
 */

import { MCPClient } from '@/core/network/mcp';
import { NetworkErrorHandler, RetryStrategy, ErrorRecoveryStrategy } from '@/core/network/utils';
import { AppError } from '@/core/network/interceptors';
import {
  GoalDetails,
  GoalListItem,
  GoalWithAnalysis,
  GoalStatistics,
  GoalValidationResult,
  GoalAnalysisResult,
  GoalCreationPayload,
  GoalUpdateRequest,
  GoalStatus,
} from '../types';

/**
 * GoalService: Manages all goal-related operations
 */
export class GoalService {
  private mcpClient: MCPClient;
  private errorHandler: NetworkErrorHandler;
  private retryStrategy: RetryStrategy;
  private cache: Map<string, GoalDetails> = new Map();
  private listCache: GoalListItem[] = [];
  private cacheTimestamp: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(
    mcpClient: MCPClient,
    errorHandler: NetworkErrorHandler,
    retryStrategy: RetryStrategy
  ) {
    this.mcpClient = mcpClient;
    this.errorHandler = errorHandler;
    this.retryStrategy = retryStrategy;
  }

  /**
   * Create a new goal
   */
  async createGoal(payload: GoalCreationPayload): Promise<GoalDetails> {
    try {
      // Validate input
      const validation = this.validateGoalPayload(payload);
      if (!validation.isValid) {
        throw new AppError(
          'VALIDATION_ERROR',
          `Goal validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Create goal via MCPClient
      const result = await this.retryStrategy.execute(async () => {
        return await this.mcpClient.createGoal(
          'user_123', // TODO: Get from auth context
          payload.title,
          payload.kpi,
          payload.duration,
          payload.deadline,
          payload.obstacles,
          payload.plans
        );
      });

      if (!result.success) {
        throw new AppError('GOAL_CREATION_FAILED', 'Failed to create goal');
      }

      // Clear cache
      this.invalidateCache();

      const newGoal: GoalDetails = {
        id: result.goalId,
        userId: 'user_123',
        title: payload.title,
        description: payload.description,
        kpi: payload.kpi,
        deadline: payload.deadline,
        duration: payload.duration,
        durationDays: this.parseDurationDays(payload.duration),
        status: 'active',
        priority: payload.priority || 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.cache.set(newGoal.id, newGoal);
      return newGoal;
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError('GOAL_CREATION_ERROR', 'Failed to create goal');

      const strategy = this.errorHandler.getRecoveryStrategy(appError);
      throw appError;
    }
  }

  /**
   * Fetch a goal by ID
   */
  async getGoal(goalId: string): Promise<GoalDetails> {
    try {
      // Check cache
      if (this.cache.has(goalId)) {
        return this.cache.get(goalId)!;
      }

      // Fetch from server
      const goal = await this.retryStrategy.execute(async () => {
        return await this.mcpClient.getGoal(goalId);
      });

      if (!goal) {
        throw new AppError('GOAL_NOT_FOUND', `Goal ${goalId} not found`);
      }

      this.cache.set(goalId, goal);
      return goal;
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError('GOAL_FETCH_ERROR', 'Failed to fetch goal');

      throw appError;
    }
  }

  /**
   * Fetch all goals for the current user
   */
  async listGoals(filterStatus?: GoalStatus): Promise<GoalListItem[]> {
    try {
      // Check cache
      if (this.isCacheValid() && !filterStatus) {
        return this.listCache;
      }

      // Fetch from server
      const goals = await this.retryStrategy.execute(async () => {
        return await this.mcpClient.getUserGoals('user_123');
      });

      const listItems: GoalListItem[] = goals
        .filter((goal) => !filterStatus || goal.status === filterStatus)
        .map((goal) => ({
          id: goal.id,
          title: goal.title,
          status: goal.status,
          priority: goal.priority,
          deadline: goal.deadline,
          durationDays: goal.durationDays,
          progress: 0, // TODO: Calculate from milestones
        }));

      if (!filterStatus) {
        this.listCache = listItems;
        this.cacheTimestamp = Date.now();
      }

      return listItems;
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError('GOALS_FETCH_ERROR', 'Failed to fetch goals');

      throw appError;
    }
  }

  /**
   * Update a goal
   */
  async updateGoal(
    goalId: string,
    update: GoalUpdateRequest
  ): Promise<GoalDetails> {
    try {
      // Validate update
      const validation = this.validateGoalUpdate(update);
      if (!validation.isValid) {
        throw new AppError(
          'VALIDATION_ERROR',
          `Goal update validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Update via MCPClient
      const result = await this.retryStrategy.execute(async () => {
        return await this.mcpClient.updateGoal(goalId, update);
      });

      if (!result.success) {
        throw new AppError('GOAL_UPDATE_FAILED', 'Failed to update goal');
      }

      // Update cache
      const cachedGoal = this.cache.get(goalId);
      if (cachedGoal) {
        const updatedGoal: GoalDetails = {
          ...cachedGoal,
          ...update,
          updatedAt: new Date().toISOString(),
        };
        this.cache.set(goalId, updatedGoal);
        this.invalidateListCache();
      }

      const updatedGoal = await this.getGoal(goalId);
      return updatedGoal;
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError('GOAL_UPDATE_ERROR', 'Failed to update goal');

      throw appError;
    }
  }

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string): Promise<void> {
    try {
      await this.retryStrategy.execute(async () => {
        return await this.mcpClient.deleteGoal(goalId);
      });

      // Update cache
      this.cache.delete(goalId);
      this.invalidateListCache();
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError('GOAL_DELETION_ERROR', 'Failed to delete goal');

      throw appError;
    }
  }

  /**
   * Analyze goal text for SMART criteria
   */
  async analyzeGoal(
    goalText: string,
    context?: string
  ): Promise<GoalAnalysisResult> {
    try {
      const result = await this.retryStrategy.execute(async () => {
        return await this.mcpClient.analyzeGoal(goalText, context);
      });

      return result;
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError('GOAL_ANALYSIS_ERROR', 'Failed to analyze goal');

      throw appError;
    }
  }

  /**
   * Complete a goal
   */
  async completeGoal(goalId: string): Promise<GoalDetails> {
    try {
      const update: GoalUpdateRequest = {
        status: 'completed',
      };

      const goal = await this.updateGoal(goalId, update);

      if (!goal.completedAt) {
        goal.completedAt = new Date().toISOString();
        this.cache.set(goalId, goal);
      }

      return goal;
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError('GOAL_COMPLETION_ERROR', 'Failed to complete goal');

      throw appError;
    }
  }

  /**
   * Pause a goal
   */
  async pauseGoal(goalId: string): Promise<GoalDetails> {
    return this.updateGoal(goalId, { status: 'paused' });
  }

  /**
   * Resume a paused goal
   */
  async resumeGoal(goalId: string): Promise<GoalDetails> {
    return this.updateGoal(goalId, { status: 'active' });
  }

  /**
   * Get goal statistics for dashboard
   */
  async getGoalStatistics(): Promise<GoalStatistics> {
    try {
      const goals = await this.listGoals();

      const stats: GoalStatistics = {
        totalGoals: goals.length,
        activeGoals: goals.filter((g) => g.status === 'active').length,
        completedGoals: goals.filter((g) => g.status === 'completed').length,
        averageProgress:
          goals.length > 0
            ? Math.round(
                goals.reduce((sum, g) => sum + g.progress, 0) / goals.length
              )
            : 0,
        completionRate:
          goals.length > 0
            ? Math.round(
                (goals.filter((g) => g.status === 'completed').length /
                  goals.length) *
                  100
              )
            : 0,
      };

      return stats;
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError('STATS_ERROR', 'Failed to fetch statistics');

      throw appError;
    }
  }

  /**
   * Validate goal creation payload
   */
  private validateGoalPayload(payload: GoalCreationPayload): GoalValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Title validation
    if (!payload.title || payload.title.trim().length === 0) {
      errors.push('Goal title is required');
    } else if (payload.title.length > 200) {
      errors.push('Goal title must be less than 200 characters');
    }

    // KPI validation
    if (!payload.kpi || payload.kpi.trim().length === 0) {
      errors.push('KPI is required');
    }

    // Duration validation
    if (!payload.duration || payload.duration.trim().length === 0) {
      errors.push('Duration is required');
    }

    // Deadline validation
    if (!payload.deadline) {
      errors.push('Deadline is required');
    } else {
      const deadlineDate = new Date(payload.deadline);
      const today = new Date();
      if (deadlineDate < today) {
        errors.push('Deadline must be in the future');
      }
    }

    // Obstacles and plans validation
    if (
      payload.obstacles.length === 0 ||
      payload.plans.length === 0
    ) {
      warnings.push(
        'Consider identifying obstacles and plans for better success'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Validate goal update request
   */
  private validateGoalUpdate(update: GoalUpdateRequest): GoalValidationResult {
    const errors: string[] = [];

    if (update.title !== undefined) {
      if (update.title.length === 0) {
        errors.push('Goal title cannot be empty');
      } else if (update.title.length > 200) {
        errors.push('Goal title must be less than 200 characters');
      }
    }

    if (update.deadline !== undefined) {
      const deadlineDate = new Date(update.deadline);
      const today = new Date();
      if (deadlineDate < today) {
        errors.push('Deadline must be in the future');
      }
    }

    if (update.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(update.priority)) {
        errors.push('Invalid priority value');
      }
    }

    if (update.status !== undefined) {
      const validStatuses = ['active', 'completed', 'paused', 'archived'];
      if (!validStatuses.includes(update.status)) {
        errors.push('Invalid status value');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      suggestions: [],
    };
  }

  /**
   * Parse duration string to days
   */
  private parseDurationDays(duration: string): number {
    const durationLower = duration.toLowerCase();

    if (durationLower.includes('month')) {
      const match = duration.match(/\d+/);
      if (match) {
        return parseInt(match[0]) * 30;
      }
      return 30;
    }

    if (durationLower.includes('week')) {
      const match = duration.match(/\d+/);
      if (match) {
        return parseInt(match[0]) * 7;
      }
      return 7;
    }

    if (durationLower.includes('year')) {
      const match = duration.match(/\d+/);
      if (match) {
        return parseInt(match[0]) * 365;
      }
      return 365;
    }

    if (durationLower.includes('day')) {
      const match = duration.match(/\d+/);
      if (match) {
        return parseInt(match[0]);
      }
      return 1;
    }

    return 90; // Default 90 days
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_DURATION;
  }

  /**
   * Invalidate all cache
   */
  private invalidateCache(): void {
    this.cache.clear();
    this.invalidateListCache();
  }

  /**
   * Invalidate list cache
   */
  private invalidateListCache(): void {
    this.listCache = [];
    this.cacheTimestamp = 0;
  }

  /**
   * Clear all cache (manual)
   */
  clearCache(): void {
    this.invalidateCache();
  }
}

export default GoalService;

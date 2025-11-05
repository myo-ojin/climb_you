/**
 * RemoteDataSource
 * リモートサーバーとのデータ通信を担当
 * 
 * 責務:
 * - MCP通信のラッパー
 * - データ同期API
 * - エンティティのCRUD操作
 * - クエストステータスの送信
 * - リモート変更の取得
 */

import { MCPClient } from '@/core/network/mcp/MCPClient';
import { NetworkError } from '@/core/network/mcp/types';
import {
  SyncResult,
  EntityType,
  SyncQueueItemType,
} from '@/core/domain/entities/SyncQueue';

/**
 * RemoteDataSource設定
 */
export interface RemoteDataSourceConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * RemoteDataSource クラス
 */
export class RemoteDataSource {
  private static instance: RemoteDataSource | null = null;
  private mcpClient: MCPClient;
  private isInitialized: boolean = false;

  private constructor(config: RemoteDataSourceConfig) {
    this.mcpClient = new MCPClient({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    });
  }

  /**
   * シングルトンインスタンス取得
   */
  static getInstance(config?: RemoteDataSourceConfig): RemoteDataSource {
    if (!RemoteDataSource.instance) {
      if (!config) {
        throw new Error('RemoteDataSource: config is required for first initialization');
      }
      RemoteDataSource.instance = new RemoteDataSource(config);
    }
    return RemoteDataSource.instance;
  }

  /**
   * 初期化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // ヘルスチェック
      await this.mcpClient.healthCheck();
      this.isInitialized = true;
      console.log('[RemoteDataSource] Initialized successfully');
    } catch (error) {
      console.error('[RemoteDataSource] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * MCP Tool呼び出し（汎用）
   */
  async callTool<T = any>(toolName: string, params: any): Promise<T> {
    try {
      // MCPClientのメソッドマッピング
      switch (toolName) {
        case 'analyze_goal':
          return await this.mcpClient.analyzeGoal(params.goalText, params.context) as T;
        
        case 'generate_milestones':
          return await this.mcpClient.generateMilestones(
            params.goalId,
            params.goal,
            params.difficultyLevel,
            params.durationDays
          ) as T;
        
        case 'get_quest_bundle':
          return await this.mcpClient.getQuestBundle(
            params.userId,
            params.currentMilestoneId,
            params.userProfile,
            params.lastDayLogs,
            params.successPatterns,
            params.failurePatterns
          ) as T;
        
        case 'complete_quest':
          return await this.mcpClient.completeQuest(
            params.userId,
            params.questId,
            params.status,
            params.options
          ) as T;
        
        case 'get_user_profile':
          return await this.mcpClient.getUserProfile(params.userId) as T;
        
        case 'update_user_profile':
          return await this.mcpClient.updateUserProfile(
            params.userId,
            params.profile
          ) as T;
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`[RemoteDataSource] Tool call failed: ${toolName}`, error);
      throw error;
    }
  }

  /**
   * エンティティの作成/更新（Upsert）
   */
  async upsertEntity(
    entityType: EntityType,
    entityId: string,
    data: Record<string, any>
  ): Promise<SyncResult> {
    try {
      console.log(`[RemoteDataSource] Upserting ${entityType}/${entityId}`);

      // エンティティタイプに応じたAPI呼び出し
      const endpoint = this.getEntityEndpoint(entityType);
      const method = data.id ? 'update' : 'create';

      // TODO: 実際のAPI実装に応じて調整
      // 現在はMCPClientを使用した実装例
      const result = await this.callEntityAPI(endpoint, method, entityId, data);

      return {
        success: true,
        itemId: entityId,
        syncedAt: new Date(),
      };
    } catch (error) {
      console.error(`[RemoteDataSource] Upsert failed: ${entityType}/${entityId}`, error);
      
      return {
        success: false,
        itemId: entityId,
        error: error instanceof Error ? error.message : 'Unknown error',
        conflicted: this.isConflictError(error),
      };
    }
  }

  /**
   * エンティティの削除
   */
  async deleteEntity(
    entityType: EntityType,
    entityId: string
  ): Promise<SyncResult> {
    try {
      console.log(`[RemoteDataSource] Deleting ${entityType}/${entityId}`);

      const endpoint = this.getEntityEndpoint(entityType);
      
      // TODO: 実際のAPI実装に応じて調整
      await this.callEntityAPI(endpoint, 'delete', entityId, {});

      return {
        success: true,
        itemId: entityId,
        syncedAt: new Date(),
      };
    } catch (error) {
      console.error(`[RemoteDataSource] Delete failed: ${entityType}/${entityId}`, error);
      
      return {
        success: false,
        itemId: entityId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * クエストステータスの送信
   */
  async submitQuestStatus(
    questId: string,
    operation: SyncQueueItemType,
    data: Record<string, any>
  ): Promise<SyncResult> {
    try {
      console.log(`[RemoteDataSource] Submitting quest status: ${questId} - ${operation}`);

      // 操作タイプに応じたステータスマッピング
      const status = this.mapOperationToStatus(operation);
      
      const result = await this.mcpClient.completeQuest(
        data.userId || data.user_id,
        questId,
        status,
        {
          actualMinutes: data.actualMinutes || data.actual_minutes,
          evidence: data.evidence,
          obstructionReason: data.obstructionReason || data.obstruction_reason,
          skipReason: data.skipReason || data.skip_reason,
        }
      );

      return {
        success: true,
        itemId: questId,
        syncedAt: new Date(),
      };
    } catch (error) {
      console.error(`[RemoteDataSource] Quest status submission failed: ${questId}`, error);
      
      return {
        success: false,
        itemId: questId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * リモート変更の取得（差分同期）
   */
  async getChangedData(since: Date | null): Promise<Record<string, any[]>> {
    try {
      console.log('[RemoteDataSource] Fetching changed data since:', since);

      // TODO: 実際のAPI実装に応じて調整
      // 現在はモック実装
      const changedData: Record<string, any[]> = {
        goals: [],
        milestones: [],
        quests: [],
        quest_logs: [],
        user_progress: [],
        streaks: [],
      };

      // 各エンティティタイプの変更を取得
      // 実際の実装では、since パラメータを使用してフィルタリング
      
      return changedData;
    } catch (error) {
      console.error('[RemoteDataSource] Failed to fetch changed data:', error);
      throw error;
    }
  }

  /**
   * エンティティタイプからエンドポイントを取得
   */
  private getEntityEndpoint(entityType: EntityType): string {
    const endpoints: Record<EntityType, string> = {
      goal: '/api/goals',
      milestone: '/api/milestones',
      quest: '/api/quests',
      quest_log: '/api/quest-logs',
      user_progress: '/api/user-progress',
      streak: '/api/streaks',
    };

    return endpoints[entityType];
  }

  /**
   * エンティティAPIを呼び出し
   */
  private async callEntityAPI(
    endpoint: string,
    method: 'create' | 'update' | 'delete',
    entityId: string,
    data: Record<string, any>
  ): Promise<any> {
    // TODO: 実際のREST API実装
    // 現在はモック実装
    console.log(`[RemoteDataSource] API Call: ${method} ${endpoint}/${entityId}`, data);
    
    // モック成功レスポンス
    return {
      id: entityId,
      ...data,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * 操作タイプをクエストステータスにマッピング
   */
  private mapOperationToStatus(
    operation: SyncQueueItemType
  ): 'completed' | 'skipped' | 'obstructed' {
    switch (operation) {
      case 'complete_quest':
        return 'completed';
      case 'skip_quest':
        return 'skipped';
      case 'obstruct_quest':
        return 'obstructed';
      default:
        return 'completed';
    }
  }

  /**
   * 競合エラーかどうかを判定
   */
  private isConflictError(error: any): boolean {
    if (error instanceof NetworkError) {
      return error.statusCode === 409;
    }
    return false;
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.mcpClient.clearCache();
  }

  /**
   * シングルトンリセット（テスト用）
   */
  static resetInstance(): void {
    RemoteDataSource.instance = null;
  }
}

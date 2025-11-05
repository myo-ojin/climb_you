/**
 * MCPClient
 * Model Context Protocol (MCP) サーバーとの通信を担当
 * 目標分析、マイルストーン生成、クエスト生成などのMCP呼び出しを実装
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { SecureTokenStore } from '@/services/auth';
import {
  MCPRequest,
  MCPResponse,
  MCPErrorResponse,
  MCPClientConfig,
  MCPCallOptions,
  NetworkError,
  NetworkErrorType,
  GoalAnalysisRequest,
  GoalAnalysisResponse,
  MilestoneGenerationRequest,
  MilestoneResponse,
  QuestGenerationRequest,
  QuestBundleResponse,
  QuestCompleteRequest,
  QuestCompleteResponse,
  UserProfileRequest,
  UserProfileResponse,
} from './types';

export class MCPClient {
  private axiosInstance: AxiosInstance;
  private config: MCPClientConfig;
  private requestId: number = 0;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: MCPClientConfig) {
    this.config = config;

    // Axios インスタンス初期化
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // リクエスト インターセプター
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // トークンをヘッダーに追加
        const token = await SecureTokenStore.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // レスポンス インターセプター
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        return this.handleResponseError(error);
      }
    );
  }

  /**
   * 内部的なリクエスト ID を生成
   */
  private generateRequestId(): string {
    return `${Date.now()}-${++this.requestId}`;
  }

  /**
   * キャッシュキーを生成
   */
  private generateCacheKey(method: string, params: any): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  /**
   * キャッシュから取得
   */
  private getFromCache(key: string, duration: number): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > duration) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * キャッシュに保存
   */
  private saveToCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * レスポンスエラーを処理
   */
  private handleResponseError(error: AxiosError): Promise<never> {
    const errorType = this.getErrorType(error.response?.status);
    const statusCode = error.response?.status || 0;
    const errorData = (error.response?.data as any) || {};

    const message = errorData.message || error.message || 'Unknown error occurred';

    console.error(`[MCP Error] ${errorType}: ${message}`, errorData);

    return Promise.reject(
      new NetworkError(errorType, message, statusCode, errorData)
    );
  }

  /**
   * HTTP ステータスコードからエラータイプを判定
   */
  private getErrorType(status?: number): NetworkErrorType {
    if (!status) return 'NETWORK_ERROR';
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status >= 500) return 'SERVER_ERROR';
    return 'UNKNOWN_ERROR';
  }

  /**
   * MCP リクエストを実行（内部メソッド）
   */
  private async executeRequest<T>(
    method: string,
    params: any,
    options: MCPCallOptions = {}
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(method, params);
    const cacheDuration = options.cacheDuration || 5 * 60 * 1000; // デフォルト5分

    // キャッシュを確認
    if (options.cache !== false) {
      const cached = this.getFromCache(cacheKey, cacheDuration);
      if (cached !== null) {
        console.log(`[MCP Cache Hit] ${method}`);
        return cached;
      }
    }

    const requestId = this.generateRequestId();
    const timeout = options.timeout || this.config.timeout;
    const retries = options.retries !== undefined ? options.retries : this.config.retryAttempts;

    let lastError: NetworkError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(
          `[MCP Request] ${method} (Attempt ${attempt + 1}/${retries + 1})`,
          params
        );

        const request: MCPRequest = {
          jsonrpc: '2.0',
          method,
          params,
          id: requestId,
        };

        const response = await this.axiosInstance.post<MCPResponse<T>>(
          '/rpc',
          request,
          { timeout }
        );

        if (response.data.error) {
          const errorData = response.data.error as any;
          throw new NetworkError(
            'SERVER_ERROR',
            errorData.message || 'MCP error',
            undefined,
            errorData
          );
        }

        const result = response.data.result;
        console.log(`[MCP Response] ${method}`, result);

        // キャッシュに保存
        if (options.cache !== false) {
          this.saveToCache(cacheKey, result);
        }

        return result;
      } catch (error) {
        lastError = error instanceof NetworkError
          ? error
          : new NetworkError(
              'NETWORK_ERROR',
              error instanceof Error ? error.message : 'Unknown error',
              undefined,
              error
            );

        if (attempt < retries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt); // エクスポーネンシャルバックオフ
          console.warn(
            `[MCP Retry] ${method} waiting ${delay}ms before retry`,
            lastError.message
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new NetworkError('UNKNOWN_ERROR', 'Request failed');
  }

  /**
   * 目標を分析（SMART + WOOP）
   */
  async analyzeGoal(
    goal: string,
    context?: string,
    options?: MCPCallOptions
  ): Promise<GoalAnalysisResponse> {
    return this.executeRequest<GoalAnalysisResponse>(
      'goal.analyze',
      { goal, context } as GoalAnalysisRequest,
      { cache: true, cacheDuration: 24 * 60 * 60 * 1000, ...options } // 24時間キャッシュ
    );
  }

  /**
   * 目標を作成
   */
  async createGoal(
    userId: string,
    goal: string,
    analysis: GoalAnalysisResponse,
    options?: MCPCallOptions
  ): Promise<{ goal_id: string; created_at: string }> {
    return this.executeRequest(
      'goal.create',
      {
        user_id: userId,
        goal,
        smart_analysis: analysis.smart_analysis,
        woop_analysis: analysis.woop_analysis,
        difficulty_level: analysis.difficulty_level,
        estimated_duration_days: analysis.estimated_duration_days,
      },
      { cache: false, ...options }
    );
  }

  /**
   * マイルストーンを生成（10合目）
   */
  async generateMilestones(
    goalId: string,
    goal: string,
    difficultyLevel: 'easy' | 'medium' | 'hard',
    durationDays: number,
    options?: MCPCallOptions
  ): Promise<MilestoneResponse[]> {
    return this.executeRequest<MilestoneResponse[]>(
      'milestone.generate',
      {
        goal_id: goalId,
        goal,
        difficulty_level: difficultyLevel,
        duration_days: durationDays,
      } as MilestoneGenerationRequest,
      { cache: false, ...options }
    );
  }

  /**
   * 今日のクエストバンドルを取得
   */
  async getQuestBundle(
    userId: string,
    currentMilestoneId: string,
    userProfile: {
      commit_time: string;
      available_minutes_per_day: number;
      difficulty_preference: 'easy' | 'medium' | 'hard';
      quest_type_preference: string[];
    },
    lastDayLogs?: any[],
    successPatterns?: any[],
    failurePatterns?: any[],
    options?: MCPCallOptions
  ): Promise<QuestBundleResponse> {
    return this.executeRequest<QuestBundleResponse>(
      'quest.generate',
      {
        user_id: userId,
        current_milestone_id: currentMilestoneId,
        user_profile: userProfile,
        last_day_logs: lastDayLogs,
        success_patterns: successPatterns,
        failure_patterns: failurePatterns,
      } as QuestGenerationRequest,
      { cache: true, cacheDuration: 60 * 1000, ...options } // 1分キャッシュ
    );
  }

  /**
   * クエスト完了を記録
   */
  async completeQuest(
    userId: string,
    questId: string,
    status: 'completed' | 'skipped' | 'obstructed',
    options?: {
      actualMinutes?: number;
      evidence?: { type: 'text' | 'image'; content: string };
      obstructionReason?: string;
      skipReason?: string;
      mcpOptions?: MCPCallOptions;
    }
  ): Promise<QuestCompleteResponse> {
    return this.executeRequest<QuestCompleteResponse>(
      'quest.complete',
      {
        user_id: userId,
        quest_id: questId,
        status,
        actual_minutes: options?.actualMinutes,
        evidence: options?.evidence,
        obstruction_reason: options?.obstructionReason,
        skip_reason: options?.skipReason,
      } as QuestCompleteRequest,
      { cache: false, ...options?.mcpOptions }
    );
  }

  /**
   * ユーザープロファイルを取得
   */
  async getUserProfile(userId: string, options?: MCPCallOptions): Promise<UserProfileResponse> {
    return this.executeRequest<UserProfileResponse>(
      'user.getProfile',
      { user_id: userId },
      { cache: true, cacheDuration: 60 * 60 * 1000, ...options } // 1時間キャッシュ
    );
  }

  /**
   * ユーザープロファイルを更新
   */
  async updateUserProfile(
    userId: string,
    profile: Omit<UserProfileRequest, 'user_id'>,
    options?: MCPCallOptions
  ): Promise<UserProfileResponse> {
    // キャッシュをクリア
    this.cache.clear();

    return this.executeRequest<UserProfileResponse>(
      'user.updateProfile',
      { user_id: userId, ...profile },
      { cache: false, ...options }
    );
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[MCP] Cache cleared');
  }

  /**
   * 特定のキャッシュキーをクリア
   */
  clearCacheByMethod(method: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      key.startsWith(`${method}:`)
    );
    keysToDelete.forEach((key) => this.cache.delete(key));
    console.log(`[MCP] Cache cleared for method: ${method}`);
  }

  /**
   * ヘルスチェック
   */
  async healthCheck(options?: MCPCallOptions): Promise<{ status: string; version: string }> {
    return this.executeRequest(
      'system.health',
      {},
      { cache: false, timeout: 5000, ...options }
    );
  }
}

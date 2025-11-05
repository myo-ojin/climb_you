/**
 * MCP (Model Context Protocol) Types
 * MCPサーバーとの通信で使用される型定義
 */

/**
 * MCPリクエスト基本形式
 */
export interface MCPRequest<T = any> {
  jsonrpc: '2.0';
  method: string;
  params: T;
  id: string | number;
}

/**
 * MCPレスポンス基本形式（成功）
 */
export interface MCPResponse<T = any> {
  jsonrpc: '2.0';
  result: T;
  id: string | number;
}

/**
 * MCPエラーレスポンス
 */
export interface MCPErrorResponse {
  jsonrpc: '2.0';
  error: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number;
}

/**
 * MCPクライアント設定
 */
export interface MCPClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * MCP呼び出しオプション
 */
export interface MCPCallOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheDuration?: number;
}

/**
 * MCP ツール定義
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * MCP ツール呼び出しリクエスト
 */
export interface MCPToolCallRequest<T = any> {
  name: string;
  arguments: T;
}

/**
 * MCP ツール呼び出しレスポンス
 */
export interface MCPToolCallResponse<T = any> {
  content: {
    type: 'text' | 'json';
    text?: string;
    json?: T;
  }[];
  isError?: boolean;
}

/**
 * API エラーレスポンス
 */
export interface APIErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp?: number;
}

/**
 * ネットワークエラーの種類
 */
export type NetworkErrorType =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * カスタムネットワークエラー
 */
export class NetworkError extends Error {
  constructor(
    public code: NetworkErrorType,
    public message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * MCP Goal Analysis リクエスト
 */
export interface GoalAnalysisRequest {
  goal: string;
  context?: string;
}

/**
 * MCP Goal Analysis レスポンス
 */
export interface GoalAnalysisResponse {
  goal_id: string;
  smart_analysis: {
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    time_bound: string;
  };
  woop_analysis: {
    wish: string;
    outcome: string;
    obstacle: string;
    plan: string;
  };
  difficulty_level: 'easy' | 'medium' | 'hard';
  estimated_duration_days: number;
}

/**
 * MCP Milestone Generation リクエスト
 */
export interface MilestoneGenerationRequest {
  goal_id: string;
  goal: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  duration_days: number;
}

/**
 * MCP Milestone レスポンス
 */
export interface MilestoneResponse {
  milestone_id: string;
  station_number: number; // 1-10
  title: string;
  description: string;
  criteria: string;
  estimated_steps: number;
  target_date?: string;
}

/**
 * MCP Quest Generation リクエスト
 */
export interface QuestGenerationRequest {
  user_id: string;
  current_milestone_id: string;
  user_profile: {
    commit_time: string; // 'morning' | 'afternoon' | 'evening'
    available_minutes_per_day: number;
    difficulty_preference: 'easy' | 'medium' | 'hard';
    quest_type_preference: string[];
  };
  last_day_logs?: any[];
  success_patterns?: any[];
  failure_patterns?: any[];
}

/**
 * MCP Quest レスポンス
 */
export interface QuestResponse {
  quest_id: string;
  title: string;
  description: string;
  type: 'small' | 'medium' | 'validation';
  estimated_minutes: number;
  completion_criteria: string;
  evidence_type: 'text' | 'image' | 'none';
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * MCP Quest Bundle レスポンス（3つのクエスト）
 */
export interface QuestBundleResponse {
  bundle_id: string;
  date: string;
  quests: QuestResponse[];
  expires_at: string;
}

/**
 * MCP Quest Complete リクエスト
 */
export interface QuestCompleteRequest {
  user_id: string;
  quest_id: string;
  status: 'completed' | 'skipped' | 'obstructed';
  actual_minutes?: number;
  evidence?: {
    type: 'text' | 'image';
    content: string; // base64 for images
  };
  obstruction_reason?: string;
  skip_reason?: string;
}

/**
 * MCP Quest Complete レスポンス
 */
export interface QuestCompleteResponse {
  log_id: string;
  status: 'completed' | 'skipped' | 'obstructed';
  steps_earned: number;
  streak_updated: boolean;
  current_streak: number;
}

/**
 * MCP User Profile リクエスト
 */
export interface UserProfileRequest {
  user_id: string;
  commit_time: string;
  available_minutes_per_day: number;
  difficulty_preference: 'easy' | 'medium' | 'hard';
  quest_type_preference: string[];
  timezone?: string;
  language?: string;
}

/**
 * MCP User Profile レスポンス
 */
export interface UserProfileResponse {
  user_id: string;
  profile_id: string;
  commit_time: string;
  available_minutes_per_day: number;
  difficulty_preference: 'easy' | 'medium' | 'hard';
  quest_type_preference: string[];
  created_at: string;
  updated_at: string;
}

/**
 * User & UserProgress Entities
 * ユーザー情報と進捗を表すエンティティ
 */

export interface User {
  id: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  authProviderId?: string; // OAuth provider ID
  authProviderType?: 'apple' | 'google' | 'oauth'; // 認証プロバイダー種別
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProgress {
  userId: string;
  totalSteps: number; // 累計歩数
  currentStreak: number; // 現在のストリーク（連続日数）
  maxStreak: number; // 最大ストリーク
  freezeDaysRemaining: number; // 残り休息日数（1週間に1回）
  lastActivityDate: Date; // 最後のアクティビティ日時
  currentStation: number; // 現在の合目（1-10）
  stepsForCurrentStation: number; // 現在の合目の獲得歩数
  updatedAt: Date;
  isSynced: boolean; // サーバーと同期済みか
}

export interface UserProfile {
  userId: string;
  commitTime: number; // 1日の確保時間（分）
  lifestyle: 'morning' | 'daytime' | 'evening' | 'night'; // ライフスタイル
  workEnvironment: 'office' | 'remote' | 'hybrid'; // 作業環境
  focusTime: number; // 集中力が続く時間（分）
  difficultyPreference: 'easy' | 'medium' | 'challenging'; // 難易度の好み
  timezone: string; // タイムゾーン（Asia/Tokyo など）
  createdAt: Date;
  updatedAt: Date;
}

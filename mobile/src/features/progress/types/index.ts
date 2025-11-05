/**
 * Progress Feature Types
 * 進捗画面の型定義
 */

/**
 * 合目の状態
 */
export enum StationStatus {
  NOT_REACHED = 'not_reached',     // 未到達
  REACHED = 'reached',             // 到達済み（未達成）
  ACHIEVED = 'achieved',           // 達成済み
}

/**
 * 合目データ
 */
export interface Station {
  /**
   * 合目番号（1-10）
   */
  stationNumber: number;

  /**
   * 合目タイトル
   */
  title: string;

  /**
   * 達成条件
   */
  criteria: string;

  /**
   * 必要累計歩数
   */
  requiredSteps: number;

  /**
   * 状態
   */
  status: StationStatus;

  /**
   * 進捗率（0-100）
   */
  progressRate: number;

  /**
   * 達成日時（達成済みの場合）
   */
  achievedAt?: Date;

  /**
   * 証跡（達成済みの場合）
   */
  evidence?: {
    type: 'image' | 'memo' | 'file';
    url?: string;
    text?: string;
  };
}

/**
 * 進捗データ
 */
export interface ProgressData {
  /**
   * ユーザーID
   */
  userId: string;

  /**
   * 累計歩数
   */
  totalSteps: number;

  /**
   * 現在の合目番号
   */
  currentStation: number;

  /**
   * 全体進捗率（0-100）
   */
  overallProgress: number;

  /**
   * 全10合目のデータ
   */
  stations: Station[];

  /**
   * 現在のストリーク
   */
  currentStreak: number;

  /**
   * 最大ストリーク
   */
  maxStreak: number;

  /**
   * 目標タイトル
   */
  goalTitle: string;

  /**
   * 目標期限
   */
  goalDeadline: Date;
}

/**
 * 次の合目情報
 */
export interface NextStationInfo {
  /**
   * 次の合目番号
   */
  stationNumber: number;

  /**
   * 次の合目タイトル
   */
  title: string;

  /**
   * 必要歩数
   */
  requiredSteps: number;

  /**
   * 残り歩数
   */
  remainingSteps: number;

  /**
   * 進捗率（0-100）
   */
  progressRate: number;
}

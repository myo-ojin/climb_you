/**
 * QuestRepository Interface
 * クエスト関連のデータ操作インターフェース
 */

import { Quest, QuestLog } from '../entities/Quest';

/**
 * クエスト調整パラメータ
 */
export interface QuestAdjustments {
  difficulty?: 'easy' | 'medium' | 'challenging';
  preferredTypes?: Array<'small' | 'medium' | 'validation'>;
  timeAvailable?: number; // 分単位
}

/**
 * クエスト完了パラメータ
 */
export interface CompleteQuestParams {
  questId: string;
  status: 'completed' | 'skipped' | 'obstructed';
  actualTime?: number;
  skipReason?: string;
  skipMemo?: string;
  obstacle?: string;
  obstacleDetails?: string;
  contingencyPlan?: string;
  evidenceUrl?: string;
  evidenceNote?: string;
  memo?: string;
}

/**
 * クエスト完了結果
 */
export interface QuestLogResult {
  questLog: QuestLog;
  stepsEarned: number;
  streakUpdated: boolean;
  achievements?: string[]; // 新しいアチーブメント
}

/**
 * QuestRepository インターフェース
 * クエスト取得・生成・記録の責務を定義
 */
export interface QuestRepository {
  /**
   * 今日のクエストを取得
   * @returns Promise<Quest[]> 今日のクエスト（3つ）
   */
  getTodayQuests(): Promise<Quest[]>;

  /**
   * クエストを生成（調整可能）
   * @param adjustments クエスト生成調整パラメータ
   * @returns Promise<Quest[]> 生成されたクエスト
   */
  generateQuests(adjustments?: QuestAdjustments): Promise<Quest[]>;

  /**
   * クエストを完了記録
   * @param params クエスト完了パラメータ
   * @returns Promise<QuestLogResult> 完了結果
   */
  completeQuest(params: CompleteQuestParams): Promise<QuestLogResult>;

  /**
   * クエストをID指定で取得
   * @param questId クエストID
   * @returns Promise<Quest | null> クエスト情報、見つからない場合は null
   */
  getQuestById(questId: string): Promise<Quest | null>;

  /**
   * クエストバンドルをID指定で取得
   * @param questBundleId クエストバンドルID
   * @returns Promise<Quest[]> クエスト配列
   */
  getQuestsByBundleId(questBundleId: string): Promise<Quest[]>;
}

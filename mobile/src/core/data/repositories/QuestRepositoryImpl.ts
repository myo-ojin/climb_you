/**
 * QuestRepositoryImpl
 * QuestRepository インターフェース の実装
 * リモートとローカルのデータソースを統合
 */

import type { Quest, QuestLog } from '@/core/domain/entities/Quest';
import type {
  QuestRepository,
  QuestAdjustments,
  CompleteQuestParams,
  QuestLogResult,
} from '@/core/domain/repositories/QuestRepository';
import type { MCPClient } from '@/core/network/mcp';
import type { LocalDataSource } from '../datasources/LocalDataSource';
import { AppError } from '@/core/network/interceptors';

/**
 * QuestRepositoryImpl
 * クエスト取得・生成・記録を実装
 * オフライン対応とキャッシング機能を提供
 */
export class QuestRepositoryImpl implements QuestRepository {
  constructor(
    private localDataSource: LocalDataSource,
    private mcpClient: MCPClient
  ) {}

  /**
   * 今日のクエストを取得
   * 1. ローカルキャッシュから取得を試みる
   * 2. ネットワーク失敗時はローカルデータを返す
   * 3. 成功時はローカルに保存
   *
   * @returns Promise<Quest[]> 今日のクエスト配列
   */
  async getTodayQuests(): Promise<Quest[]> {
    console.log('[QuestRepositoryImpl] Getting today quests...');

    try {
      // 1. ローカルキャッシュから取得
      const cachedQuests = await this.localDataSource.getTodayQuests();

      if (cachedQuests && cachedQuests.length > 0) {
        console.log(
          `[QuestRepositoryImpl] Found ${cachedQuests.length} cached quests`
        );

        // キャッシュが有効期限内かチェック
        const now = new Date();
        if (cachedQuests[0].validUntil > now) {
          console.log('[QuestRepositoryImpl] Cache is valid, returning cached quests');
          return cachedQuests;
        }

        console.log('[QuestRepositoryImpl] Cache expired, fetching from server');
      }

      // 2. ネットワークからクエストを取得
      console.log('[QuestRepositoryImpl] Fetching quests from MCP server...');

      // 今日の日付で getQuestBundle を呼び出し
      const today = new Date().toISOString().split('T')[0];
      const bundleResponse = await this.mcpClient.getQuestBundle({
        date: today,
      });

      if (!bundleResponse || !bundleResponse.quests || bundleResponse.quests.length === 0) {
        console.warn('[QuestRepositoryImpl] No quests returned from server');

        // サーバーからのデータがない場合、ローカルキャッシュを返す
        if (cachedQuests && cachedQuests.length > 0) {
          console.log('[QuestRepositoryImpl] Returning fallback cached quests');
          return cachedQuests;
        }

        return [];
      }

      const quests = bundleResponse.quests as Quest[];

      // 3. ローカルに保存
      console.log(
        `[QuestRepositoryImpl] Saving ${quests.length} quests to local storage`
      );
      await this.localDataSource.saveQuests(quests);

      console.log('[QuestRepositoryImpl] Successfully fetched and cached quests');

      return quests;
    } catch (error) {
      console.error('[QuestRepositoryImpl] Error fetching quests:', error);

      // ネットワークエラー時はローカルキャッシュを返す
      try {
        const fallbackQuests = await this.localDataSource.getTodayQuests();

        if (fallbackQuests && fallbackQuests.length > 0) {
          console.log(
            '[QuestRepositoryImpl] Returning fallback quests due to network error'
          );
          return fallbackQuests;
        }
      } catch (fallbackError) {
        console.error('[QuestRepositoryImpl] Error getting fallback quests:', fallbackError);
      }

      // ローカルキャッシュもない場合はエラーを投げる
      const appError = error instanceof AppError
        ? error
        : new AppError(
            'QUEST_FETCH_ERROR',
            'Failed to fetch quests. Please check your connection.'
          );

      throw appError;
    }
  }

  /**
   * クエストを生成（調整可能）
   * LLMベースのクエスト生成を呼び出し、結果をローカルに保存
   *
   * @param adjustments クエスト生成調整パラメータ
   * @returns Promise<Quest[]> 生成されたクエスト配列
   */
  async generateQuests(adjustments?: QuestAdjustments): Promise<Quest[]> {
    console.log('[QuestRepositoryImpl] Generating quests with adjustments:', adjustments);

    try {
      // MCP サーバーに生成リクエストを送信
      const response = await this.mcpClient.getQuestBundle({
        date: new Date().toISOString().split('T')[0],
        // 調整パラメータをリクエストに含める
        difficulty: adjustments?.difficulty,
        preferredTypes: adjustments?.preferredTypes,
        timeAvailable: adjustments?.timeAvailable,
      });

      if (!response || !response.quests) {
        throw new AppError('QUEST_GENERATION_ERROR', 'Failed to generate quests');
      }

      const quests = response.quests as Quest[];

      // ローカルに保存
      console.log('[QuestRepositoryImpl] Saving generated quests to local storage');
      await this.localDataSource.saveQuests(quests);

      console.log(`[QuestRepositoryImpl] Successfully generated ${quests.length} quests`);

      return quests;
    } catch (error) {
      console.error('[QuestRepositoryImpl] Error generating quests:', error);

      const appError = error instanceof AppError
        ? error
        : new AppError(
            'QUEST_GENERATION_ERROR',
            'Failed to generate quests'
          );

      throw appError;
    }
  }

  /**
   * クエストを完了記録
   * ローカルに QuestLog を記録し、非同期でサーバーに送信
   *
   * @param params クエスト完了パラメータ
   * @returns Promise<QuestLogResult> 完了結果
   */
  async completeQuest(params: CompleteQuestParams): Promise<QuestLogResult> {
    console.log('[QuestRepositoryImpl] Completing quest:', params.questId);

    try {
      // クエスト情報を取得して、步数を計算
      const quest = await this.getQuestById(params.questId);

      if (!quest) {
        throw new AppError('QUEST_NOT_FOUND', `Quest not found: ${params.questId}`);
      }

      // 步数を計算（クエストタイプと難易度に基づく）
      const stepsEarned = this.calculateSteps(quest, params);

      // QuestLog を作成
      const questLog: QuestLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        questId: params.questId,
        userId: '', // TODO: ユーザーIDを取得
        status: params.status,
        actualTime: params.actualTime,
        skipReason: params.skipReason,
        skipMemo: params.skipMemo,
        obstacle: params.obstacle,
        obstacleDetails: params.obstacleDetails,
        contingencyPlan: params.contingencyPlan,
        evidenceType: quest.evidenceType,
        evidenceUrl: params.evidenceUrl,
        evidenceNote: params.evidenceNote,
        memo: params.memo,
        stepsEarned,
        completedAt: params.status === 'completed' ? new Date() : undefined,
        createdAt: new Date(),
        isSynced: false, // ローカルに記録のみ、後で同期予定
      };

      // ローカルに保存
      console.log('[QuestRepositoryImpl] Saving quest log to local storage');
      await this.localDataSource.saveQuestLog(questLog);

      // 非同期でサーバーに送信（待たない）
      this.syncCompleteQuestAsync(params, questLog).catch((error) => {
        console.error('[QuestRepositoryImpl] Error syncing quest completion:', error);
      });

      console.log(
        `[QuestRepositoryImpl] Quest completed, earned ${stepsEarned} steps`
      );

      return {
        questLog,
        stepsEarned,
        streakUpdated: params.status === 'completed', // 完了時のみストリーク更新
        achievements: [], // TODO: アチーブメント判定
      };
    } catch (error) {
      console.error('[QuestRepositoryImpl] Error completing quest:', error);

      const appError = error instanceof AppError
        ? error
        : new AppError(
            'QUEST_COMPLETE_ERROR',
            'Failed to complete quest'
          );

      throw appError;
    }
  }

  /**
   * クエストをID指定で取得
   *
   * @param questId クエストID
   * @returns Promise<Quest | null> クエスト情報
   */
  async getQuestById(questId: string): Promise<Quest | null> {
    console.log('[QuestRepositoryImpl] Getting quest by ID:', questId);

    try {
      const quest = await this.localDataSource.getQuest(questId);

      if (!quest) {
        console.warn('[QuestRepositoryImpl] Quest not found in local storage:', questId);
        return null;
      }

      console.log('[QuestRepositoryImpl] Found quest:', quest.title);

      return quest;
    } catch (error) {
      console.error('[QuestRepositoryImpl] Error getting quest:', error);
      return null;
    }
  }

  /**
   * クエストバンドルで複数クエストを取得
   *
   * @param questBundleId クエストバンドルID
   * @returns Promise<Quest[]> クエスト配列
   */
  async getQuestsByBundleId(questBundleId: string): Promise<Quest[]> {
    console.log('[QuestRepositoryImpl] Getting quests by bundle ID:', questBundleId);

    try {
      // TODO: LocalDataSource に questBundleId で検索するメソッドを追加
      // 今のところは今日のクエストを返す
      const quests = await this.getTodayQuests();

      return quests.filter((q) => q.questBundleId === questBundleId);
    } catch (error) {
      console.error('[QuestRepositoryImpl] Error getting quests by bundle:', error);
      return [];
    }
  }

  /**
   * 步数を計算
   * クエストタイプと難易度に基づいて步数を決定
   *
   * @param quest クエスト
   * @param params 完了パラメータ
   * @returns number 獲得步数
   */
  private calculateSteps(quest: Quest, params: CompleteQuestParams): number {
    if (params.status !== 'completed') {
      return 0; // 完了時のみ步数を獲得
    }

    let baseSteps = 0;

    // クエストタイプによる基本步数
    switch (quest.type) {
      case 'small':
        baseSteps = 50;
        break;
      case 'medium':
        baseSteps = 100;
        break;
      case 'validation':
        baseSteps = 30;
        break;
      default:
        baseSteps = 50;
    }

    // 難易度によるボーナス
    switch (quest.difficulty) {
      case 'easy':
        // ボーナスなし
        break;
      case 'medium':
        baseSteps = Math.floor(baseSteps * 1.2); // 20% ボーナス
        break;
      case 'challenging':
        baseSteps = Math.floor(baseSteps * 1.5); // 50% ボーナス
        break;
    }

    // 完了ボーナス（すべてのクエスト完了時）
    // TODO: 実装予定

    return baseSteps;
  }

  /**
   * 非同期でサーバーに完了を同期
   * エラーが発生しても無視する（ローカルには既に記録済み）
   *
   * @param params 完了パラメータ
   * @param questLog QuestLog
   */
  private async syncCompleteQuestAsync(
    params: CompleteQuestParams,
    questLog: QuestLog
  ): Promise<void> {
    try {
      console.log('[QuestRepositoryImpl] Syncing quest completion to server...');

      await this.mcpClient.completeQuest({
        questId: params.questId,
        status: params.status,
        actualTime: params.actualTime,
        skipReason: params.skipReason,
        skipMemo: params.skipMemo,
        obstacle: params.obstacle,
        obstacleDetails: params.obstacleDetails,
        contingencyPlan: params.contingencyPlan,
        evidenceUrl: params.evidenceUrl,
        evidenceNote: params.evidenceNote,
        memo: params.memo,
      });

      // 同期成功、isSynced を更新
      // TODO: LocalDataSource の updateQuestLog メソッドを実装

      console.log('[QuestRepositoryImpl] Quest completion synced to server');
    } catch (error) {
      console.error('[QuestRepositoryImpl] Error syncing to server (but local save succeeded):', error);
      // エラーログのみ、例外は投げない
    }
  }
}

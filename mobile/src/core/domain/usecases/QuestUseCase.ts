/**
 * QuestUseCase
 * クエスト関連のビジネスロジックを担当するユースケース
 */

import type { Quest, QuestLog } from '../entities/Quest';
import type {
  QuestRepository,
  QuestAdjustments,
  CompleteQuestParams,
  QuestLogResult,
} from '../repositories/QuestRepository';

/**
 * QuestUseCase
 * クエストの取得、生成、完了記録を管理
 */
export class QuestUseCase {
  constructor(private questRepository: QuestRepository) {}

  /**
   * 今日のクエストを取得
   * キャッシュされたクエストがある場合はそれを返す
   *
   * @returns Promise<Quest[]> 今日のクエスト配列（通常3つ）
   * @throws AppError ネットワークエラーやデータベースエラー時
   */
  async getTodayQuests(): Promise<Quest[]> {
    console.log('[QuestUseCase] Fetching today quests...');

    try {
      const quests = await this.questRepository.getTodayQuests();

      console.log(
        `[QuestUseCase] Successfully fetched ${quests.length} quests`
      );

      // ソート: order フィールドで並び替え
      const sortedQuests = quests.sort((a, b) => a.order - b.order);

      return sortedQuests;
    } catch (error) {
      console.error('[QuestUseCase] Error fetching quests:', error);
      throw error;
    }
  }

  /**
   * クエストを生成（調整可能）
   * LLMベースのクエスト生成エンジンを呼び出す
   *
   * @param adjustments クエスト生成調整パラメータ（難易度、タイプなど）
   * @returns Promise<Quest[]> 生成されたクエスト配列
   * @throws AppError 生成エラー時
   */
  async generateQuests(adjustments?: QuestAdjustments): Promise<Quest[]> {
    console.log('[QuestUseCase] Generating quests with adjustments:', adjustments);

    try {
      const quests = await this.questRepository.generateQuests(adjustments);

      console.log(
        `[QuestUseCase] Successfully generated ${quests.length} quests`
      );

      return quests;
    } catch (error) {
      console.error('[QuestUseCase] Error generating quests:', error);
      throw error;
    }
  }

  /**
   * クエストを完了記録
   * 完了ステータスに応じて歩数を計算し、ストリークを更新
   *
   * @param params クエスト完了パラメータ
   * @returns Promise<QuestLogResult> 完了結果（歩数、ストリーク更新など）
   * @throws AppError 記録エラー時
   */
  async completeQuest(params: CompleteQuestParams): Promise<QuestLogResult> {
    console.log('[QuestUseCase] Completing quest:', params.questId);

    try {
      const result = await this.questRepository.completeQuest(params);

      console.log(
        `[QuestUseCase] Quest completed, earned steps: ${result.stepsEarned}`
      );

      return result;
    } catch (error) {
      console.error('[QuestUseCase] Error completing quest:', error);
      throw error;
    }
  }

  /**
   * クエストをID指定で取得
   *
   * @param questId クエストID
   * @returns Promise<Quest | null> クエスト情報、見つからない場合は null
   */
  async getQuestById(questId: string): Promise<Quest | null> {
    console.log('[QuestUseCase] Fetching quest by ID:', questId);

    try {
      const quest = await this.questRepository.getQuestById(questId);

      if (!quest) {
        console.warn(`[QuestUseCase] Quest not found: ${questId}`);
        return null;
      }

      console.log(`[QuestUseCase] Found quest: ${quest.title}`);

      return quest;
    } catch (error) {
      console.error('[QuestUseCase] Error fetching quest:', error);
      throw error;
    }
  }

  /**
   * クエストバンドルで複数クエストを取得
   *
   * @param questBundleId クエストバンドルID
   * @returns Promise<Quest[]> クエスト配列
   */
  async getQuestsByBundleId(questBundleId: string): Promise<Quest[]> {
    console.log('[QuestUseCase] Fetching quests by bundle ID:', questBundleId);

    try {
      const quests = await this.questRepository.getQuestsByBundleId(
        questBundleId
      );

      console.log(
        `[QuestUseCase] Found ${quests.length} quests in bundle`
      );

      return quests.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('[QuestUseCase] Error fetching quests by bundle:', error);
      throw error;
    }
  }

  /**
   * クエストのバリデーション
   * クエストが有効な状態かチェック
   *
   * @param quest クエスト
   * @returns boolean クエストが有効な場合 true
   */
  isQuestValid(quest: Quest): boolean {
    // 有効期限をチェック
    const now = new Date();
    if (now > quest.validUntil) {
      console.warn(
        `[QuestUseCase] Quest expired: ${quest.title}`
      );
      return false;
    }

    // 必須フィールドをチェック
    if (
      !quest.id ||
      !quest.title ||
      !quest.description ||
      !quest.completionCriteria
    ) {
      console.warn(
        '[QuestUseCase] Quest is missing required fields'
      );
      return false;
    }

    return true;
  }
}

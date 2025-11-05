/**
 * NotificationCategoryManager
 * 通知カテゴリとアクションの管理
 *
 * Actionable Notifications（通知からの直接アクション）を実現するため、
 * 通知カテゴリを定義し、expo-notificationsに登録します。
 */

import * as Notifications from 'expo-notifications';
import {
  NotificationCategory,
  NotificationAction,
  NotificationCategoryIdentifier,
  NotificationActionIdentifier,
} from './types';

/**
 * NotificationCategoryManager
 */
export class NotificationCategoryManager {
  private static instance: NotificationCategoryManager | null = null;
  private initialized: boolean = false;

  private constructor() {}

  /**
   * インスタンス取得（シングルトン）
   */
  public static getInstance(): NotificationCategoryManager {
    if (!NotificationCategoryManager.instance) {
      NotificationCategoryManager.instance = new NotificationCategoryManager();
    }
    return NotificationCategoryManager.instance;
  }

  /**
   * 初期化
   * 全ての通知カテゴリを登録
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('NotificationCategoryManager already initialized');
      return;
    }

    try {
      // 各カテゴリを登録
      await this.registerQuestReminderCategory();
      await this.registerQuestCompleteCategory();
      await this.registerMilestoneAchievedCategory();
      await this.registerRankingUpdateCategory();
      await this.registerStagnationAlertCategory();

      this.initialized = true;
      console.log('NotificationCategoryManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NotificationCategoryManager:', error);
      throw error;
    }
  }

  /**
   * クエストリマインダーカテゴリを登録
   * アクション: 「完了をマーク」「後で通知」
   */
  private async registerQuestReminderCategory(): Promise<void> {
    const category: NotificationCategory = {
      identifier: NotificationCategoryIdentifier.QUEST_REMINDER,
      actions: [
        {
          identifier: NotificationActionIdentifier.MARK_COMPLETE,
          buttonTitle: '完了をマーク',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: NotificationActionIdentifier.SNOOZE,
          buttonTitle: '後で通知',
          options: {
            opensAppToForeground: false,
          },
        },
      ],
    };

    await this.registerCategory(category);
  }

  /**
   * クエスト完了カテゴリを登録
   * アクション: 「クエストを表示」
   */
  private async registerQuestCompleteCategory(): Promise<void> {
    const category: NotificationCategory = {
      identifier: NotificationCategoryIdentifier.QUEST_COMPLETE,
      actions: [
        {
          identifier: NotificationActionIdentifier.VIEW_QUEST,
          buttonTitle: 'クエストを表示',
          options: {
            opensAppToForeground: true,
          },
        },
      ],
    };

    await this.registerCategory(category);
  }

  /**
   * マイルストーン達成カテゴリを登録
   * アクション: 「進捗を表示」
   */
  private async registerMilestoneAchievedCategory(): Promise<void> {
    const category: NotificationCategory = {
      identifier: NotificationCategoryIdentifier.MILESTONE_ACHIEVED,
      actions: [
        {
          identifier: NotificationActionIdentifier.VIEW_PROGRESS,
          buttonTitle: '進捗を表示',
          options: {
            opensAppToForeground: true,
          },
        },
      ],
    };

    await this.registerCategory(category);
  }

  /**
   * ランキング更新カテゴリを登録
   * アクション: 「ランキングを表示」
   */
  private async registerRankingUpdateCategory(): Promise<void> {
    const category: NotificationCategory = {
      identifier: NotificationCategoryIdentifier.RANKING_UPDATE,
      actions: [
        {
          identifier: NotificationActionIdentifier.VIEW_PROGRESS,
          buttonTitle: 'ランキングを表示',
          options: {
            opensAppToForeground: true,
          },
        },
      ],
    };

    await this.registerCategory(category);
  }

  /**
   * 停滞アラートカテゴリを登録
   * アクション: 「目標を調整」「閉じる」
   */
  private async registerStagnationAlertCategory(): Promise<void> {
    const category: NotificationCategory = {
      identifier: NotificationCategoryIdentifier.STAGNATION_ALERT,
      actions: [
        {
          identifier: NotificationActionIdentifier.ADJUST_GOAL,
          buttonTitle: '目標を調整',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: NotificationActionIdentifier.DISMISS,
          buttonTitle: '閉じる',
          options: {
            opensAppToForeground: false,
            isDestructive: true,
          },
        },
      ],
    };

    await this.registerCategory(category);
  }

  /**
   * カテゴリを登録
   */
  private async registerCategory(category: NotificationCategory): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync(
        category.identifier,
        category.actions.map((action) => ({
          identifier: action.identifier,
          buttonTitle: action.buttonTitle,
          options: action.options,
        }))
      );

      console.log(`Notification category registered: ${category.identifier}`);
    } catch (error) {
      console.error(`Failed to register category ${category.identifier}:`, error);
      throw error;
    }
  }

  /**
   * カテゴリを削除
   */
  public async deleteCategory(categoryIdentifier: string): Promise<void> {
    try {
      await Notifications.deleteNotificationCategoryAsync(categoryIdentifier);
      console.log(`Notification category deleted: ${categoryIdentifier}`);
    } catch (error) {
      console.error(`Failed to delete category ${categoryIdentifier}:`, error);
      throw error;
    }
  }

  /**
   * 全カテゴリを取得
   */
  public async getAllCategories(): Promise<Notifications.NotificationCategory[]> {
    try {
      return await Notifications.getNotificationCategoriesAsync();
    } catch (error) {
      console.error('Failed to get all categories:', error);
      throw error;
    }
  }
}

/**
 * デフォルトエクスポート
 */
export default NotificationCategoryManager.getInstance();

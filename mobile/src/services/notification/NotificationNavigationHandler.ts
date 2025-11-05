/**
 * NotificationNavigationHandler
 * 通知タップ時のナビゲーション処理
 *
 * 通知のタイプとデータに基づいて適切な画面に遷移します
 */

import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';
import { NotificationType } from './types';

/**
 * Navigation Handler Options
 */
export interface NavigationHandlerOptions {
  /**
   * Navigation Reference
   */
  navigationRef: NavigationContainerRef<any>;
}

/**
 * Notification Navigation Data
 */
export interface NotificationNavigationData {
  /**
   * 通知タイプ
   */
  type: NotificationType;

  /**
   * クエストID（オプション）
   */
  questId?: string;

  /**
   * クエストバンドルID（オプション）
   */
  questBundleId?: string;

  /**
   * マイルストーンID（オプション）
   */
  milestoneId?: string;

  /**
   * 目標ID（オプション）
   */
  goalId?: string;

  /**
   * ユーザーID（オプション）
   */
  userId?: string;

  /**
   * その他のデータ
   */
  [key: string]: any;
}

/**
 * NotificationNavigationHandler
 */
export class NotificationNavigationHandler {
  private static instance: NotificationNavigationHandler | null = null;
  private navigationRef: NavigationContainerRef<any> | null = null;

  private constructor() {}

  /**
   * インスタンス取得（シングルトン）
   */
  public static getInstance(): NotificationNavigationHandler {
    if (!NotificationNavigationHandler.instance) {
      NotificationNavigationHandler.instance = new NotificationNavigationHandler();
    }
    return NotificationNavigationHandler.instance;
  }

  /**
   * 初期化
   */
  public initialize(options: NavigationHandlerOptions): void {
    this.navigationRef = options.navigationRef;
    console.log('NotificationNavigationHandler initialized');
  }

  /**
   * 通知タップ時の処理
   */
  public async handleNotification(notification: Notifications.Notification): Promise<void> {
    try {
      if (!this.navigationRef) {
        console.warn('Navigation ref not initialized');
        return;
      }

      // 通知データを取得
      const data = notification.request.content.data as NotificationNavigationData;

      if (!data || !data.type) {
        console.warn('Notification data is missing or invalid');
        return;
      }

      console.log('Handling notification navigation:', data.type);

      // 通知タイプに応じて画面遷移
      await this.navigateByNotificationType(data);
    } catch (error) {
      console.error('Error handling notification navigation:', error);
    }
  }

  /**
   * 通知タイプに応じて画面遷移
   */
  private async navigateByNotificationType(data: NotificationNavigationData): Promise<void> {
    if (!this.navigationRef) {
      return;
    }

    switch (data.type) {
      case NotificationType.DAILY_QUEST_GENERATED:
        // 日次クエスト生成完了 → ホーム画面
        this.navigateToHome();
        break;

      case NotificationType.MILESTONE_ACHIEVED:
        // 合目達成 → 進捗画面
        this.navigateToProgress();
        break;

      case NotificationType.WEEKLY_RANKING:
        // 週次ランキング → ランキング画面
        this.navigateToRanking();
        break;

      case NotificationType.STAGNATION_ALERT:
        // 停滞アラート → 目標編集画面
        if (data.goalId) {
          this.navigateToGoalEdit(data.goalId);
        } else {
          this.navigateToHome();
        }
        break;

      case NotificationType.REMINDER:
        // リマインダー → クエスト詳細またはホーム画面
        if (data.questId) {
          this.navigateToQuestDetail(data.questId);
        } else {
          this.navigateToHome();
        }
        break;

      default:
        console.warn('Unknown notification type:', data.type);
        this.navigateToHome();
    }
  }

  /**
   * アクション識別子に応じて画面遷移
   */
  public async handleAction(
    actionIdentifier: string,
    notification: Notifications.Notification
  ): Promise<void> {
    try {
      if (!this.navigationRef) {
        console.warn('Navigation ref not initialized');
        return;
      }

      const data = notification.request.content.data as NotificationNavigationData;

      console.log('Handling notification action:', actionIdentifier);

      switch (actionIdentifier) {
        case 'mark_complete':
        case 'view_quest':
          // クエストを表示
          if (data.questId) {
            this.navigateToQuestDetail(data.questId);
          } else {
            this.navigateToHome();
          }
          break;

        case 'view_progress':
          // 進捗を表示
          this.navigateToProgress();
          break;

        case 'adjust_goal':
          // 目標を調整
          if (data.goalId) {
            this.navigateToGoalEdit(data.goalId);
          } else {
            this.navigateToHome();
          }
          break;

        case 'default':
        case 'dismiss':
        default:
          // デフォルト: 通知タイプに応じて遷移
          await this.navigateByNotificationType(data);
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  }

  /**
   * ホーム画面に遷移
   */
  private navigateToHome(): void {
    if (!this.navigationRef || !this.navigationRef.isReady()) {
      console.warn('Navigation not ready');
      return;
    }

    this.navigationRef.navigate('Main', {
      screen: 'Home',
    });

    console.log('Navigated to Home');
  }

  /**
   * クエスト詳細画面に遷移
   */
  private navigateToQuestDetail(questId: string): void {
    if (!this.navigationRef || !this.navigationRef.isReady()) {
      console.warn('Navigation not ready');
      return;
    }

    this.navigationRef.navigate('Main', {
      screen: 'QuestDetail',
      params: { questId },
    });

    console.log('Navigated to QuestDetail:', questId);
  }

  /**
   * 進捗画面に遷移
   */
  private navigateToProgress(): void {
    if (!this.navigationRef || !this.navigationRef.isReady()) {
      console.warn('Navigation not ready');
      return;
    }

    this.navigationRef.navigate('Main', {
      screen: 'Progress',
    });

    console.log('Navigated to Progress');
  }

  /**
   * ランキング画面に遷移
   */
  private navigateToRanking(): void {
    if (!this.navigationRef || !this.navigationRef.isReady()) {
      console.warn('Navigation not ready');
      return;
    }

    this.navigationRef.navigate('Main', {
      screen: 'Ranking',
    });

    console.log('Navigated to Ranking');
  }

  /**
   * 目標編集画面に遷移
   */
  private navigateToGoalEdit(goalId: string): void {
    if (!this.navigationRef || !this.navigationRef.isReady()) {
      console.warn('Navigation not ready');
      return;
    }

    this.navigationRef.navigate('Main', {
      screen: 'GoalEdit',
      params: { goalId },
    });

    console.log('Navigated to GoalEdit:', goalId);
  }

  /**
   * 目標詳細画面に遷移
   */
  private navigateToGoalDetail(goalId: string): void {
    if (!this.navigationRef || !this.navigationRef.isReady()) {
      console.warn('Navigation not ready');
      return;
    }

    this.navigationRef.navigate('Main', {
      screen: 'GoalDetail',
      params: { goalId },
    });

    console.log('Navigated to GoalDetail:', goalId);
  }

  /**
   * Navigation Refをクリア
   */
  public cleanup(): void {
    this.navigationRef = null;
    console.log('NotificationNavigationHandler cleaned up');
  }
}

/**
 * デフォルトエクスポート
 */
export default NotificationNavigationHandler.getInstance();

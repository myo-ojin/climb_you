/**
 * NotificationHistory Repository Interface
 * 通知履歴データの永続化を抽象化
 */

import {
  NotificationHistory,
  CreateNotificationHistoryParams,
} from '../entities/NotificationHistory';
import { NotificationType } from '../../../services/notification/types';

/**
 * NotificationHistoryRepository Interface
 * ドメイン層で定義し、データ層で実装する
 */
export interface NotificationHistoryRepository {
  /**
   * 通知履歴を作成
   */
  createHistory(params: CreateNotificationHistoryParams): Promise<NotificationHistory>;

  /**
   * 通知履歴IDで取得
   */
  getHistoryById(id: string): Promise<NotificationHistory | null>;

  /**
   * 通知IDで取得
   */
  getHistoryByNotificationId(notificationId: string): Promise<NotificationHistory | null>;

  /**
   * ユーザーの全通知履歴を取得
   */
  getUserHistories(userId: string, limit?: number): Promise<NotificationHistory[]>;

  /**
   * ユーザーの特定タイプの通知履歴を取得
   */
  getUserHistoriesByType(
    userId: string,
    type: NotificationType,
    limit?: number
  ): Promise<NotificationHistory[]>;

  /**
   * ユーザーの未読通知履歴を取得（タップされていない）
   */
  getUnreadHistories(userId: string): Promise<NotificationHistory[]>;

  /**
   * 通知履歴を既読にする（タップ記録）
   */
  markAsTapped(id: string): Promise<void>;

  /**
   * 通知履歴を配信済みにする
   */
  markAsDelivered(id: string): Promise<void>;

  /**
   * 古い通知履歴を削除（30日以上経過）
   */
  deleteOldHistories(daysToKeep?: number): Promise<void>;

  /**
   * ユーザーの全通知履歴を削除
   */
  deleteUserHistories(userId: string): Promise<void>;

  /**
   * 通知履歴の統計を取得
   */
  getHistoryStats(userId: string): Promise<{
    totalSent: number;
    totalTapped: number;
    totalDelivered: number;
    byType: Record<NotificationType, number>;
  }>;
}

/**
 * NotificationHistory Entity
 * 通知履歴エンティティ
 */

import { NotificationType } from '../../../services/notification/types';

export interface NotificationHistory {
  /**
   * 通知履歴ID（ローカルのみ）
   */
  id: string;

  /**
   * 通知ID（NotificationServiceが生成したID）
   */
  notificationId: string;

  /**
   * 通知タイプ
   */
  type: NotificationType;

  /**
   * 通知タイトル
   */
  title: string;

  /**
   * 通知本文
   */
  body: string;

  /**
   * 通知サブタイトル（オプション）
   */
  subtitle?: string;

  /**
   * 画像URL（オプション）
   */
  imageUrl?: string;

  /**
   * 通知に関連するデータ
   */
  data?: Record<string, any>;

  /**
   * 通知が送信された日時
   */
  sentAt: Date;

  /**
   * 通知がタップされたかどうか
   */
  isTapped: boolean;

  /**
   * 通知がタップされた日時（オプション）
   */
  tappedAt?: Date;

  /**
   * 通知が表示されたかどうか
   */
  isDelivered: boolean;

  /**
   * ユーザーID
   */
  userId: string;

  /**
   * 作成日時
   */
  createdAt: Date;
}

/**
 * 通知履歴作成パラメータ
 */
export interface CreateNotificationHistoryParams {
  notificationId: string;
  type: NotificationType;
  title: string;
  body: string;
  subtitle?: string;
  imageUrl?: string;
  data?: Record<string, any>;
  userId: string;
}

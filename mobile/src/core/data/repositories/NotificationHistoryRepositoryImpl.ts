/**
 * NotificationHistory Repository Implementation
 * 通知履歴データの永続化実装
 */

import {
  NotificationHistory,
  CreateNotificationHistoryParams,
} from '@/core/domain/entities/NotificationHistory';
import { NotificationHistoryRepository } from '@/core/domain/repositories/NotificationHistoryRepository';
import { NotificationType } from '@/services/notification/types';
import * as SQLite from 'expo-sqlite';

export class NotificationHistoryRepositoryImpl implements NotificationHistoryRepository {
  constructor(private db: SQLite.SQLiteDatabase) {}

  /**
   * 通知履歴を作成
   */
  async createHistory(params: CreateNotificationHistoryParams): Promise<NotificationHistory> {
    try {
      const now = new Date();
      const id = `notification_history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const history: NotificationHistory = {
        id,
        notificationId: params.notificationId,
        type: params.type,
        title: params.title,
        body: params.body,
        subtitle: params.subtitle,
        imageUrl: params.imageUrl,
        data: params.data,
        sentAt: now,
        isTapped: false,
        isDelivered: true,
        userId: params.userId,
        createdAt: now,
      };

      await this.db.runAsync(
        `INSERT INTO notification_histories
        (id, notification_id, type, title, body, subtitle, image_url, data, sent_at, is_tapped, tapped_at, is_delivered, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          history.id,
          history.notificationId,
          history.type,
          history.title,
          history.body,
          history.subtitle || null,
          history.imageUrl || null,
          history.data ? JSON.stringify(history.data) : null,
          history.sentAt.toISOString(),
          history.isTapped ? 1 : 0,
          history.tappedAt?.toISOString() || null,
          history.isDelivered ? 1 : 0,
          history.userId,
          history.createdAt.toISOString(),
        ]
      );

      return history;
    } catch (error) {
      console.error('Failed to create notification history:', error);
      throw error;
    }
  }

  /**
   * 通知履歴IDで取得
   */
  async getHistoryById(id: string): Promise<NotificationHistory | null> {
    try {
      const result = await this.db.getFirstAsync<any>(
        `SELECT * FROM notification_histories WHERE id = ?`,
        [id]
      );

      return result ? this.mapRowToHistory(result) : null;
    } catch (error) {
      console.error('Failed to get notification history by ID:', error);
      throw error;
    }
  }

  /**
   * 通知IDで取得
   */
  async getHistoryByNotificationId(notificationId: string): Promise<NotificationHistory | null> {
    try {
      const result = await this.db.getFirstAsync<any>(
        `SELECT * FROM notification_histories WHERE notification_id = ?`,
        [notificationId]
      );

      return result ? this.mapRowToHistory(result) : null;
    } catch (error) {
      console.error('Failed to get notification history by notification ID:', error);
      throw error;
    }
  }

  /**
   * ユーザーの全通知履歴を取得
   */
  async getUserHistories(userId: string, limit: number = 100): Promise<NotificationHistory[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        `SELECT * FROM notification_histories WHERE user_id = ? ORDER BY sent_at DESC LIMIT ?`,
        [userId, limit]
      );

      return results.map(row => this.mapRowToHistory(row));
    } catch (error) {
      console.error('Failed to get user notification histories:', error);
      throw error;
    }
  }

  /**
   * ユーザーの特定タイプの通知履歴を取得
   */
  async getUserHistoriesByType(
    userId: string,
    type: NotificationType,
    limit: number = 100
  ): Promise<NotificationHistory[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        `SELECT * FROM notification_histories WHERE user_id = ? AND type = ? ORDER BY sent_at DESC LIMIT ?`,
        [userId, type, limit]
      );

      return results.map(row => this.mapRowToHistory(row));
    } catch (error) {
      console.error('Failed to get user notification histories by type:', error);
      throw error;
    }
  }

  /**
   * ユーザーの未読通知履歴を取得（タップされていない）
   */
  async getUnreadHistories(userId: string): Promise<NotificationHistory[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        `SELECT * FROM notification_histories WHERE user_id = ? AND is_tapped = 0 ORDER BY sent_at DESC`,
        [userId]
      );

      return results.map(row => this.mapRowToHistory(row));
    } catch (error) {
      console.error('Failed to get unread notification histories:', error);
      throw error;
    }
  }

  /**
   * 通知履歴を既読にする（タップ記録）
   */
  async markAsTapped(id: string): Promise<void> {
    try {
      await this.db.runAsync(
        `UPDATE notification_histories SET is_tapped = 1, tapped_at = ? WHERE id = ?`,
        [new Date().toISOString(), id]
      );
    } catch (error) {
      console.error('Failed to mark notification history as tapped:', error);
      throw error;
    }
  }

  /**
   * 通知履歴を配信済みにする
   */
  async markAsDelivered(id: string): Promise<void> {
    try {
      await this.db.runAsync(
        `UPDATE notification_histories SET is_delivered = 1 WHERE id = ?`,
        [id]
      );
    } catch (error) {
      console.error('Failed to mark notification history as delivered:', error);
      throw error;
    }
  }

  /**
   * 古い通知履歴を削除（30日以上経過）
   */
  async deleteOldHistories(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      await this.db.runAsync(
        `DELETE FROM notification_histories WHERE sent_at < ?`,
        [cutoffDate.toISOString()]
      );
    } catch (error) {
      console.error('Failed to delete old notification histories:', error);
      throw error;
    }
  }

  /**
   * ユーザーの全通知履歴を削除
   */
  async deleteUserHistories(userId: string): Promise<void> {
    try {
      await this.db.runAsync(
        `DELETE FROM notification_histories WHERE user_id = ?`,
        [userId]
      );
    } catch (error) {
      console.error('Failed to delete user notification histories:', error);
      throw error;
    }
  }

  /**
   * 通知履歴の統計を取得
   */
  async getHistoryStats(userId: string): Promise<{
    totalSent: number;
    totalTapped: number;
    totalDelivered: number;
    byType: Record<NotificationType, number>;
  }> {
    try {
      const totalResult = await this.db.getFirstAsync<any>(
        `SELECT
          COUNT(*) as total_sent,
          SUM(is_tapped) as total_tapped,
          SUM(is_delivered) as total_delivered
        FROM notification_histories
        WHERE user_id = ?`,
        [userId]
      );

      const typeResults = await this.db.getAllAsync<any>(
        `SELECT type, COUNT(*) as count
        FROM notification_histories
        WHERE user_id = ?
        GROUP BY type`,
        [userId]
      );

      const byType: Record<NotificationType, number> = {} as Record<NotificationType, number>;
      typeResults.forEach((row) => {
        byType[row.type as NotificationType] = row.count;
      });

      return {
        totalSent: totalResult?.total_sent || 0,
        totalTapped: totalResult?.total_tapped || 0,
        totalDelivered: totalResult?.total_delivered || 0,
        byType,
      };
    } catch (error) {
      console.error('Failed to get notification history stats:', error);
      throw error;
    }
  }

  /**
   * データベース行をNotificationHistoryエンティティにマップ
   */
  private mapRowToHistory(row: any): NotificationHistory {
    return {
      id: row.id,
      notificationId: row.notification_id,
      type: row.type as NotificationType,
      title: row.title,
      body: row.body,
      subtitle: row.subtitle || undefined,
      imageUrl: row.image_url || undefined,
      data: row.data ? JSON.parse(row.data) : undefined,
      sentAt: new Date(row.sent_at),
      isTapped: Boolean(row.is_tapped),
      tappedAt: row.tapped_at ? new Date(row.tapped_at) : undefined,
      isDelivered: Boolean(row.is_delivered),
      userId: row.user_id,
      createdAt: new Date(row.created_at),
    };
  }
}

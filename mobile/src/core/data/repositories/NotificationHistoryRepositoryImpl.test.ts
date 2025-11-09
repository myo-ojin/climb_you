/**
 * NotificationHistoryRepositoryImpl Tests
 * 通知履歴リポジトリの実装テスト
 */

import { NotificationHistoryRepositoryImpl } from './NotificationHistoryRepositoryImpl';
import type { CreateNotificationHistoryParams } from '@/core/domain/entities/NotificationHistory';
import { NotificationType } from '@/services/notification/types';
import type * as SQLite from 'expo-sqlite';

// モックSQLiteデータベース
class MockSQLiteDatabase implements Partial<SQLite.SQLiteDatabase> {
  runAsync = jest.fn();
  getFirstAsync = jest.fn();
  getAllAsync = jest.fn();
}

describe('NotificationHistoryRepositoryImpl', () => {
  let repository: NotificationHistoryRepositoryImpl;
  let mockDb: MockSQLiteDatabase;

  const mockHistoryRow = {
    id: 'history-1',
    notification_id: 'notif-1',
    type: 'daily_quest',
    title: 'Daily Quest Generated',
    body: 'Your daily quests are ready',
    subtitle: null,
    image_url: null,
    data: JSON.stringify({ questId: 'quest-1' }),
    sent_at: '2025-01-01T09:00:00.000Z',
    is_tapped: 0,
    tapped_at: null,
    is_delivered: 1,
    user_id: 'user-1',
    created_at: '2025-01-01T09:00:00.000Z',
  };

  beforeEach(() => {
    mockDb = new MockSQLiteDatabase();
    repository = new NotificationHistoryRepositoryImpl(mockDb as SQLite.SQLiteDatabase);
    jest.clearAllMocks();
  });

  describe('createHistory', () => {
    it('通知履歴を作成できること', async () => {
      const params: CreateNotificationHistoryParams = {
        notificationId: 'notif-1',
        type: 'daily_quest',
        title: 'Daily Quest Generated',
        body: 'Your daily quests are ready',
        userId: 'user-1',
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const result = await repository.createHistory(params);

      expect(result.notificationId).toBe('notif-1');
      expect(result.type).toBe('daily_quest');
      expect(result.title).toBe('Daily Quest Generated');
      expect(result.isTapped).toBe(false);
      expect(result.isDelivered).toBe(true);
      expect(result.userId).toBe('user-1');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_histories'),
        expect.arrayContaining([
          expect.any(String),
          'notif-1',
          'daily_quest',
          'Daily Quest Generated',
          'Your daily quests are ready',
        ])
      );
    });

    it('オプショナルフィールドを含めて作成できること', async () => {
      const params: CreateNotificationHistoryParams = {
        notificationId: 'notif-2',
        type: 'milestone_achieved',
        title: 'Milestone Achieved',
        body: 'Congratulations!',
        subtitle: 'You reached station 5',
        imageUrl: 'https://example.com/image.png',
        data: { milestoneId: 'milestone-5' },
        userId: 'user-1',
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const result = await repository.createHistory(params);

      expect(result.subtitle).toBe('You reached station 5');
      expect(result.imageUrl).toBe('https://example.com/image.png');
      expect(result.data).toEqual({ milestoneId: 'milestone-5' });
    });

    it('データベースエラー時に例外をスローすること', async () => {
      const params: CreateNotificationHistoryParams = {
        notificationId: 'notif-1',
        type: 'daily_quest',
        title: 'test',
        body: 'test',
        userId: 'user-1',
      };

      mockDb.runAsync.mockRejectedValue(new Error('DB error'));

      await expect(repository.createHistory(params)).rejects.toThrow('DB error');
    });
  });

  describe('getHistoryById', () => {
    it('IDで通知履歴を取得できること', async () => {
      mockDb.getFirstAsync.mockResolvedValue(mockHistoryRow);

      const result = await repository.getHistoryById('history-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('history-1');
      expect(result?.type).toBe('daily_quest');
      expect(result?.isTapped).toBe(false);
      expect(result?.isDelivered).toBe(true);
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notification_histories WHERE id'),
        ['history-1']
      );
    });

    it('履歴が見つからない場合はnullを返すこと', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await repository.getHistoryById('non-existent');

      expect(result).toBeNull();
    });

    it('データベースエラー時に例外をスローすること', async () => {
      mockDb.getFirstAsync.mockRejectedValue(new Error('DB error'));

      await expect(repository.getHistoryById('history-1')).rejects.toThrow('DB error');
    });
  });

  describe('getHistoryByNotificationId', () => {
    it('通知IDで履歴を取得できること', async () => {
      mockDb.getFirstAsync.mockResolvedValue(mockHistoryRow);

      const result = await repository.getHistoryByNotificationId('notif-1');

      expect(result).not.toBeNull();
      expect(result?.notificationId).toBe('notif-1');
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE notification_id'),
        ['notif-1']
      );
    });

    it('履歴が見つからない場合はnullを返すこと', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await repository.getHistoryByNotificationId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getUserHistories', () => {
    it('ユーザーの全通知履歴を取得できること', async () => {
      const mockRows = [
        mockHistoryRow,
        { ...mockHistoryRow, id: 'history-2', notification_id: 'notif-2' },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockRows);

      const result = await repository.getUserHistories('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('history-1');
      expect(result[1].id).toBe('history-2');
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id'),
        ['user-1', 100]
      );
    });

    it('limitパラメータが機能すること', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await repository.getUserHistories('user-1', 50);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.any(String),
        ['user-1', 50]
      );
    });

    it('履歴がない場合は空配列を返すこと', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await repository.getUserHistories('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getUserHistoriesByType', () => {
    it('特定タイプの通知履歴を取得できること', async () => {
      const mockRows = [mockHistoryRow];
      mockDb.getAllAsync.mockResolvedValue(mockRows);

      const result = await repository.getUserHistoriesByType('user-1', 'daily_quest');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('daily_quest');
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('AND type ='),
        ['user-1', 'daily_quest', 100]
      );
    });
  });

  describe('getUnreadHistories', () => {
    it('未読通知履歴を取得できること', async () => {
      const mockRows = [mockHistoryRow];
      mockDb.getAllAsync.mockResolvedValue(mockRows);

      const result = await repository.getUnreadHistories('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].isTapped).toBe(false);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('is_tapped = 0'),
        ['user-1']
      );
    });
  });

  describe('markAsTapped', () => {
    it('通知履歴を既読にできること', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

      await repository.markAsTapped('history-1');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notification_histories SET is_tapped = 1'),
        [expect.any(String), 'history-1']
      );
    });

    it('データベースエラー時に例外をスローすること', async () => {
      mockDb.runAsync.mockRejectedValue(new Error('Update failed'));

      await expect(repository.markAsTapped('history-1')).rejects.toThrow('Update failed');
    });
  });

  describe('markAsDelivered', () => {
    it('通知履歴を配信済みにできること', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

      await repository.markAsDelivered('history-1');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notification_histories SET is_delivered = 1'),
        ['history-1']
      );
    });
  });

  describe('deleteOldHistories', () => {
    it('古い通知履歴を削除できること', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 5, lastInsertRowId: 0 });

      await repository.deleteOldHistories(30);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM notification_histories WHERE sent_at <'),
        [expect.any(String)]
      );
    });

    it('デフォルトで30日経過したものを削除すること', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 5, lastInsertRowId: 0 });

      await repository.deleteOldHistories();

      expect(mockDb.runAsync).toHaveBeenCalled();
    });
  });

  describe('deleteUserHistories', () => {
    it('ユーザーの全通知履歴を削除できること', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 10, lastInsertRowId: 0 });

      await repository.deleteUserHistories('user-1');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM notification_histories WHERE user_id'),
        ['user-1']
      );
    });
  });

  describe('getHistoryStats', () => {
    it('通知履歴の統計を取得できること', async () => {
      const mockTotalResult = {
        total_sent: 100,
        total_tapped: 80,
        total_delivered: 95,
      };
      const mockTypeResults = [
        { type: 'daily_quest', count: 50 },
        { type: 'milestone_achieved', count: 30 },
        { type: 'weekly_ranking', count: 20 },
      ];

      mockDb.getFirstAsync.mockResolvedValue(mockTotalResult);
      mockDb.getAllAsync.mockResolvedValue(mockTypeResults);

      const result = await repository.getHistoryStats('user-1');

      expect(result.totalSent).toBe(100);
      expect(result.totalTapped).toBe(80);
      expect(result.totalDelivered).toBe(95);
      expect(result.byType.daily_quest).toBe(50);
      expect(result.byType.milestone_achieved).toBe(30);
      expect(result.byType.weekly_ranking).toBe(20);
    });

    it('統計がない場合は0を返すこと', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await repository.getHistoryStats('user-1');

      expect(result.totalSent).toBe(0);
      expect(result.totalTapped).toBe(0);
      expect(result.totalDelivered).toBe(0);
      expect(result.byType).toEqual({});
    });
  });
});

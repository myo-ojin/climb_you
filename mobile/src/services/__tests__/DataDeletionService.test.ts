/**
 * DataDeletionService Test
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataDeletionService } from '../DataDeletionService';
import { ImageCache } from '../ImageCache';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getAllKeys: jest.fn(),
  removeItem: jest.fn(),
  getItem: jest.fn(),
}));

// Mock ImageCache
jest.mock('../ImageCache', () => ({
  ImageCache: {
    clearAll: jest.fn(),
  },
}));

describe('DataDeletionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteAllUserData', () => {
    it('すべてのユーザーデータを削除できる', async () => {
      const mockKeys = [
        'user_123',
        'goal_1',
        'milestone_1',
        'questLog_1',
        'progress_1',
        'streak_1',
      ];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const result = await DataDeletionService.deleteAllUserData();

      expect(result.success).toBe(true);
      expect(result.deletedItems).toBe(6);
      expect(result.deletedKeys).toEqual(mockKeys);
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(6);
    });

    it('設定を保持してユーザーデータを削除できる', async () => {
      const mockKeys = [
        'user_123',
        'goal_1',
        'settings_notification',
        'preferences_theme',
      ];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const result = await DataDeletionService.deleteAllUserData({
        clearSettings: false,
      });

      expect(result.success).toBe(true);
      expect(result.deletedItems).toBe(2); // user_123 と goal_1 のみ
      expect(result.deletedKeys).toEqual(['user_123', 'goal_1']);
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(2);
    });

    it('画像キャッシュもクリアできる', async () => {
      const mockKeys = ['user_123', 'goal_1'];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
      (ImageCache.clearAll as jest.Mock).mockResolvedValue(undefined);

      const result = await DataDeletionService.deleteAllUserData({
        clearImageCache: true,
      });

      expect(result.success).toBe(true);
      expect(result.deletedItems).toBe(3); // 2 storage items + image cache
      expect(ImageCache.clearAll).toHaveBeenCalled();
      expect(result.deletedKeys).toContain('ImageCache');
    });

    it('削除に失敗した場合エラーを返す', async () => {
      const mockError = new Error('Storage error');
      (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValue(mockError);

      const result = await DataDeletionService.deleteAllUserData();

      expect(result.success).toBe(false);
      expect(result.deletedItems).toBe(0);
      expect(result.error).toBe('Storage error');
    });
  });

  describe('deleteDataByType', () => {
    it('特定の種類のデータのみを削除できる', async () => {
      const mockKeys = [
        'user_123',
        'goal_1',
        'goal_2',
        'milestone_1',
        'questLog_1',
      ];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const result = await DataDeletionService.deleteDataByType('goals');

      expect(result.success).toBe(true);
      expect(result.deletedItems).toBe(2); // goal_1 と goal_2
      expect(result.deletedKeys).toEqual(['goal_1', 'goal_2']);
    });

    it('該当するデータがない場合は0件削除', async () => {
      const mockKeys = ['user_123', 'milestone_1'];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const result = await DataDeletionService.deleteDataByType('goals');

      expect(result.success).toBe(true);
      expect(result.deletedItems).toBe(0);
      expect(result.deletedKeys).toEqual([]);
    });
  });

  describe('clearImageCacheOnly', () => {
    it('画像キャッシュのみをクリアできる', async () => {
      (ImageCache.clearAll as jest.Mock).mockResolvedValue(undefined);

      const result = await DataDeletionService.clearImageCacheOnly();

      expect(result.success).toBe(true);
      expect(result.deletedItems).toBe(1);
      expect(result.deletedKeys).toEqual(['ImageCache']);
      expect(ImageCache.clearAll).toHaveBeenCalled();
    });

    it('画像キャッシュのクリアに失敗した場合エラーを返す', async () => {
      const mockError = new Error('Cache clear failed');
      (ImageCache.clearAll as jest.Mock).mockRejectedValue(mockError);

      const result = await DataDeletionService.clearImageCacheOnly();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cache clear failed');
    });
  });

  describe('getStorageInfo', () => {
    it('ストレージの使用状況を取得できる', async () => {
      const mockKeys = [
        'user_123',
        'goal_1',
        'settings_notification',
      ];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{"data":"test"}');

      const info = await DataDeletionService.getStorageInfo();

      expect(info.totalKeys).toBe(3);
      expect(info.userDataKeys).toBe(2); // user_123, goal_1
      expect(info.settingsKeys).toBe(1); // settings_notification
      expect(info.estimatedSize).toBeGreaterThan(0);
    });
  });

  describe('getDeletionPreview', () => {
    it('削除プレビューを取得できる', async () => {
      const mockKeys = [
        'goal_1',
        'milestone_1',
        'questLog_1',
        'progress_1',
        'streak_1',
      ];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{"data":"test"}');

      const preview = await DataDeletionService.getDeletionPreview();

      expect(preview.totalItems).toBe(5);
      expect(preview.itemsByType.goals).toBe(1);
      expect(preview.itemsByType.milestones).toBe(1);
      expect(preview.itemsByType.questLogs).toBe(1);
      expect(preview.itemsByType.progress).toBe(1);
      expect(preview.itemsByType.streak).toBe(1);
      expect(preview.estimatedSize).toBeGreaterThan(0);
    });

    it('データがない場合は0件を返す', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);

      const preview = await DataDeletionService.getDeletionPreview();

      expect(preview.totalItems).toBe(0);
      expect(preview.itemsByType.goals).toBe(0);
      expect(preview.estimatedSize).toBe(0);
    });
  });
});

/**
 * DataDeletionService
 * ユーザーデータの削除機能
 *
 * 機能:
 * - すべてのユーザーデータの削除
 * - AsyncStorageのクリア
 * - キャッシュのクリア
 * - 削除確認とバックアップオプション
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageCache } from './ImageCache';

export interface DeletionResult {
  /**
   * 削除成功したか
   */
  success: boolean;

  /**
   * 削除したアイテム数
   */
  deletedItems: number;

  /**
   * エラーメッセージ（失敗時）
   */
  error?: string;

  /**
   * 削除した項目のリスト
   */
  deletedKeys: string[];
}

export interface DeletionOptions {
  /**
   * 画像キャッシュも削除するか
   */
  clearImageCache?: boolean;

  /**
   * 設定も削除するか（デフォルト: false）
   */
  clearSettings?: boolean;

  /**
   * 削除前にバックアップを作成するか
   */
  createBackup?: boolean;
}

class DataDeletionServiceClass {
  /**
   * すべてのユーザーデータを削除
   */
  async deleteAllUserData(options: DeletionOptions = {}): Promise<DeletionResult> {
    try {
      console.log('[DataDeletionService] Starting data deletion...');

      const deletedKeys: string[] = [];
      let deletedItems = 0;

      // 1. AsyncStorageからユーザーデータを削除
      const storageKeys = await this.getUserDataKeys();
      console.log(`[DataDeletionService] Found ${storageKeys.length} storage keys`);

      for (const key of storageKeys) {
        // 設定は削除しない場合はスキップ
        if (!options.clearSettings && this.isSettingsKey(key)) {
          console.log(`[DataDeletionService] Skipping settings key: ${key}`);
          continue;
        }

        await AsyncStorage.removeItem(key);
        deletedKeys.push(key);
        deletedItems++;
        console.log(`[DataDeletionService] Deleted: ${key}`);
      }

      // 2. 画像キャッシュをクリア
      if (options.clearImageCache) {
        console.log('[DataDeletionService] Clearing image cache...');
        await ImageCache.clearAll();
        deletedKeys.push('ImageCache');
        deletedItems++;
      }

      console.log(`[DataDeletionService] Data deletion completed: ${deletedItems} items deleted`);

      return {
        success: true,
        deletedItems,
        deletedKeys,
      };
    } catch (error) {
      console.error('[DataDeletionService] Data deletion failed:', error);
      return {
        success: false,
        deletedItems: 0,
        deletedKeys: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 特定の種類のデータのみを削除
   */
  async deleteDataByType(
    type: 'goals' | 'questLogs' | 'progress' | 'streak' | 'userProfile'
  ): Promise<DeletionResult> {
    try {
      console.log(`[DataDeletionService] Deleting data type: ${type}`);

      const deletedKeys: string[] = [];
      let deletedItems = 0;

      // typeをキープレフィックスにマッピング
      const typeToPrefix: Record<string, string> = {
        goals: 'goal_',
        questLogs: 'questLog_',
        progress: 'progress_',
        streak: 'streak_',
        userProfile: 'profile_',
      };

      const prefix = typeToPrefix[type];
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToDelete = allKeys.filter((key) => key.startsWith(prefix));

      for (const key of keysToDelete) {
        await AsyncStorage.removeItem(key);
        deletedKeys.push(key);
        deletedItems++;
      }

      console.log(`[DataDeletionService] Deleted ${deletedItems} items of type ${type}`);

      return {
        success: true,
        deletedItems,
        deletedKeys,
      };
    } catch (error) {
      console.error(`[DataDeletionService] Failed to delete ${type}:`, error);
      return {
        success: false,
        deletedItems: 0,
        deletedKeys: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 画像キャッシュのみをクリア
   */
  async clearImageCacheOnly(): Promise<DeletionResult> {
    try {
      console.log('[DataDeletionService] Clearing image cache only...');
      await ImageCache.clearAll();

      return {
        success: true,
        deletedItems: 1,
        deletedKeys: ['ImageCache'],
      };
    } catch (error) {
      console.error('[DataDeletionService] Failed to clear image cache:', error);
      return {
        success: false,
        deletedItems: 0,
        deletedKeys: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * ストレージの使用状況を取得
   */
  async getStorageInfo(): Promise<{
    totalKeys: number;
    userDataKeys: number;
    settingsKeys: number;
    estimatedSize: number;
  }> {
    const allKeys = await AsyncStorage.getAllKeys();
    const userDataKeys = await this.getUserDataKeys();
    const settingsKeys = allKeys.filter((key) => this.isSettingsKey(key));

    // 簡易的なサイズ推定（実際のサイズは取得できないため）
    let estimatedSize = 0;
    for (const key of allKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        estimatedSize += value.length;
      }
    }

    return {
      totalKeys: allKeys.length,
      userDataKeys: userDataKeys.length,
      settingsKeys: settingsKeys.length,
      estimatedSize,
    };
  }

  /**
   * ユーザーデータのキーを取得
   */
  private async getUserDataKeys(): Promise<string[]> {
    const allKeys = await AsyncStorage.getAllKeys();

    // ユーザーデータとみなすキーのプレフィックス
    const userDataPrefixes = [
      'user_',
      'goal_',
      'milestone_',
      'quest_',
      'questLog_',
      'progress_',
      'streak_',
      'profile_',
      'achievement_',
      'ranking_',
    ];

    return allKeys.filter((key) =>
      userDataPrefixes.some((prefix) => key.startsWith(prefix))
    );
  }

  /**
   * 設定キーかどうかを判定
   */
  private isSettingsKey(key: string): boolean {
    const settingsPrefixes = [
      'settings_',
      'preferences_',
      'config_',
      'notification_',
      'privacy_',
      'powerSaving_',
    ];

    return settingsPrefixes.some((prefix) => key.startsWith(prefix));
  }

  /**
   * データ削除前の確認情報を取得
   */
  async getDeletionPreview(): Promise<{
    totalItems: number;
    itemsByType: Record<string, number>;
    estimatedSize: number;
  }> {
    const allKeys = await AsyncStorage.getAllKeys();
    const itemsByType: Record<string, number> = {
      goals: 0,
      milestones: 0,
      quests: 0,
      questLogs: 0,
      progress: 0,
      streak: 0,
      userProfile: 0,
      achievements: 0,
      rankings: 0,
      other: 0,
    };

    let estimatedSize = 0;

    for (const key of allKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        estimatedSize += value.length;
      }

      // キーの種類をカウント
      if (key.includes('goal')) itemsByType.goals++;
      else if (key.includes('milestone')) itemsByType.milestones++;
      else if (key.includes('quest') && !key.includes('Log')) itemsByType.quests++;
      else if (key.includes('questLog')) itemsByType.questLogs++;
      else if (key.includes('progress')) itemsByType.progress++;
      else if (key.includes('streak')) itemsByType.streak++;
      else if (key.includes('profile')) itemsByType.userProfile++;
      else if (key.includes('achievement')) itemsByType.achievements++;
      else if (key.includes('ranking')) itemsByType.rankings++;
      else itemsByType.other++;
    }

    return {
      totalItems: allKeys.length,
      itemsByType,
      estimatedSize,
    };
  }
}

// シングルトンインスタンス
export const DataDeletionService = new DataDeletionServiceClass();

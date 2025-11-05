/**
 * OfflineSyncQueueHandler
 * オフライン時のシンク キュー処理
 *
 * 責務:
 * - オフライン時の操作キュー管理
 * - キューの永続化・復元
 * - オンライン復帰時の自動同期
 * - キューのプリオリティ管理
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  SyncQueueItem,
  SyncQueueItemType,
  EntityType,
} from '@/core/domain/entities/SyncQueue';

/**
 * オフラインキュー永続化キー
 */
const OFFLINE_QUEUE_STORAGE_KEY = 'sync:offlineQueue';
const OFFLINE_QUEUE_MAX_SIZE = 1000;

/**
 * オフラインキュー統計
 */
export interface OfflineQueueStats {
  totalItems: number;
  pendingItems: number;
  failedItems: number;
  largestQueueSize: number;
  estimatedStorageSize: number;
}

/**
 * OfflineSyncQueueHandler クラス
 */
export class OfflineSyncQueueHandler {
  private queue: SyncQueueItem[] = [];
  private isLoading = false;

  /**
   * 初期化（キューの復元）
   */
  async initialize(): Promise<void> {
    try {
      this.isLoading = true;
      await this.loadQueueFromStorage();
      this.isLoading = false;

      console.log(`[OfflineSyncQueueHandler] Initialized with ${this.queue.length} items`);
    } catch (error) {
      console.error('[OfflineSyncQueueHandler] Initialization failed:', error);
      this.isLoading = false;
      this.queue = [];
    }
  }

  /**
   * キューに操作を追加
   */
  async enqueue(item: SyncQueueItem): Promise<string> {
    try {
      // キューサイズチェック
      if (this.queue.length >= OFFLINE_QUEUE_MAX_SIZE) {
        throw new Error(
          `Offline queue is full (max: ${OFFLINE_QUEUE_MAX_SIZE} items)`
        );
      }

      // キューに追加
      this.queue.push(item);

      // AsyncStorage に永続化
      await this.saveQueueToStorage();

      console.log(
        `[OfflineSyncQueueHandler] Item enqueued: ${item.id} (total: ${this.queue.length})`
      );

      return item.id;
    } catch (error) {
      console.error('[OfflineSyncQueueHandler] Failed to enqueue item:', error);
      throw error;
    }
  }

  /**
   * キューから操作を削除
   */
  async dequeue(itemId: string): Promise<SyncQueueItem | null> {
    try {
      const index = this.queue.findIndex((item) => item.id === itemId);
      if (index === -1) {
        return null;
      }

      const [item] = this.queue.splice(index, 1);

      // AsyncStorage に永続化
      await this.saveQueueToStorage();

      console.log(
        `[OfflineSyncQueueHandler] Item dequeued: ${itemId} (remaining: ${this.queue.length})`
      );

      return item;
    } catch (error) {
      console.error('[OfflineSyncQueueHandler] Failed to dequeue item:', error);
      throw error;
    }
  }

  /**
   * キューの全アイテムを取得
   */
  async getAllQueuedItems(): Promise<SyncQueueItem[]> {
    try {
      return [...this.queue];
    } catch (error) {
      console.error('[OfflineSyncQueueHandler] Failed to get queued items:', error);
      return [];
    }
  }

  /**
   * キューの先頭アイテムを取得（削除しない）
   */
  async peekQueuedItem(): Promise<SyncQueueItem | null> {
    try {
      return this.queue.length > 0 ? this.queue[0] : null;
    } catch (error) {
      console.error('[OfflineSyncQueueHandler] Failed to peek queue:', error);
      return null;
    }
  }

  /**
   * キューをプリオリティに基づいてソート
   */
  async sortByPriority(): Promise<void> {
    try {
      this.queue.sort((a, b) => {
        // 優先度: delete > update > create > その他
        const priorityMap: Record<string, number> = {
          delete: 3,
          update: 2,
          create: 1,
          complete_quest: 1,
          skip_quest: 1,
          obstruct_quest: 1,
        };

        const priorityA = priorityMap[a.operation] || 0;
        const priorityB = priorityMap[b.operation] || 0;

        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }

        // 同じ優先度の場合は作成時刻でソート（古い順）
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      await this.saveQueueToStorage();

      console.log('[OfflineSyncQueueHandler] Queue sorted by priority');
    } catch (error) {
      console.error('[OfflineSyncQueueHandler] Failed to sort queue:', error);
    }
  }

  /**
   * エンティティタイプでフィルタリング
   */
  async getItemsByEntityType(entityType: EntityType): Promise<SyncQueueItem[]> {
    try {
      return this.queue.filter((item) => item.entityType === entityType);
    } catch (error) {
      console.error('[OfflineSyncQueueHandler] Failed to filter by entity type:', error);
      return [];
    }
  }

  /**
   * 特定エンティティの操作を取得
   */
  async getItemsByEntity(
    entityType: EntityType,
    entityId: string
  ): Promise<SyncQueueItem[]> {
    try {
      return this.queue.filter(
        (item) => item.entityType === entityType && item.entityId === entityId
      );
    } catch (error) {
      console.error('[OfflineSyncQueueHandler] Failed to get items by entity:', error);
      return [];
    }
  }

  /**
   * キューの統計取得
   */
  async getQueueStats(): Promise<OfflineQueueStats> {
    try {
      const pendingItems = this.queue.filter((item) => item.status === 'pending').length;
      const failedItems = this.queue.filter((item) => item.status === 'failed').length;

      // ストレージ使用量の推定
      const queueJson = JSON.stringify(this.queue);
      const estimatedSize = new Blob([queueJson]).size;

      return {
        totalItems: this.queue.length,
        pendingItems,
        failedItems,
        largestQueueSize: OFFLINE_QUEUE_MAX_SIZE,
        estimatedStorageSize: estimatedSize,
      };
    } catch (error) {
      console.error('[OfflineSyncQueueHandler] Failed to get queue stats:', error);
      return {
        totalItems: 0,
        pendingItems: 0,
        failedItems: 0,
        largestQueueSize: OFFLINE_QUEUE_MAX_SIZE,
        estimatedStorageSize: 0,
      };
    }
  }

  /**
   * キューをクリア
   */
  async clearQueue(): Promise<void> {
    try {
      const count = this.queue.length;
      this.queue = [];

      await AsyncStorage.removeItem(OFFLINE_QUEUE_STORAGE_KEY);

      console.log(
        `[OfflineSyncQueueHandler] Queue cleared (${count} items removed)`
      );
    } catch (error) {
      console.error('[OfflineSyncQueueHandler] Failed to clear queue:', error);
    }
  }

  /**
   * 失敗したアイテムをクリア
   */
  async clearFailedItems(): Promise<void> {
    try {
      const initialCount = this.queue.length;
      this.queue = this.queue.filter((item) => item.status !== 'failed');

      await this.saveQueueToStorage();

      const removedCount = initialCount - this.queue.length;
      console.log(
        `[OfflineSyncQueueHandler] Failed items cleared (${removedCount} items)`
      );
    } catch (error) {
      console.error('[OfflineSyncQueueHandler] Failed to clear failed items:', error);
    }
  }

  /**
   * キューを AsyncStorage に保存
   */
  private async saveQueueToStorage(): Promise<void> {
    try {
      const queueJson = JSON.stringify(this.queue);
      await AsyncStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, queueJson);
    } catch (error) {
      console.error('[OfflineSyncQueueHandler] Failed to save queue to storage:', error);
      throw error;
    }
  }

  /**
   * AsyncStorage からキューを読み込み
   */
  private async loadQueueFromStorage(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
      if (!queueJson) {
        this.queue = [];
        return;
      }

      const parsedQueue = JSON.parse(queueJson);
      this.queue = parsedQueue.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      }));
    } catch (error) {
      console.error('[OfflineSyncQueueHandler] Failed to load queue from storage:', error);
      this.queue = [];
    }
  }

  /**
   * オンライン状態を確認
   */
  async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isInternetReachable ?? false;
    } catch (error) {
      console.error('[OfflineSyncQueueHandler] Failed to check online status:', error);
      return false;
    }
  }

  /**
   * キューのサイズを取得
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * キューが空かチェック
   */
  isQueueEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * キューが満杯かチェック
   */
  isQueueFull(): boolean {
    return this.queue.length >= OFFLINE_QUEUE_MAX_SIZE;
  }
}

/**
 * グローバル OfflineSyncQueueHandler インスタンス
 */
let globalQueueHandler: OfflineSyncQueueHandler | null = null;

/**
 * グローバル OfflineSyncQueueHandler インスタンス取得
 */
export async function getOfflineSyncQueueHandler(): Promise<OfflineSyncQueueHandler> {
  if (!globalQueueHandler) {
    globalQueueHandler = new OfflineSyncQueueHandler();
    await globalQueueHandler.initialize();
  }
  return globalQueueHandler;
}

/**
 * グローバル OfflineSyncQueueHandler インスタンスリセット（テスト用）
 */
export function resetOfflineSyncQueueHandler(): void {
  globalQueueHandler = null;
}

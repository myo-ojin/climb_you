/**
 * OfflineSyncQueueManager
 * オフラインモード中の同期キュー操作管理
 *
 * 責務:
 * - オフラインモード中のキュー操作
 * - キューイングされた操作の管理
 * - オンライン復帰時の同期準備
 * - 優先度管理と順序保証
 */

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SyncQueueItem,
  EntityType,
  SyncQueueItemType,
} from '@/core/domain/entities/SyncQueue';

/**
 * オフラインキューの状態
 */
export interface OfflineQueueState {
  isQueueing: boolean;
  queueSize: number;
  pendingOperations: number;
  estimatedSyncTime: number; // ミリ秒
}

/**
 * OfflineSyncQueueManager クラス
 */
export class OfflineSyncQueueManager {
  private queue: SyncQueueItem[] = [];

  // 状態管理
  private queueState$ = new BehaviorSubject<OfflineQueueState>({
    isQueueing: false,
    queueSize: 0,
    pendingOperations: 0,
    estimatedSyncTime: 0,
  });

  // イベントストリーム
  private itemQueued$ = new Subject<SyncQueueItem>();
  private itemRemoved$ = new Subject<string>(); // itemId
  private queueFlushStarted$ = new Subject<void>();
  private queueFlushCompleted$ = new Subject<number>(); // 処理数

  // ストレージキー
  private readonly OFFLINE_QUEUE_KEY = 'sync:offlineQueue';
  private readonly MAX_QUEUE_SIZE = 1000;
  private readonly ESTIMATED_TIME_PER_ITEM = 500; // ミリ秒

  private constructor() {}

  private static instance: OfflineSyncQueueManager;

  /**
   * シングルトンインスタンス取得
   */
  static getInstance(): OfflineSyncQueueManager {
    if (!OfflineSyncQueueManager.instance) {
      OfflineSyncQueueManager.instance = new OfflineSyncQueueManager();
    }
    return OfflineSyncQueueManager.instance;
  }

  /**
   * 初期化（キューの復元）
   */
  async initialize(): Promise<void> {
    try {
      await this.loadQueueFromStorage();
      this.updateQueueState();
      console.log(
        `[OfflineSyncQueueManager] Initialized with ${this.queue.length} queued items`
      );
    } catch (error) {
      console.error('[OfflineSyncQueueManager] Initialization failed:', error);
      this.queue = [];
    }
  }

  /**
   * オフラインモードで操作をキューに追加
   */
  async queueOperationOffline(
    operation: SyncQueueItemType,
    entityType: EntityType,
    entityId: string,
    payload: Record<string, any>
  ): Promise<string> {
    try {
      // キューサイズチェック
      if (this.queue.length >= this.MAX_QUEUE_SIZE) {
        throw new Error(`Offline queue is full (max: ${this.MAX_QUEUE_SIZE} items)`);
      }

      const item: SyncQueueItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        operation,
        entityType,
        entityId,
        payload,
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending',
      };

      // キューに追加
      this.queue.push(item);

      // AsyncStorage に永続化
      await this.saveQueueToStorage();

      // 状態を更新
      this.updateQueueState();

      // イベント発火
      this.itemQueued$.next(item);

      console.log(
        `[OfflineSyncQueueManager] Operation queued: ${operation} on ${entityType}/${entityId}`
      );

      return item.id;
    } catch (error) {
      console.error('[OfflineSyncQueueManager] Failed to queue operation:', error);
      throw error;
    }
  }

  /**
   * キューを取得
   */
  getQueue(): SyncQueueItem[] {
    return [...this.queue];
  }

  /**
   * キューサイズを取得
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * ペンディング操作数を取得
   */
  getPendingOperationsCount(): number {
    return this.queue.filter((item) => item.status === 'pending').length;
  }

  /**
   * 推定同期時間を取得（ミリ秒）
   */
  getEstimatedSyncTime(): number {
    return this.getPendingOperationsCount() * this.ESTIMATED_TIME_PER_ITEM;
  }

  /**
   * キューの状態を取得
   */
  getQueueState(): OfflineQueueState {
    return this.queueState$.getValue();
  }

  /**
   * キューの状態ストリーム
   */
  getQueueState$(): Observable<OfflineQueueState> {
    return this.queueState$.asObservable();
  }

  /**
   * アイテムキューイングイベント
   */
  getItemQueued$(): Observable<SyncQueueItem> {
    return this.itemQueued$.asObservable();
  }

  /**
   * アイテム削除イベント
   */
  getItemRemoved$(): Observable<string> {
    return this.itemRemoved$.asObservable();
  }

  /**
   * キューフラッシュ開始イベント
   */
  getQueueFlushStarted$(): Observable<void> {
    return this.queueFlushStarted$.asObservable();
  }

  /**
   * キューフラッシュ完了イベント
   */
  getQueueFlushCompleted$(): Observable<number> {
    return this.queueFlushCompleted$.asObservable();
  }

  /**
   * オンライン復帰時にキューをフラッシュ準備
   */
  async prepareQueueForSync(): Promise<SyncQueueItem[]> {
    try {
      // キューをプリオリティでソート
      this.sortByPriority();

      // フラッシュ開始イベント発火
      this.queueFlushStarted$.next();

      console.log(
        `[OfflineSyncQueueManager] Queue prepared for sync: ${this.queue.length} items`
      );

      return [...this.queue];
    } catch (error) {
      console.error('[OfflineSyncQueueManager] Failed to prepare queue:', error);
      throw error;
    }
  }

  /**
   * キューからアイテムを削除（同期成功時）
   */
  async removeQueuedItem(itemId: string): Promise<void> {
    try {
      const index = this.queue.findIndex((item) => item.id === itemId);
      if (index === -1) {
        return;
      }

      this.queue.splice(index, 1);

      // AsyncStorage に永続化
      await this.saveQueueToStorage();

      // 状態を更新
      this.updateQueueState();

      // イベント発火
      this.itemRemoved$.next(itemId);

      console.log(`[OfflineSyncQueueManager] Item removed: ${itemId}`);
    } catch (error) {
      console.error('[OfflineSyncQueueManager] Failed to remove item:', error);
    }
  }

  /**
   * キューをクリア
   */
  async clearQueue(): Promise<void> {
    try {
      const count = this.queue.length;
      this.queue = [];

      await AsyncStorage.removeItem(this.OFFLINE_QUEUE_KEY);

      // 状態を更新
      this.updateQueueState();

      console.log(`[OfflineSyncQueueManager] Queue cleared (${count} items removed)`);
    } catch (error) {
      console.error('[OfflineSyncQueueManager] Failed to clear queue:', error);
    }
  }

  /**
   * 失敗したアイテムをマーク
   */
  async markItemAsFailed(itemId: string, error: string): Promise<void> {
    try {
      const item = this.queue.find((i) => i.id === itemId);
      if (!item) {
        return;
      }

      item.status = 'failed';
      item.lastError = error;
      item.retryCount++;

      await this.saveQueueToStorage();
      this.updateQueueState();

      console.log(`[OfflineSyncQueueManager] Item marked as failed: ${itemId}`);
    } catch (error) {
      console.error('[OfflineSyncQueueManager] Failed to mark item as failed:', error);
    }
  }

  /**
   * キュー全体をフラッシュ完了
   */
  async completeQueueFlush(processedCount: number): Promise<void> {
    try {
      // フラッシュ完了イベント発火
      this.queueFlushCompleted$.next(processedCount);

      console.log(
        `[OfflineSyncQueueManager] Queue flush completed: ${processedCount} items processed`
      );
    } catch (error) {
      console.error('[OfflineSyncQueueManager] Failed to complete queue flush:', error);
    }
  }

  /**
   * キューの統計を取得
   */
  getQueueStatistics(): {
    totalItems: number;
    pendingItems: number;
    failedItems: number;
    inProgressItems: number;
    syncedItems: number;
  } {
    return {
      totalItems: this.queue.length,
      pendingItems: this.queue.filter((i) => i.status === 'pending').length,
      failedItems: this.queue.filter((i) => i.status === 'failed').length,
      inProgressItems: this.queue.filter((i) => i.status === 'in_progress').length,
      syncedItems: this.queue.filter((i) => i.status === 'synced').length,
    };
  }

  /**
   * キューをプリオリティでソート
   */
  private sortByPriority(): void {
    this.queue.sort((a, b) => {
      // 優先度: delete > update > create > quest操作
      const priorityMap: Record<string, number> = {
        delete: 4,
        update: 3,
        create: 2,
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
  }

  /**
   * キューの状態を更新
   */
  private updateQueueState(): void {
    const state: OfflineQueueState = {
      isQueueing: this.queue.length > 0,
      queueSize: this.queue.length,
      pendingOperations: this.getPendingOperationsCount(),
      estimatedSyncTime: this.getEstimatedSyncTime(),
    };

    this.queueState$.next(state);
  }

  /**
   * キューを AsyncStorage に保存
   */
  private async saveQueueToStorage(): Promise<void> {
    try {
      const queueJson = JSON.stringify(this.queue);
      await AsyncStorage.setItem(this.OFFLINE_QUEUE_KEY, queueJson);
    } catch (error) {
      console.error('[OfflineSyncQueueManager] Failed to save queue:', error);
      throw error;
    }
  }

  /**
   * AsyncStorage からキューを読み込み
   */
  private async loadQueueFromStorage(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(this.OFFLINE_QUEUE_KEY);
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
      console.error('[OfflineSyncQueueManager] Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * シングルトンリセット（テスト用）
   */
  static resetInstance(): void {
    OfflineSyncQueueManager.instance = null as any;
  }
}

/**
 * グローバル OfflineSyncQueueManager インスタンス取得
 */
export function getOfflineSyncQueueManager(): OfflineSyncQueueManager {
  return OfflineSyncQueueManager.getInstance();
}

/**
 * SyncManager
 * ローカル↔リモートのデータ同期を管理するサービス
 *
 * 責務:
 * - オフライン時の操作をキューに保存
 * - ネットワーク復旧時に自動同期
 * - リモート変更をローカルに取得
 * - 競合解決（サーバー優先）
 * - 同期状態の管理
 */

import { BehaviorSubject, Subject, interval, Subscription } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalDataSource } from '@/core/data/datasources/LocalDataSource';
import { RemoteDataSource } from '@/core/data/datasources/RemoteDataSource';
import {
  SyncQueueItem,
  SyncResult,
  SyncStatistics,
  SyncConflict,
  SyncState,
  EntityType,
  SyncQueueItemType,
} from '@/core/domain/entities/SyncQueue';
import { Goal, Quest, QuestLog, Milestone } from '@/core/domain/entities';
import { BackgroundSyncManager } from './BackgroundSyncManager';
import { getOfflineSyncQueueHandler } from './OfflineSyncQueueHandler';
import { getConflictResolver } from './ConflictResolver';

/**
 * SyncManager クラス
 * グローバル状態管理とリトライロジックを含む
 */
export class SyncManager {
  private static instance: SyncManager;

  // データソース
  private localDataSource: LocalDataSource;
  private remoteDataSource: RemoteDataSource;

  // バックグラウンド同期マネージャー
  private backgroundSyncManager: BackgroundSyncManager;

  // 競合解決マネージャー
  private conflictResolver: any; // ConflictResolver (動的に取得)

  // 状態管理
  private syncState$ = new BehaviorSubject<SyncState>({
    isOnline: true,
    isSyncing: false,
    lastSyncAt: null,
    nextSyncAt: null,
    pendingCount: 0,
    failedCount: 0,
    syncError: null,
  });

  // イベントストリーム
  private syncCompleted$ = new Subject<SyncResult>();
  private syncStarted$ = new Subject<void>();
  private syncError$ = new Subject<{ error: string; itemId?: string }>();
  private conflictDetected$ = new Subject<SyncConflict>();
  private onlineStatusChanged$ = new Subject<boolean>();

  // リソース管理
  private subscriptions = new Subscription();
  private destroy$ = new Subject<void>();
  private syncTimer: NodeJS.Timeout | null = null;

  // リトライ設定
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000; // 1秒
  private readonly SYNC_INTERVAL_MS = 5000; // 5秒（デバウンス）
  private readonly BACKGROUND_SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15分

  // キャッシュ
  private syncQueueCache: Map<string, SyncQueueItem> = new Map();
  private conflictCache: Map<string, SyncConflict> = new Map();

  private constructor() {
    this.localDataSource = LocalDataSource.getInstance();
    
    // RemoteDataSourceの初期化（環境変数から設定を取得）
    this.remoteDataSource = RemoteDataSource.getInstance({
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    });
    
    this.backgroundSyncManager = BackgroundSyncManager.getInstance();
  }

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * 初期化処理
   */
  async initialize(): Promise<void> {
    console.log('[SyncManager] Initializing...');

    try {
      // ネットワーク状態のリスナー設定
      this.setupNetworkListener();

      // 同期キューをロード
      await this.loadSyncQueue();

      // 最終同期時刻をリストア
      const lastSync = await AsyncStorage.getItem('last_sync_at');
      if (lastSync) {
        const state = this.syncState$.getValue();
        state.lastSyncAt = new Date(lastSync);
        this.syncState$.next(state);
      }

      // バックグラウンド同期マネージャーを初期化
      await this.backgroundSyncManager.initialize();

      // バックグラウンド同期タスクを登録
      await this.backgroundSyncManager.registerBackgroundSync();

      // 競合解決マネージャーを初期化
      this.conflictResolver = await getConflictResolver();

      console.log('[SyncManager] Initialized successfully');
    } catch (error) {
      console.error('[SyncManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * ネットワーク状態のリスナーを設定
   */
  private setupNetworkListener(): void {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected === true && state.isInternetReachable === true;
      const currentState = this.syncState$.getValue();

      if (isOnline !== currentState.isOnline) {
        console.log(`[SyncManager] Network status changed: ${isOnline ? 'online' : 'offline'}`);

        currentState.isOnline = isOnline;
        this.syncState$.next(currentState);
        this.onlineStatusChanged$.next(isOnline);

        // オンラインになった場合は同期開始
        if (isOnline) {
          this.scheduleSync(0); // すぐに同期
        }
      }
    });

    // クリーンアップ時にリスナー削除
    this.subscriptions.add(() => unsubscribe());
  }

  /**
   * 同期をスケジュール（デバウンス）
   */
  private scheduleSync(delayMs: number = this.SYNC_INTERVAL_MS): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    const state = this.syncState$.getValue();
    state.nextSyncAt = new Date(Date.now() + delayMs);
    this.syncState$.next(state);

    this.syncTimer = setTimeout(async () => {
      await this.sync();
    }, delayMs);
  }

  /**
   * 操作をキューに追加（ローカル変更）
   */
  async queueOperation(
    operation: SyncQueueItemType,
    entityType: EntityType,
    entityId: string,
    payload: Record<string, any>
  ): Promise<string> {
    console.log(`[SyncManager] Queueing operation: ${operation} on ${entityType}/${entityId}`);

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

    // キャッシュに追加
    this.syncQueueCache.set(item.id, item);

    // ローカルストレージに保存
    await this.saveSyncQueueItem(item);

    // 同期キューの統計を更新
    await this.updateSyncStatistics();

    // 同期をスケジュール
    if (this.syncState$.getValue().isOnline) {
      this.scheduleSync();
    }

    return item.id;
  }

  /**
   * メイン同期処理
   */
  private async sync(): Promise<number> {
    const state = this.syncState$.getValue();

    // 既に同期中、またはオフライン状態の場合はスキップ
    if (state.isSyncing || !state.isOnline) {
      return 0;
    }

    let syncedCount = 0;

    try {
      console.log('[SyncManager] Sync started');
      state.isSyncing = true;
      state.syncError = null;
      this.syncState$.next(state);
      this.syncStarted$.next();

      // 1. ローカル変更をリモートに送信
      syncedCount = await this.syncLocalChanges();

      // 2. リモート変更をローカルに取得
      await this.syncRemoteChanges();

      // 3. 最終同期時刻を更新
      const now = new Date();
      state.lastSyncAt = now;
      await AsyncStorage.setItem('last_sync_at', now.toISOString());

      // 4. 統計情報を更新
      await this.updateSyncStatistics();

      state.isSyncing = false;
      state.syncError = null;
      this.syncState$.next(state);

      console.log(`[SyncManager] Sync completed successfully: ${syncedCount} items synced`);
      
      return syncedCount;
    } catch (error) {
      console.error('[SyncManager] Sync failed:', error);

      state.isSyncing = false;
      state.syncError = error instanceof Error ? error.message : 'Unknown error';
      this.syncState$.next(state);

      this.syncError$.next({
        error: state.syncError,
      });
      
      return syncedCount;
    }
  }

  /**
   * ローカル変更をリモートに送信
   */
  private async syncLocalChanges(): Promise<number> {
    console.log('[SyncManager] Syncing local changes...');

    const queueItems = Array.from(this.syncQueueCache.values()).filter(
      (item) => item.status === 'pending' || (item.status === 'failed' && item.retryCount < this.MAX_RETRIES)
    );

    let syncedCount = 0;
    for (const item of queueItems) {
      const success = await this.syncQueueItem(item);
      if (success) {
        syncedCount++;
      }
    }

    return syncedCount;
  }

  /**
   * キューアイテムを同期
   */
  private async syncQueueItem(item: SyncQueueItem): Promise<boolean> {
    try {
      console.log(`[SyncManager] Syncing item ${item.id}: ${item.operation}`);

      // ステータスを in_progress に更新
      item.status = 'in_progress';
      await this.saveSyncQueueItem(item);

      // リモートに送信
      const result = await this.sendToRemote(item);

      if (result.success) {
        // ローカルの is_synced フラグを更新
        await this.markAsSynced(item.entityType, item.entityId);

        // キューから削除
        item.status = 'synced';
        await this.removeSyncQueueItem(item.id);
        this.syncQueueCache.delete(item.id);

        this.syncCompleted$.next(result);
        return true;
      } else if (result.conflicted) {
        // 競合を検出
        console.warn(`[SyncManager] Conflict detected for item ${item.id}`);
        item.lastError = 'Conflict detected';
        await this.saveSyncQueueItem(item);

        this.conflictDetected$.next({
          id: `conflict-${item.id}`,
          itemId: item.id,
          entityType: item.entityType,
          entityId: item.entityId,
          localData: item.payload,
          remoteData: {}, // リモートデータはサーバーから取得済み
          localUpdatedAt: item.createdAt,
          remoteUpdatedAt: new Date(),
          resolvedAt: null,
          resolution: null,
        });
        return false;
      } else {
        // エラー：リトライ可能か判定
        item.retryCount++;
        item.lastError = result.error || 'Unknown error';

        if (item.retryCount < this.MAX_RETRIES) {
          item.status = 'pending';
          await this.saveSyncQueueItem(item);
          console.log(`[SyncManager] Retrying item ${item.id} (attempt ${item.retryCount}/${this.MAX_RETRIES})`);
        } else {
          item.status = 'failed';
          await this.saveSyncQueueItem(item);
          console.error(`[SyncManager] Item ${item.id} failed after ${this.MAX_RETRIES} retries`);
        }

        this.syncError$.next({
          error: item.lastError,
          itemId: item.id,
        });
        return false;
      }
    } catch (error) {
      console.error(`[SyncManager] Error syncing item ${item.id}:`, error);

      item.retryCount++;
      item.lastError = error instanceof Error ? error.message : 'Unknown error';

      if (item.retryCount < this.MAX_RETRIES) {
        item.status = 'pending';
      } else {
        item.status = 'failed';
      }

      await this.saveSyncQueueItem(item);
      return false;
    }
  }

  /**
   * アイテムをリモートに送信
   */
  private async sendToRemote(item: SyncQueueItem): Promise<SyncResult> {
    try {
      switch (item.operation) {
        case 'create':
        case 'update':
          return await this.remoteDataSource.upsertEntity(
            item.entityType,
            item.entityId,
            item.payload
          );

        case 'delete':
          return await this.remoteDataSource.deleteEntity(item.entityType, item.entityId);

        case 'complete_quest':
        case 'skip_quest':
        case 'obstruct_quest':
          return await this.remoteDataSource.submitQuestStatus(
            item.entityId,
            item.operation,
            item.payload
          );

        default:
          return {
            success: false,
            itemId: item.id,
            error: `Unknown operation: ${item.operation}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        itemId: item.id,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * リモート変更をローカルに取得
   */
  private async syncRemoteChanges(): Promise<void> {
    console.log('[SyncManager] Syncing remote changes...');

    try {
      const lastSync = this.syncState$.getValue().lastSyncAt;
      const changedData = await this.remoteDataSource.getChangedData(lastSync);

      for (const [entityType, items] of Object.entries(changedData)) {
        for (const remoteItem of items as any[]) {
          await this.mergeRemoteEntity(entityType as EntityType, remoteItem);
        }
      }

      console.log('[SyncManager] Remote changes synced');
    } catch (error) {
      console.error('[SyncManager] Failed to sync remote changes:', error);
      throw error;
    }
  }

  /**
   * リモートエンティティをマージ（サーバー優先）
   */
  private async mergeRemoteEntity(entityType: EntityType, remoteData: any): Promise<void> {
    try {
      // ローカルデータを取得
      const localData = await this.localDataSource.getEntity(entityType, remoteData.id);

      if (localData) {
        // 競合チェック：ローカルが更新されている場合
        if (new Date(localData.updated_at) > new Date(remoteData.updated_at)) {
          // サーバー優先で上書き
          console.log(`[SyncManager] Conflict resolved (server wins) for ${entityType}/${remoteData.id}`);
        }
      }

      // ローカルデータベースに保存（サーバー優先）
      await this.localDataSource.upsertEntity(entityType, remoteData.id, remoteData);
    } catch (error) {
      console.error(`[SyncManager] Failed to merge remote entity ${entityType}/${remoteData.id}:`, error);
      throw error;
    }
  }

  /**
   * エンティティを is_synced でマーク
   */
  private async markAsSynced(entityType: EntityType, entityId: string): Promise<void> {
    await this.localDataSource.updateEntity(entityType, entityId, {
      is_synced: 1,
    });
  }

  /**
   * 同期キューをロード
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const items = await this.localDataSource.getSyncQueue();
      this.syncQueueCache.clear();

      for (const item of items) {
        this.syncQueueCache.set(item.id, item);
      }

      console.log(`[SyncManager] Loaded ${items.length} items from sync queue`);
    } catch (error) {
      console.error('[SyncManager] Failed to load sync queue:', error);
      throw error;
    }
  }

  /**
   * 同期キューアイテムを保存
   */
  private async saveSyncQueueItem(item: SyncQueueItem): Promise<void> {
    await this.localDataSource.saveSyncQueueItem(item);
  }

  /**
   * 同期キューアイテムを削除
   */
  private async removeSyncQueueItem(itemId: string): Promise<void> {
    await this.localDataSource.removeSyncQueueItem(itemId);
  }

  /**
   * 同期統計情報を更新
   */
  private async updateSyncStatistics(): Promise<void> {
    const state = this.syncState$.getValue();
    const items = Array.from(this.syncQueueCache.values());

    state.pendingCount = items.filter((item) => item.status === 'pending').length;
    state.failedCount = items.filter((item) => item.status === 'failed').length;

    this.syncState$.next(state);
  }

  /**
   * 同期統計を取得
   */
  getSyncStatistics(): SyncStatistics {
    const state = this.syncState$.getValue();
    const items = Array.from(this.syncQueueCache.values());

    return {
      totalItems: items.length,
      pendingItems: items.filter((item) => item.status === 'pending').length,
      failedItems: items.filter((item) => item.status === 'failed').length,
      lastSyncAt: state.lastSyncAt,
      nextSyncAt: state.nextSyncAt,
      isOnline: state.isOnline,
      isSyncing: state.isSyncing,
    };
  }

  /**
   * 同期状態を購読
   */
  getSyncState$() {
    return this.syncState$.asObservable();
  }

  /**
   * 同期完了イベントを購読
   */
  getSyncCompleted$() {
    return this.syncCompleted$.asObservable();
  }

  /**
   * 同期開始イベントを購読
   */
  getSyncStarted$() {
    return this.syncStarted$.asObservable();
  }

  /**
   * 同期エラーイベントを購読
   */
  getSyncError$() {
    return this.syncError$.asObservable();
  }

  /**
   * 競合検出イベントを購読
   */
  getConflictDetected$() {
    return this.conflictDetected$.asObservable();
  }

  /**
   * オンラインステータス変更イベントを購読
   */
  getOnlineStatusChanged$() {
    return this.onlineStatusChanged$.asObservable();
  }

  /**
   * 手動同期を実行
   */
  async syncNow(): Promise<{ syncedCount: number }> {
    if (!this.syncState$.getValue().isOnline) {
      throw new Error('Cannot sync while offline');
    }

    // デバウンスをキャンセル
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }

    const syncedCount = await this.sync();
    return { syncedCount };
  }

  /**
   * クリーンアップ
   */
  async destroy(): Promise<void> {
    console.log('[SyncManager] Destroying...');

    try {
      // バックグラウンド同期マネージャーを破棄
      await this.backgroundSyncManager.destroy();

      // 競合解決マネージャーはクリーンアップ不要（静的なデータストア）
      // ただし、メモリ参照をクリア
      this.conflictResolver = null;

      this.destroy$.next();
      this.destroy$.complete();
      this.subscriptions.unsubscribe();

      if (this.syncTimer) {
        clearTimeout(this.syncTimer);
      }

      SyncManager.instance = null as any;
    } catch (error) {
      console.error('[SyncManager] Destruction failed:', error);
    }
  }
}

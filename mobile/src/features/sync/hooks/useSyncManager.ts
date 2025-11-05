/**
 * useSyncManager Hook
 * React コンポーネントで SyncManager を簡単に使用できるようにするフック
 *
 * 責務:
 * - SyncManager の状態を React 状態に変換
 * - イベント購読管理
 * - メモリリーク防止
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Subscription } from 'rxjs';
import { SyncManager } from '../services/SyncManager';
import {
  SyncState,
  SyncStatistics,
  SyncQueueItem,
  SyncConflict,
} from '@/core/domain/entities/SyncQueue';

/**
 * useSyncManager Hook
 * SyncManager の状態とメソッドを React コンポーネントで使用
 */
export const useSyncManager = () => {
  const syncManagerRef = useRef<SyncManager | null>(null);
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: true,
    isSyncing: false,
    lastSyncAt: null,
    nextSyncAt: null,
    pendingCount: 0,
    failedCount: 0,
    syncError: null,
  });
  const [syncStats, setSyncStats] = useState<SyncStatistics>({
    totalItems: 0,
    pendingItems: 0,
    failedItems: 0,
    lastSyncAt: null,
    nextSyncAt: null,
    isOnline: true,
    isSyncing: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const subscriptionsRef = useRef<Subscription[]>([]);

  // SyncManager 初期化
  useEffect(() => {
    const initSyncManager = async () => {
      try {
        const syncManager = SyncManager.getInstance();
        await syncManager.initialize();
        syncManagerRef.current = syncManager;

        // 状態を購読
        const stateSubscription = syncManager.getSyncState$().subscribe((state) => {
          setSyncState(state);
          setSyncStats(syncManager.getSyncStatistics());
        });
        subscriptionsRef.current.push(stateSubscription);

        // 初期状態を設定
        setSyncStats(syncManager.getSyncStatistics());
        setIsInitialized(true);

        console.log('[useSyncManager] Initialized');
      } catch (error) {
        console.error('[useSyncManager] Failed to initialize:', error);
      }
    };

    initSyncManager();

    return () => {
      // クリーンアップ
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      if (syncManagerRef.current) {
        // destroy は async ですが、effect のクリーンアップ関数内では await できないため
        // バックグラウンドで実行
        syncManagerRef.current.destroy().catch((error) => {
          console.error('[useSyncManager] Cleanup failed:', error);
        });
      }
    };
  }, []);

  // 操作をキューに追加
  const queueOperation = useCallback(
    async (operation: any, entityType: any, entityId: string, payload: Record<string, any>) => {
      if (!syncManagerRef.current) {
        throw new Error('SyncManager not initialized');
      }

      return await syncManagerRef.current.queueOperation(operation, entityType, entityId, payload);
    },
    []
  );

  // 手動同期
  const syncNow = useCallback(async () => {
    if (!syncManagerRef.current) {
      throw new Error('SyncManager not initialized');
    }

    return await syncManagerRef.current.syncNow();
  }, []);

  // 同期完了イベント購読
  const onSyncCompleted = useCallback((callback: (result: any) => void) => {
    if (!syncManagerRef.current) return () => {};

    const subscription = syncManagerRef.current.getSyncCompleted$().subscribe(callback);
    subscriptionsRef.current.push(subscription);

    return () => {
      subscription.unsubscribe();
      const index = subscriptionsRef.current.indexOf(subscription);
      if (index > -1) {
        subscriptionsRef.current.splice(index, 1);
      }
    };
  }, []);

  // 同期エラーイベント購読
  const onSyncError = useCallback((callback: (error: any) => void) => {
    if (!syncManagerRef.current) return () => {};

    const subscription = syncManagerRef.current.getSyncError$().subscribe(callback);
    subscriptionsRef.current.push(subscription);

    return () => {
      subscription.unsubscribe();
      const index = subscriptionsRef.current.indexOf(subscription);
      if (index > -1) {
        subscriptionsRef.current.splice(index, 1);
      }
    };
  }, []);

  // 競合検出イベント購読
  const onConflictDetected = useCallback((callback: (conflict: SyncConflict) => void) => {
    if (!syncManagerRef.current) return () => {};

    const subscription = syncManagerRef.current.getConflictDetected$().subscribe(callback);
    subscriptionsRef.current.push(subscription);

    return () => {
      subscription.unsubscribe();
      const index = subscriptionsRef.current.indexOf(subscription);
      if (index > -1) {
        subscriptionsRef.current.splice(index, 1);
      }
    };
  }, []);

  // オンラインステータス変更イベント購読
  const onOnlineStatusChanged = useCallback((callback: (isOnline: boolean) => void) => {
    if (!syncManagerRef.current) return () => {};

    const subscription = syncManagerRef.current.getOnlineStatusChanged$().subscribe(callback);
    subscriptionsRef.current.push(subscription);

    return () => {
      subscription.unsubscribe();
      const index = subscriptionsRef.current.indexOf(subscription);
      if (index > -1) {
        subscriptionsRef.current.splice(index, 1);
      }
    };
  }, []);

  return {
    isInitialized,
    syncState,
    syncStats,
    queueOperation,
    syncNow,
    onSyncCompleted,
    onSyncError,
    onConflictDetected,
    onOnlineStatusChanged,
  };
};

/**
 * useSyncState Hook
 * 同期状態のみが必要な場合に使用
 */
export const useSyncState = () => {
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: true,
    isSyncing: false,
    lastSyncAt: null,
    nextSyncAt: null,
    pendingCount: 0,
    failedCount: 0,
    syncError: null,
  });

  useEffect(() => {
    const syncManager = SyncManager.getInstance();
    const subscription = syncManager.getSyncState$().subscribe(setSyncState);

    return () => subscription.unsubscribe();
  }, []);

  return syncState;
};

/**
 * useSyncStatistics Hook
 * 同期統計のみが必要な場合に使用
 */
export const useSyncStatistics = () => {
  const [stats, setStats] = useState<SyncStatistics>({
    totalItems: 0,
    pendingItems: 0,
    failedItems: 0,
    lastSyncAt: null,
    nextSyncAt: null,
    isOnline: true,
    isSyncing: false,
  });

  useEffect(() => {
    const syncManager = SyncManager.getInstance();

    const updateStats = () => {
      setStats(syncManager.getSyncStatistics());
    };

    // 初期統計を設定
    updateStats();

    // 状態変更時に統計を更新
    const subscription = syncManager.getSyncState$().subscribe(updateStats);

    return () => subscription.unsubscribe();
  }, []);

  return stats;
};

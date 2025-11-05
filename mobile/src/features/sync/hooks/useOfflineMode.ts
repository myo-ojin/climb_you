/**
 * useOfflineMode Hook
 * Reactコンポーネント内でオフラインモード状態を管理するカスタムフック
 *
 * 責務:
 * - オフラインモード状態の取得
 * - オフラインデータの取得
 * - オフラインモード変更イベントの購読
 * - メモリリーク防止
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Subscription } from 'rxjs';
import {
  OfflineDataProvider,
  OfflineModeState,
  OfflineCacheStats,
  OfflineFeatures,
} from '../services/OfflineDataProvider';
import {
  Goal,
  Quest,
  QuestLog,
  Milestone,
  UserProgress,
  Streak,
} from '@/core/domain/entities';

/**
 * useOfflineMode Hook
 * オフラインモード状態と機能を提供
 */
export const useOfflineMode = () => {
  const providerRef = useRef<OfflineDataProvider | null>(null);
  const [offlineState, setOfflineState] = useState<OfflineModeState>({
    isOnline: true,
    isChecking: true,
    lastOnlineAt: null,
    allowedFeatures: {
      viewGoals: true,
      viewMilestones: true,
      viewQuests: true,
      viewQuestLogs: true,
      viewProgress: true,
      recordQuestCompletion: true,
      recordQuestSkip: true,
      recordQuestObstruction: true,
      uploadEvidence: false,
    },
  });

  const [cacheStats, setCacheStats] = useState<OfflineCacheStats>({
    goalsCount: 0,
    milestonesCount: 0,
    questsCount: 0,
    questLogsCount: 0,
    queuedOperationsCount: 0,
    estimatedStorageSize: 0,
    lastSyncAt: null,
  });

  const subscriptionsRef = useRef<Subscription[]>([]);

  // 初期化
  useEffect(() => {
    const initOfflineMode = async () => {
      try {
        const provider = OfflineDataProvider.getInstance();
        await provider.initialize();
        providerRef.current = provider;

        // 状態を購読
        const stateSubscription = provider.getState$().subscribe((state) => {
          setOfflineState(state);
        });
        subscriptionsRef.current.push(stateSubscription);

        // キャッシュ統計を更新
        const stats = await provider.getCacheStats();
        setCacheStats(stats);

        console.log('[useOfflineMode] Initialized');
      } catch (error) {
        console.error('[useOfflineMode] Failed to initialize:', error);
      }
    };

    initOfflineMode();

    return () => {
      // クリーンアップ
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    };
  }, []);

  // キャッシュ統計を更新
  const refreshCacheStats = useCallback(async () => {
    if (!providerRef.current) {
      throw new Error('OfflineDataProvider not initialized');
    }

    const stats = await providerRef.current.getCacheStats();
    setCacheStats(stats);
  }, []);

  // オンライン状態を確認
  const isOnline = useCallback((): boolean => {
    if (!providerRef.current) {
      return true;
    }
    return providerRef.current.isOnline();
  }, []);

  // 機能がオフラインで利用可能かチェック
  const isFeatureAvailable = useCallback((feature: keyof OfflineFeatures): boolean => {
    if (!providerRef.current) {
      return false;
    }
    return providerRef.current.isFeatureAvailableOffline(feature);
  }, []);

  // ローカルから目標を取得
  const getGoalsOffline = useCallback(async (): Promise<Goal[]> => {
    if (!providerRef.current) {
      throw new Error('OfflineDataProvider not initialized');
    }
    return await providerRef.current.getGoalsFromLocal();
  }, []);

  // ローカルから合目を取得
  const getMilestonesOffline = useCallback(async (goalId: string): Promise<Milestone[]> => {
    if (!providerRef.current) {
      throw new Error('OfflineDataProvider not initialized');
    }
    return await providerRef.current.getMilestonesFromLocal(goalId);
  }, []);

  // ローカルから今日のクエストを取得
  const getTodayQuestsOffline = useCallback(async (): Promise<Quest[]> => {
    if (!providerRef.current) {
      throw new Error('OfflineDataProvider not initialized');
    }
    return await providerRef.current.getTodayQuestsFromLocal();
  }, []);

  // ローカルから過去のクエストを取得
  const getPastQuestsOffline = useCallback(async (days?: number): Promise<Quest[]> => {
    if (!providerRef.current) {
      throw new Error('OfflineDataProvider not initialized');
    }
    return await providerRef.current.getPastQuestsFromLocal(days);
  }, []);

  // ローカルからクエストログを取得
  const getQuestLogsOffline = useCallback(async (days?: number): Promise<QuestLog[]> => {
    if (!providerRef.current) {
      throw new Error('OfflineDataProvider not initialized');
    }
    return await providerRef.current.getQuestLogsFromLocal(days);
  }, []);

  // ローカルから進捗を取得
  const getProgressOffline = useCallback(async (): Promise<UserProgress | null> => {
    if (!providerRef.current) {
      throw new Error('OfflineDataProvider not initialized');
    }
    return await providerRef.current.getProgressFromLocal();
  }, []);

  // ローカルからストリークを取得
  const getStreakOffline = useCallback(async (): Promise<Streak | null> => {
    if (!providerRef.current) {
      throw new Error('OfflineDataProvider not initialized');
    }
    return await providerRef.current.getStreakFromLocal();
  }, []);

  // クエストログをローカルに保存
  const saveQuestLogOffline = useCallback(async (questLog: QuestLog): Promise<string> => {
    if (!providerRef.current) {
      throw new Error('OfflineDataProvider not initialized');
    }
    return await providerRef.current.saveQuestLogOffline(questLog);
  }, []);

  // クエストをローカルに保存
  const saveQuestOffline = useCallback(async (quest: Quest): Promise<string> => {
    if (!providerRef.current) {
      throw new Error('OfflineDataProvider not initialized');
    }
    return await providerRef.current.saveQuestOffline(quest);
  }, []);

  // オフラインモード変更イベントを購読
  const onOfflineModeChanged = useCallback(
    (callback: (state: OfflineModeState) => void) => {
      if (!providerRef.current) return () => {};

      const subscription = providerRef.current.getOfflineModeChanged$().subscribe(callback);
      subscriptionsRef.current.push(subscription);

      return () => {
        subscription.unsubscribe();
        const index = subscriptionsRef.current.indexOf(subscription);
        if (index > -1) {
          subscriptionsRef.current.splice(index, 1);
        }
      };
    },
    []
  );

  // オフラインになったイベントを購読
  const onGoingOffline = useCallback((callback: () => void) => {
    if (!providerRef.current) return () => {};

    const subscription = providerRef.current.getGoingOffline$().subscribe(callback);
    subscriptionsRef.current.push(subscription);

    return () => {
      subscription.unsubscribe();
      const index = subscriptionsRef.current.indexOf(subscription);
      if (index > -1) {
        subscriptionsRef.current.splice(index, 1);
      }
    };
  }, []);

  // オンラインになったイベントを購読
  const onGoingOnline = useCallback((callback: () => void) => {
    if (!providerRef.current) return () => {};

    const subscription = providerRef.current.getGoingOnline$().subscribe(callback);
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
    // 状態
    offlineState,
    cacheStats,
    isOnline,
    isFeatureAvailable,

    // データ取得
    getGoalsOffline,
    getMilestonesOffline,
    getTodayQuestsOffline,
    getPastQuestsOffline,
    getQuestLogsOffline,
    getProgressOffline,
    getStreakOffline,

    // データ保存
    saveQuestLogOffline,
    saveQuestOffline,

    // イベント購読
    onOfflineModeChanged,
    onGoingOffline,
    onGoingOnline,

    // ユーティリティ
    refreshCacheStats,
  };
};

/**
 * useOfflineState Hook
 * オフラインモード状態のみが必要な場合に使用
 */
export const useOfflineState = () => {
  const [offlineState, setOfflineState] = useState<OfflineModeState>({
    isOnline: true,
    isChecking: true,
    lastOnlineAt: null,
    allowedFeatures: {
      viewGoals: true,
      viewMilestones: true,
      viewQuests: true,
      viewQuestLogs: true,
      viewProgress: true,
      recordQuestCompletion: true,
      recordQuestSkip: true,
      recordQuestObstruction: true,
      uploadEvidence: false,
    },
  });

  useEffect(() => {
    const provider = OfflineDataProvider.getInstance();
    const subscription = provider.getState$().subscribe(setOfflineState);

    return () => subscription.unsubscribe();
  }, []);

  return offlineState;
};

/**
 * useOfflineCacheStats Hook
 * オフラインキャッシュ統計のみが必要な場合に使用
 */
export const useOfflineCacheStats = () => {
  const [stats, setStats] = useState<OfflineCacheStats>({
    goalsCount: 0,
    milestonesCount: 0,
    questsCount: 0,
    questLogsCount: 0,
    queuedOperationsCount: 0,
    estimatedStorageSize: 0,
    lastSyncAt: null,
  });

  useEffect(() => {
    const provider = OfflineDataProvider.getInstance();

    const updateStats = async () => {
      const newStats = await provider.getCacheStats();
      setStats(newStats);
    };

    // 初期統計を設定
    updateStats();

    // 状態変更時に統計を更新
    const subscription = provider.getState$().subscribe(updateStats);

    return () => subscription.unsubscribe();
  }, []);

  return stats;
};

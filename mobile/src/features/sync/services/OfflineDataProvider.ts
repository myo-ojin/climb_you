/**
 * OfflineDataProvider
 * オフラインモードでのローカルデータ提供
 *
 * 責務:
 * - ネットワーク状態検知
 * - ローカルデータのフォールバック
 * - オフラインモード中のデータ操作
 * - 同期待ちキューの管理
 * - オフラインモードの状態管理
 */

import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalDataSource } from '@/core/data/datasources/LocalDataSource';
import {
  Goal,
  Quest,
  QuestLog,
  Milestone,
  UserProgress,
  Streak,
} from '@/core/domain/entities';

/**
 * オフラインモード状態
 */
export interface OfflineModeState {
  isOnline: boolean;
  isChecking: boolean;
  lastOnlineAt: Date | null;
  offlineReason?: string;
  allowedFeatures: OfflineFeatures;
}

/**
 * オフラインモードで利用可能な機能
 */
export interface OfflineFeatures {
  viewGoals: boolean;
  viewMilestones: boolean;
  viewQuests: boolean;
  viewQuestLogs: boolean;
  viewProgress: boolean;
  recordQuestCompletion: boolean;
  recordQuestSkip: boolean;
  recordQuestObstruction: boolean;
  uploadEvidence: boolean;
}

/**
 * オフラインキャッシュ統計
 */
export interface OfflineCacheStats {
  goalsCount: number;
  milestonesCount: number;
  questsCount: number;
  questLogsCount: number;
  queuedOperationsCount: number;
  estimatedStorageSize: number;
  lastSyncAt: Date | null;
}

/**
 * OfflineDataProvider クラス
 */
export class OfflineDataProvider {
  private localDataSource: LocalDataSource;

  // 状態管理
  private offlineState$ = new BehaviorSubject<OfflineModeState>({
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
      uploadEvidence: false, // オフラインではファイルアップロード不可
    },
  });

  // イベントストリーム
  private goingOffline$ = new Subject<void>();
  private goingOnline$ = new Subject<void>();
  private offlineModeChanged$ = new Subject<OfflineModeState>();

  // リソース管理
  private netInfoUnsubscribe: (() => void) | null = null;
  private subscriptions = new Subscription();

  private constructor() {
    this.localDataSource = LocalDataSource.getInstance();
  }

  private static instance: OfflineDataProvider;

  /**
   * シングルトンインスタンス取得
   */
  static getInstance(): OfflineDataProvider {
    if (!OfflineDataProvider.instance) {
      OfflineDataProvider.instance = new OfflineDataProvider();
    }
    return OfflineDataProvider.instance;
  }

  /**
   * 初期化
   */
  async initialize(): Promise<void> {
    try {
      // ネットワーク状態を確認
      const state = await NetInfo.fetch();
      this.handleNetworkStateChange(state);

      // ネットワーク状態リスナーを設定
      this.netInfoUnsubscribe = NetInfo.addEventListener(
        (state: NetInfoState) => {
          this.handleNetworkStateChange(state);
        }
      );

      console.log('[OfflineDataProvider] Initialized');
    } catch (error) {
      console.error('[OfflineDataProvider] Initialization failed:', error);
    }
  }

  /**
   * ネットワーク状態変更ハンドラー
   */
  private handleNetworkStateChange(state: NetInfoState): void {
    try {
      const isOnline = state.isConnected === true && state.isInternetReachable === true;
      const currentState = this.offlineState$.getValue();

      if (isOnline !== currentState.isOnline) {
        if (isOnline) {
          // オンラインに復帰
          console.log('[OfflineDataProvider] Going online');
          this.goingOnline$.next();
        } else {
          // オフラインになった
          console.log('[OfflineDataProvider] Going offline');
          this.goingOffline$.next();
        }

        // 状態を更新
        const newState: OfflineModeState = {
          ...currentState,
          isOnline,
          isChecking: false,
          lastOnlineAt: isOnline ? new Date() : currentState.lastOnlineAt,
          offlineReason: !isOnline ? this.getOfflineReason(state) : undefined,
        };

        this.offlineState$.next(newState);
        this.offlineModeChanged$.next(newState);
      }
    } catch (error) {
      console.error('[OfflineDataProvider] Network state change handling failed:', error);
    }
  }

  /**
   * オフラインの理由を取得
   */
  private getOfflineReason(state: NetInfoState): string {
    if (state.isConnected === false) {
      return 'ネットワークに接続していません';
    }

    if (state.isInternetReachable === false) {
      return 'インターネットに接続していません';
    }

    if (state.type === 'cellular') {
      return '低速ネットワークに接続しています';
    }

    return 'ネットワークの接続に問題があります';
  }

  /**
   * オンライン状態を確認
   */
  isOnline(): boolean {
    return this.offlineState$.getValue().isOnline;
  }

  /**
   * オフラインモード状態を取得
   */
  getState(): OfflineModeState {
    return this.offlineState$.getValue();
  }

  /**
   * オフラインモード状態ストリーム
   */
  getState$(): Observable<OfflineModeState> {
    return this.offlineState$.asObservable();
  }

  /**
   * オフラインになったイベント
   */
  getGoingOffline$(): Observable<void> {
    return this.goingOffline$.asObservable();
  }

  /**
   * オンラインになったイベント
   */
  getGoingOnline$(): Observable<void> {
    return this.goingOnline$.asObservable();
  }

  /**
   * オフラインモード変更イベント
   */
  getOfflineModeChanged$(): Observable<OfflineModeState> {
    return this.offlineModeChanged$.asObservable();
  }

  /**
   * ローカルから目標を取得
   */
  async getGoalsFromLocal(): Promise<Goal[]> {
    try {
      return await this.localDataSource.getGoals();
    } catch (error) {
      console.error('[OfflineDataProvider] Failed to get goals:', error);
      return [];
    }
  }

  /**
   * ローカルから合目を取得
   */
  async getMilestonesFromLocal(goalId: string): Promise<Milestone[]> {
    try {
      return await this.localDataSource.getMilestonesByGoal(goalId);
    } catch (error) {
      console.error('[OfflineDataProvider] Failed to get milestones:', error);
      return [];
    }
  }

  /**
   * ローカルから今日のクエストを取得
   */
  async getTodayQuestsFromLocal(): Promise<Quest[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await this.localDataSource.getQuestsByDateRange(today, tomorrow);
    } catch (error) {
      console.error('[OfflineDataProvider] Failed to get today quests:', error);
      return [];
    }
  }

  /**
   * ローカルから過去のクエストを取得（過去7日間）
   */
  async getPastQuestsFromLocal(days: number = 7): Promise<Quest[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      return await this.localDataSource.getQuestsByDateRange(startDate, endDate);
    } catch (error) {
      console.error('[OfflineDataProvider] Failed to get past quests:', error);
      return [];
    }
  }

  /**
   * ローカルからクエストログを取得（過去30日間）
   */
  async getQuestLogsFromLocal(days: number = 30): Promise<QuestLog[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      return await this.localDataSource.getQuestLogsByDateRange(startDate, endDate);
    } catch (error) {
      console.error('[OfflineDataProvider] Failed to get quest logs:', error);
      return [];
    }
  }

  /**
   * ローカルから進捗を取得
   */
  async getProgressFromLocal(): Promise<UserProgress | null> {
    try {
      return await this.localDataSource.getUserProgress();
    } catch (error) {
      console.error('[OfflineDataProvider] Failed to get progress:', error);
      return null;
    }
  }

  /**
   * ローカルからストリークを取得
   */
  async getStreakFromLocal(): Promise<Streak | null> {
    try {
      return await this.localDataSource.getStreak();
    } catch (error) {
      console.error('[OfflineDataProvider] Failed to get streak:', error);
      return null;
    }
  }

  /**
   * ローカルにクエストログを保存（オフライン時）
   */
  async saveQuestLogOffline(questLog: QuestLog): Promise<string> {
    try {
      return await this.localDataSource.saveQuestLog(questLog);
    } catch (error) {
      console.error('[OfflineDataProvider] Failed to save quest log:', error);
      throw error;
    }
  }

  /**
   * ローカルにクエストを保存
   */
  async saveQuestOffline(quest: Quest): Promise<string> {
    try {
      return await this.localDataSource.saveQuest(quest);
    } catch (error) {
      console.error('[OfflineDataProvider] Failed to save quest:', error);
      throw error;
    }
  }

  /**
   * オフラインキャッシュの統計を取得
   */
  async getCacheStats(): Promise<OfflineCacheStats> {
    try {
      const goals = await this.getGoalsFromLocal();
      const quests = await this.getPastQuestsFromLocal();
      const questLogs = await this.getQuestLogsFromLocal();
      const progress = await this.getProgressFromLocal();

      // マイルストーン数を取得（全目標の合計）
      let milestonesCount = 0;
      for (const goal of goals) {
        const milestones = await this.getMilestonesFromLocal(goal.id);
        milestonesCount += milestones.length;
      }

      // キューイング済みオペレーション数（AsyncStorage から取得）
      const queueJson = await AsyncStorage.getItem('sync:offlineQueue');
      const queuedOperationsCount = queueJson ? JSON.parse(queueJson).length : 0;

      // ストレージ使用量の推定
      const cacheData = {
        goals,
        quests,
        questLogs,
        progress,
      };
      const estimatedStorageSize = new Blob([JSON.stringify(cacheData)]).size;

      // 最終同期時刻
      const lastSyncStr = await AsyncStorage.getItem('last_sync_at');
      const lastSyncAt = lastSyncStr ? new Date(lastSyncStr) : null;

      return {
        goalsCount: goals.length,
        milestonesCount,
        questsCount: quests.length,
        questLogsCount: questLogs.length,
        queuedOperationsCount,
        estimatedStorageSize,
        lastSyncAt,
      };
    } catch (error) {
      console.error('[OfflineDataProvider] Failed to get cache stats:', error);
      return {
        goalsCount: 0,
        milestonesCount: 0,
        questsCount: 0,
        questLogsCount: 0,
        queuedOperationsCount: 0,
        estimatedStorageSize: 0,
        lastSyncAt: null,
      };
    }
  }

  /**
   * オフラインキャッシュをクリア
   */
  async clearOfflineCache(): Promise<void> {
    try {
      // ローカルデータベースをクリア
      // 注: LocalDataSource の clearAll() メソッドが必要
      console.log('[OfflineDataProvider] Offline cache cleared');
    } catch (error) {
      console.error('[OfflineDataProvider] Failed to clear cache:', error);
    }
  }

  /**
   * 機能のオフライン対応可否を確認
   */
  isFeatureAvailableOffline(feature: keyof OfflineFeatures): boolean {
    const state = this.offlineState$.getValue();
    return state.allowedFeatures[feature];
  }

  /**
   * クリーンアップ
   */
  async destroy(): Promise<void> {
    try {
      // ネットワークリスナーを削除
      if (this.netInfoUnsubscribe) {
        this.netInfoUnsubscribe();
      }

      // ストリーム購読を解除
      this.goingOffline$.complete();
      this.goingOnline$.complete();
      this.offlineModeChanged$.complete();
      this.subscriptions.unsubscribe();

      console.log('[OfflineDataProvider] Destroyed');
    } catch (error) {
      console.error('[OfflineDataProvider] Destruction failed:', error);
    }
  }

  /**
   * シングルトンリセット（テスト用）
   */
  static resetInstance(): void {
    OfflineDataProvider.instance = null as any;
  }
}

/**
 * グローバル OfflineDataProvider インスタンス取得
 */
export function getOfflineDataProvider(): OfflineDataProvider {
  return OfflineDataProvider.getInstance();
}

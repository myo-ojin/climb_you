/**
 * BackgroundSyncManager
 * バックグラウンド同期タスクのライフサイクル管理
 *
 * 責務:
 * - バックグラウンド同期タスク登録・解除
 * - デバイス設定変更の監視（低電力モード等）
 * - 初期化・クリーンアップ
 * - 同期タスク状態の追跡
 */

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import {
  registerBackgroundSyncTask,
  unregisterBackgroundSyncTask,
  getLastBackgroundSyncTime,
  getBackgroundSyncLogs,
  BackgroundSyncTaskLog,
} from './BackgroundSyncTask';

/**
 * バックグラウンド同期マネージャー状態
 */
export interface BackgroundSyncManagerState {
  isInitialized: boolean;
  isRegistered: boolean;
  isLowPowerMode: boolean;
  isNetworkAvailable: boolean;
  lastBackgroundSyncAt: number | null;
  lastBackgroundSyncStatus: 'success' | 'failure' | 'skipped' | null;
}

/**
 * BackgroundSyncManager シングルトンクラス
 */
export class BackgroundSyncManager {
  private static instance: BackgroundSyncManager | null = null;

  // 状態管理
  private state$ = new BehaviorSubject<BackgroundSyncManagerState>({
    isInitialized: false,
    isRegistered: false,
    isLowPowerMode: false,
    isNetworkAvailable: true,
    lastBackgroundSyncAt: null,
    lastBackgroundSyncStatus: null,
  });

  // イベントストリーム
  private taskStarted$ = new Subject<void>();
  private taskCompleted$ = new Subject<BackgroundSyncTaskLog>();
  private taskFailed$ = new Subject<{ error: Error; timestamp: number }>();
  private lowPowerModeChanged$ = new Subject<boolean>();

  // ネットワーク状態リスナー
  private netInfoUnsubscribe: (() => void) | null = null;

  /**
   * シングルトンインスタンス取得
   */
  public static getInstance(): BackgroundSyncManager {
    if (!BackgroundSyncManager.instance) {
      BackgroundSyncManager.instance = new BackgroundSyncManager();
    }
    return BackgroundSyncManager.instance;
  }

  /**
   * 初期化
   */
  async initialize(): Promise<void> {
    try {
      const currentState = this.state$.getValue();
      if (currentState.isInitialized) {
        console.log('[BackgroundSyncManager] Already initialized');
        return;
      }

      // 最後のバックグラウンド同期時刻を取得
      const lastSyncAt = await getLastBackgroundSyncTime();
      const syncLogs = await getBackgroundSyncLogs(1);
      const lastStatus = syncLogs.length > 0 ? syncLogs[0].status : null;

      // ネットワーク状態リスナー設定
      this.netInfoUnsubscribe = NetInfo.addEventListener(
        (state: NetInfoState) => {
          this.handleNetworkStateChange(state);
        }
      );

      // 低電力モード状態を読み込み
      const lowPowerModeStr = await AsyncStorage.getItem('device:lowPowerMode');
      const isLowPowerMode = lowPowerModeStr === 'true';

      // 状態を更新
      this.state$.next({
        isInitialized: true,
        isRegistered: false,
        isLowPowerMode,
        isNetworkAvailable: true,
        lastBackgroundSyncAt: lastSyncAt,
        lastBackgroundSyncStatus: lastStatus as any,
      });

      console.log('[BackgroundSyncManager] Initialized');
    } catch (error) {
      console.error('[BackgroundSyncManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * バックグラウンド同期タスク登録
   */
  async registerBackgroundSync(): Promise<void> {
    try {
      const currentState = this.state$.getValue();
      if (currentState.isRegistered) {
        console.log('[BackgroundSyncManager] Already registered');
        return;
      }

      // タスク登録
      await registerBackgroundSyncTask();

      // 状態を更新
      this.state$.next({
        ...currentState,
        isRegistered: true,
      });

      console.log('[BackgroundSyncManager] Background sync registered');
    } catch (error) {
      console.error('[BackgroundSyncManager] Registration failed:', error);
      throw error;
    }
  }

  /**
   * バックグラウンド同期タスク登録解除
   */
  async unregisterBackgroundSync(): Promise<void> {
    try {
      const currentState = this.state$.getValue();
      if (!currentState.isRegistered) {
        console.log('[BackgroundSyncManager] Not registered');
        return;
      }

      // タスク登録解除
      await unregisterBackgroundSyncTask();

      // 状態を更新
      this.state$.next({
        ...currentState,
        isRegistered: false,
      });

      console.log('[BackgroundSyncManager] Background sync unregistered');
    } catch (error) {
      console.error('[BackgroundSyncManager] Unregistration failed:', error);
      throw error;
    }
  }

  /**
   * ネットワーク状態変更ハンドラー
   */
  private handleNetworkStateChange(state: NetInfoState): void {
    const isOnline = state.isInternetReachable ?? false;
    const currentState = this.state$.getValue();

    if (currentState.isNetworkAvailable !== isOnline) {
      this.state$.next({
        ...currentState,
        isNetworkAvailable: isOnline,
      });

      console.log(`[BackgroundSyncManager] Network status: ${isOnline ? 'online' : 'offline'}`);
    }
  }

  /**
   * 低電力モード設定
   */
  async setLowPowerMode(enabled: boolean): Promise<void> {
    try {
      const currentState = this.state$.getValue();

      if (currentState.isLowPowerMode !== enabled) {
        // AsyncStorage に保存
        await AsyncStorage.setItem('device:lowPowerMode', String(enabled));

        // 状態を更新
        this.state$.next({
          ...currentState,
          isLowPowerMode: enabled,
        });

        // イベント発火
        this.lowPowerModeChanged$.next(enabled);

        console.log(`[BackgroundSyncManager] Low power mode: ${enabled}`);
      }
    } catch (error) {
      console.error('[BackgroundSyncManager] Failed to set low power mode:', error);
    }
  }

  /**
   * 最後のバックグラウンド同期時刻更新
   */
  async updateLastSyncTime(timestamp: number, status: 'success' | 'failure' | 'skipped'): Promise<void> {
    try {
      const currentState = this.state$.getValue();

      this.state$.next({
        ...currentState,
        lastBackgroundSyncAt: timestamp,
        lastBackgroundSyncStatus: status,
      });

      console.log(`[BackgroundSyncManager] Last sync updated: ${new Date(timestamp).toISOString()}`);
    } catch (error) {
      console.error('[BackgroundSyncManager] Failed to update sync time:', error);
    }
  }

  /**
   * 状態取得ストリーム
   */
  getState$(): Observable<BackgroundSyncManagerState> {
    return this.state$.asObservable();
  }

  /**
   * 現在の状態を取得
   */
  getState(): BackgroundSyncManagerState {
    return this.state$.getValue();
  }

  /**
   * タスク開始イベントストリーム
   */
  getTaskStarted$(): Observable<void> {
    return this.taskStarted$.asObservable();
  }

  /**
   * タスク完了イベントストリーム
   */
  getTaskCompleted$(): Observable<BackgroundSyncTaskLog> {
    return this.taskCompleted$.asObservable();
  }

  /**
   * タスク失敗イベントストリーム
   */
  getTaskFailed$(): Observable<{ error: Error; timestamp: number }> {
    return this.taskFailed$.asObservable();
  }

  /**
   * 低電力モード変更イベントストリーム
   */
  getLowPowerModeChanged$(): Observable<boolean> {
    return this.lowPowerModeChanged$.asObservable();
  }

  /**
   * 直近のバックグラウンド同期ログ取得
   */
  async getRecentLogs(limit: number = 10): Promise<BackgroundSyncTaskLog[]> {
    try {
      return await getBackgroundSyncLogs(limit);
    } catch (error) {
      console.error('[BackgroundSyncManager] Failed to get logs:', error);
      return [];
    }
  }

  /**
   * クリーンアップ・破棄
   */
  async destroy(): Promise<void> {
    try {
      // ネットワークリスナー登録解除
      if (this.netInfoUnsubscribe) {
        this.netInfoUnsubscribe();
      }

      // バックグラウンド同期登録解除
      const state = this.state$.getValue();
      if (state.isRegistered) {
        await this.unregisterBackgroundSync();
      }

      // ストリーム購読解除
      this.taskStarted$.complete();
      this.taskCompleted$.complete();
      this.taskFailed$.complete();
      this.lowPowerModeChanged$.complete();

      // 状態をリセット
      this.state$.next({
        isInitialized: false,
        isRegistered: false,
        isLowPowerMode: false,
        isNetworkAvailable: true,
        lastBackgroundSyncAt: null,
        lastBackgroundSyncStatus: null,
      });

      console.log('[BackgroundSyncManager] Destroyed');
    } catch (error) {
      console.error('[BackgroundSyncManager] Destruction failed:', error);
    }
  }

  /**
   * シングルトンリセット（テスト用）
   */
  static resetInstance(): void {
    BackgroundSyncManager.instance = null;
  }
}

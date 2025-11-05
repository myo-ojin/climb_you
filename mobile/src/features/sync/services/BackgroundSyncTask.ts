/**
 * BackgroundSyncTask
 * Expo background fetch タスク定義
 *
 * 責務:
 * - バックグラウンド同期タスクの定義
 * - expo-background-fetch タスクの登録・実行
 * - タスク実行結果のログ記録
 * - 低電力モードの検出
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { SyncManager } from './SyncManager';

/**
 * バックグラウンド同期タスク定義
 */
const BACKGROUND_SYNC_TASK_NAME = 'ClimbYouBackgroundSync';

/**
 * バックグラウンド同期タスク実行ログの型定義
 */
export interface BackgroundSyncTaskLog {
  id: string;
  timestamp: number;
  status: 'success' | 'failure' | 'skipped';
  reason?: string;
  itemsSynced?: number;
  errorMessage?: string;
  duration?: number;
  isLowPower?: boolean;
  isOnline?: boolean;
}

/**
 * バックグラウンド同期タスクの登録と実行
 */
export const registerBackgroundSyncTask = async (): Promise<void> => {
  try {
    // タスクが既に登録されているか確認
    const isTaskDefined = TaskManager.isTaskDefined(BACKGROUND_SYNC_TASK_NAME);
    if (!isTaskDefined) {
      // タスク定義
      TaskManager.defineTask(
        BACKGROUND_SYNC_TASK_NAME,
        async () => {
          return await executeBackgroundSync();
        }
      );
    }

    // バックグラウンド fetch タスク登録
    // 最小間隔: 15分（900秒）
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK_NAME, {
      minimumInterval: 15 * 60, // 15分（秒単位）
      stopOnTerminate: false, // アプリ終了後も実行継続
      startOnBoot: true, // デバイス起動時に実行開始
    });

    console.log('[BackgroundSyncTask] Registered successfully');
  } catch (error) {
    console.error('[BackgroundSyncTask] Registration failed:', error);
  }
};

/**
 * バックグラウンド同期タスクの登録解除
 */
export const unregisterBackgroundSyncTask = async (): Promise<void> => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK_NAME);
    console.log('[BackgroundSyncTask] Unregistered successfully');
  } catch (error) {
    console.error('[BackgroundSyncTask] Unregistration failed:', error);
  }
};

/**
 * バックグラウンド同期実行
 */
export const executeBackgroundSync = async (): Promise<BackgroundFetch.BackgroundFetchResult> => {
  const startTime = Date.now();
  const taskLog: BackgroundSyncTaskLog = {
    id: `bg-sync-${Date.now()}`,
    timestamp: startTime,
    status: 'skipped',
    isLowPower: false,
    isOnline: true,
  };

  try {
    // 低電力モード確認
    const batteryState = await getBatteryState();
    taskLog.isLowPower = batteryState.lowPowerMode;

    // 低電力モード中はスキップ
    if (batteryState.lowPowerMode) {
      taskLog.status = 'skipped';
      taskLog.reason = 'Low power mode enabled';
      await logBackgroundSyncTask(taskLog);
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // オンライン状態確認
    const netState = await NetInfo.fetch();
    taskLog.isOnline = netState.isInternetReachable ?? false;

    // オフライン中はスキップ
    if (!taskLog.isOnline) {
      taskLog.status = 'skipped';
      taskLog.reason = 'Device is offline';
      await logBackgroundSyncTask(taskLog);
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // SyncManager インスタンス取得
    const syncManager = SyncManager.getInstance();

    // 同期実行
    const syncResult = await syncManager.syncNow();

    taskLog.status = 'success';
    taskLog.itemsSynced = syncResult.syncedCount || 0;
    taskLog.duration = Date.now() - startTime;

    // ログ記録
    await logBackgroundSyncTask(taskLog);

    console.log(
      `[BackgroundSyncTask] Sync completed: ${taskLog.itemsSynced} items synced in ${taskLog.duration}ms`
    );

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    taskLog.status = 'failure';
    taskLog.errorMessage = error instanceof Error ? error.message : String(error);
    taskLog.duration = Date.now() - startTime;

    console.error('[BackgroundSyncTask] Sync failed:', error);

    // ログ記録
    await logBackgroundSyncTask(taskLog);

    // バックグラウンド fetch フレームワークに失敗を報告
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
};

/**
 * バッテリー状態取得
 */
async function getBatteryState(): Promise<{
  level: number;
  lowPowerMode: boolean;
}> {
  try {
    // Expo では Battery API を使用できない
    // ただし、AsyncStorage に保存されたデバイス設定から確認可能
    const lowPowerMode = await AsyncStorage.getItem('device:lowPowerMode');
    return {
      level: 100,
      lowPowerMode: lowPowerMode === 'true',
    };
  } catch (error) {
    console.error('[BackgroundSyncTask] Failed to get battery state:', error);
    return {
      level: 100,
      lowPowerMode: false,
    };
  }
}

/**
 * バックグラウンド同期タスクログ記録
 */
async function logBackgroundSyncTask(log: BackgroundSyncTaskLog): Promise<void> {
  try {
    // 既存のログ履歴を取得
    const existingLogs = await AsyncStorage.getItem('backgroundSyncLogs');
    const logs: BackgroundSyncTaskLog[] = existingLogs
      ? JSON.parse(existingLogs)
      : [];

    // 新しいログを追加
    logs.push(log);

    // 最新100件のログのみ保持（ストレージ節約）
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }

    // AsyncStorage に保存
    await AsyncStorage.setItem('backgroundSyncLogs', JSON.stringify(logs));

    // 最終同期時刻を更新
    if (log.status === 'success') {
      await AsyncStorage.setItem('lastBackgroundSyncAt', String(log.timestamp));
    }

    console.log(`[BackgroundSyncTask] Log recorded: ${log.id}`);
  } catch (error) {
    console.error('[BackgroundSyncTask] Failed to log task:', error);
  }
}

/**
 * バックグラウンド同期ログ履歴取得
 */
export async function getBackgroundSyncLogs(limit: number = 10): Promise<BackgroundSyncTaskLog[]> {
  try {
    const logs = await AsyncStorage.getItem('backgroundSyncLogs');
    if (!logs) {
      return [];
    }

    const allLogs: BackgroundSyncTaskLog[] = JSON.parse(logs);
    return allLogs.slice(-limit);
  } catch (error) {
    console.error('[BackgroundSyncTask] Failed to retrieve logs:', error);
    return [];
  }
}

/**
 * 最後のバックグラウンド同期時刻取得
 */
export async function getLastBackgroundSyncTime(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem('lastBackgroundSyncAt');
    return timestamp ? Number(timestamp) : null;
  } catch (error) {
    console.error('[BackgroundSyncTask] Failed to get last sync time:', error);
    return null;
  }
}

/**
 * バックグラウンド同期ログをクリア
 */
export async function clearBackgroundSyncLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem('backgroundSyncLogs');
    console.log('[BackgroundSyncTask] Logs cleared');
  } catch (error) {
    console.error('[BackgroundSyncTask] Failed to clear logs:', error);
  }
}

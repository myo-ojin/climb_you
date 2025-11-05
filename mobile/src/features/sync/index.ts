/**
 * Sync Feature
 * データ同期とオフライン対応の機能モジュール
 *
 * エクスポート:
 * - SyncManager: メイン同期マネージャー
 * - BackgroundSyncManager: バックグラウンド同期マネージャー
 * - ConflictResolver: 競合解決エンジン
 * - OfflineDataProvider: オフラインデータ提供者
 * - OfflineSyncQueueManager: オフラインキュー管理
 *
 * - useSyncManager: フル機能フック
 * - useSyncState: 同期状態フック
 * - useSyncStatistics: 同期統計フック
 * - useOfflineMode: オフラインモードフック
 * - useOfflineState: オフラインモード状態フック
 * - useOfflineCacheStats: オフラインキャッシュ統計フック
 *
 * - 型定義（Sync, Conflict, Offline）
 */

// Services
export { SyncManager } from './services/SyncManager';
export { BackgroundSyncManager } from './services/BackgroundSyncManager';
export { ConflictResolver, getConflictResolver, resetConflictResolver } from './services/ConflictResolver';
export { OfflineDataProvider, getOfflineDataProvider } from './services/OfflineDataProvider';
export {
  OfflineSyncQueueManager,
  getOfflineSyncQueueManager,
} from './services/OfflineSyncQueueManager';
export {
  registerBackgroundSyncTask,
  unregisterBackgroundSyncTask,
  executeBackgroundSync,
  getBackgroundSyncLogs,
  getLastBackgroundSyncTime,
  clearBackgroundSyncLogs,
} from './services/BackgroundSyncTask';
export {
  OfflineSyncQueueHandler,
  getOfflineSyncQueueHandler,
  resetOfflineSyncQueueHandler,
} from './services/OfflineSyncQueueHandler';

// Hooks
export { useSyncManager, useSyncState, useSyncStatistics } from './hooks/useSyncManager';
export {
  useOfflineMode,
  useOfflineState,
  useOfflineCacheStats,
} from './hooks/useOfflineMode';

// Types - Sync
export type {
  SyncQueueItem,
  SyncResult,
  SyncStatistics,
  SyncConflict,
  SyncState,
  SyncQueueItemType,
  EntityType,
} from '@/core/domain/entities/SyncQueue';

// Types - Conflict
export type { ConflictDetails, ConflictBackup, ConflictStatistics } from './services/ConflictResolver';

// Types - Background Sync
export type { BackgroundSyncTaskLog } from './services/BackgroundSyncTask';
export type { BackgroundSyncManagerState } from './services/BackgroundSyncManager';

// Types - Offline
export type {
  OfflineModeState,
  OfflineFeatures,
  OfflineCacheStats,
} from './services/OfflineDataProvider';
export type { OfflineQueueState } from './services/OfflineSyncQueueManager';
export type { OfflineQueueStats } from './services/OfflineSyncQueueHandler';

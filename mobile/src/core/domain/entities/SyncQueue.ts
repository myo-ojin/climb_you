/**
 * SyncQueue Entity
 * オフライン時の操作をキューに保存し、ネットワーク復旧時に同期
 *
 * 責務:
 * - オフライン時の操作をセリアライズ
 * - 同期待ちキューの管理
 * - 同期順序の管理（FIFO）
 */

export type SyncQueueItemType =
  | 'create'
  | 'update'
  | 'delete'
  | 'complete_quest'
  | 'skip_quest'
  | 'obstruct_quest';

export type EntityType =
  | 'goal'
  | 'milestone'
  | 'quest'
  | 'quest_log'
  | 'user_progress'
  | 'streak';

/**
 * 同期待ちキューのアイテム
 */
export interface SyncQueueItem {
  id: string;
  operation: SyncQueueItemType;
  entityType: EntityType;
  entityId: string;
  payload: Record<string, any>;
  createdAt: Date;
  retryCount: number;
  lastError: string | null;
  status: 'pending' | 'in_progress' | 'failed' | 'synced';
}

/**
 * 同期操作の結果
 */
export interface SyncResult {
  success: boolean;
  itemId: string;
  error?: string;
  conflicted?: boolean;
  syncedAt?: Date;
}

/**
 * 同期統計情報
 */
export interface SyncStatistics {
  totalItems: number;
  pendingItems: number;
  failedItems: number;
  lastSyncAt: Date | null;
  nextSyncAt: Date | null;
  isOnline: boolean;
  isSyncing: boolean;
}

/**
 * 競合データ
 */
export interface SyncConflict {
  id: string;
  itemId: string;
  entityType: EntityType;
  entityId: string;
  localData: Record<string, any>;
  remoteData: Record<string, any>;
  localUpdatedAt: Date;
  remoteUpdatedAt: Date;
  resolvedAt: Date | null;
  resolution: 'server' | 'local' | 'manual' | null;
}

/**
 * 同期状態
 */
export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  nextSyncAt: Date | null;
  pendingCount: number;
  failedCount: number;
  syncError: string | null;
}

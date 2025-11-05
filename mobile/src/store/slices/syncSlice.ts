/**
 * Sync Slice
 * 同期状態のグローバル管理（Redux Toolkit）
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SyncState, SyncStatistics } from '@/core/domain/entities/SyncQueue';

/**
 * 同期状態の型定義（グローバルstore用）
 */
export interface GlobalSyncState {
  // ネットワーク状態
  isOnline: boolean;

  // 同期状態
  isSyncing: boolean;
  lastSyncAt: Date | null;
  nextSyncAt: Date | null;

  // 同期キュー統計
  pendingCount: number;
  failedCount: number;
  syncError: string | null;

  // バックグラウンド同期
  backgroundSyncEnabled: boolean;
  lastBackgroundSyncAt: Date | null;
}

/**
 * 初期状態
 */
const initialState: GlobalSyncState = {
  isOnline: true,
  isSyncing: false,
  lastSyncAt: null,
  nextSyncAt: null,
  pendingCount: 0,
  failedCount: 0,
  syncError: null,
  backgroundSyncEnabled: true,
  lastBackgroundSyncAt: null,
};

/**
 * Sync Slice
 */
const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    /**
     * オンライン状態を更新
     */
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },

    /**
     * 同期開始
     */
    syncStarted: (state) => {
      state.isSyncing = true;
      state.syncError = null;
    },

    /**
     * 同期完了
     */
    syncCompleted: (state, action: PayloadAction<{ syncedCount: number }>) => {
      state.isSyncing = false;
      state.lastSyncAt = new Date();
      state.nextSyncAt = null;
      state.syncError = null;
    },

    /**
     * 同期失敗
     */
    syncFailed: (state, action: PayloadAction<{ error: string }>) => {
      state.isSyncing = false;
      state.syncError = action.payload.error;
    },

    /**
     * 同期スケジュール更新
     */
    setSyncSchedule: (state, action: PayloadAction<{ nextSyncAt: Date }>) => {
      state.nextSyncAt = action.payload.nextSyncAt;
    },

    /**
     * 同期キュー統計を更新
     */
    updateSyncStatistics: (
      state,
      action: PayloadAction<{ pendingCount: number; failedCount: number }>
    ) => {
      state.pendingCount = action.payload.pendingCount;
      state.failedCount = action.payload.failedCount;
    },

    /**
     * バックグラウンド同期の有効/無効を切り替え
     */
    toggleBackgroundSync: (state, action: PayloadAction<boolean>) => {
      state.backgroundSyncEnabled = action.payload;
    },

    /**
     * バックグラウンド同期完了時刻を更新
     */
    setLastBackgroundSyncAt: (state, action: PayloadAction<Date>) => {
      state.lastBackgroundSyncAt = action.payload;
    },

    /**
     * 同期エラーをクリア
     */
    clearSyncError: (state) => {
      state.syncError = null;
    },

    /**
     * 同期状態をリセット
     */
    resetSyncState: (state) => {
      state.isSyncing = false;
      state.lastSyncAt = null;
      state.nextSyncAt = null;
      state.pendingCount = 0;
      state.failedCount = 0;
      state.syncError = null;
    },
  },
});

/**
 * Actions
 */
export const {
  setOnlineStatus,
  syncStarted,
  syncCompleted,
  syncFailed,
  setSyncSchedule,
  updateSyncStatistics,
  toggleBackgroundSync,
  setLastBackgroundSyncAt,
  clearSyncError,
  resetSyncState,
} = syncSlice.actions;

/**
 * Selectors
 */
export const selectIsOnline = (state: { sync: GlobalSyncState }) => state.sync.isOnline;
export const selectIsSyncing = (state: { sync: GlobalSyncState }) => state.sync.isSyncing;
export const selectLastSyncAt = (state: { sync: GlobalSyncState }) => state.sync.lastSyncAt;
export const selectNextSyncAt = (state: { sync: GlobalSyncState }) => state.sync.nextSyncAt;
export const selectPendingCount = (state: { sync: GlobalSyncState }) => state.sync.pendingCount;
export const selectFailedCount = (state: { sync: GlobalSyncState }) => state.sync.failedCount;
export const selectSyncError = (state: { sync: GlobalSyncState }) => state.sync.syncError;
export const selectBackgroundSyncEnabled = (state: { sync: GlobalSyncState }) =>
  state.sync.backgroundSyncEnabled;

/**
 * Reducer
 */
export default syncSlice.reducer;

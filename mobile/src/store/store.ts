/**
 * Redux Store Configuration
 * アプリケーション全体の状態管理
 */

import { configureStore } from '@reduxjs/toolkit';
import { authReducer, questReducer, syncReducer } from './slices';

/**
 * Redux Store
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    quest: questReducer,
    sync: syncReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Date オブジェクトなどのシリアライズ不可能な値を許可
        ignoredActions: [
          'auth/login/fulfilled',
          'auth/restoreSession/fulfilled',
          'quest/fetchTodayQuests/fulfilled',
          'sync/syncCompleted',
          'sync/setSyncSchedule',
          'sync/setLastBackgroundSyncAt',
        ],
        ignoredPaths: [
          'auth.user.createdAt',
          'auth.user.updatedAt',
          'quest.questBundleGeneratedAt',
          'quest.questBundleValidUntil',
          'quest.lastFetchedAt',
          'sync.lastSyncAt',
          'sync.nextSyncAt',
          'sync.lastBackgroundSyncAt',
        ],
      },
    }),
});

/**
 * 型定義
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

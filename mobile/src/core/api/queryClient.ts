/**
 * React Query Client Configuration
 * ネットワークリクエストの最適化とキャッシング戦略
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * デフォルトのクエリオプション
 */
const defaultQueryOptions = {
  queries: {
    /**
     * キャッシュ時間: 5分
     * データが古くなるまでの時間
     */
    staleTime: 5 * 60 * 1000,

    /**
     * キャッシュ保持時間: 10分
     * 使用されていないキャッシュを保持する時間
     */
    gcTime: 10 * 60 * 1000,

    /**
     * リトライ回数: 3回
     */
    retry: 3,

    /**
     * リトライ遅延（指数バックオフ）
     */
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

    /**
     * ネットワークモード
     * - online: オンライン時のみ実行
     * - offlineFirst: オフラインでもキャッシュから返す
     * - always: 常に実行
     */
    networkMode: 'online' as const,

    /**
     * ウィンドウフォーカス時の再フェッチを無効化
     * モバイルアプリでは不要
     */
    refetchOnWindowFocus: false,

    /**
     * マウント時の再フェッチ
     * 古いデータの場合のみ再フェッチ
     */
    refetchOnMount: true,

    /**
     * ネットワーク再接続時の再フェッチ
     */
    refetchOnReconnect: true,
  },
  mutations: {
    /**
     * リトライなし（ミューテーションは冪等性がない可能性があるため）
     */
    retry: 0,

    /**
     * ネットワークモード
     */
    networkMode: 'online' as const,
  },
};

/**
 * QueryClientインスタンスを作成
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

/**
 * キャッシュキーのプレフィックス
 */
export const CACHE_KEYS = {
  // ユーザー関連
  USER: 'user',
  USER_PROFILE: 'user-profile',

  // 目標関連
  GOALS: 'goals',
  GOAL: 'goal',
  MILESTONES: 'milestones',
  MILESTONE: 'milestone',

  // クエスト関連
  QUESTS: 'quests',
  QUEST: 'quest',
  QUEST_BUNDLE: 'quest-bundle',
  QUEST_LOGS: 'quest-logs',

  // 進捗関連
  PROGRESS: 'progress',
  CLIMBING_PROGRESS: 'climbing-progress',
  STREAK: 'streak',

  // ランキング関連
  RANKING: 'ranking',
  LEADERBOARD: 'leaderboard',

  // 学習データ
  SUCCESS_PATTERNS: 'success-patterns',
  FAILURE_PATTERNS: 'failure-patterns',
} as const;

/**
 * キャッシュキーを生成するヘルパー関数
 */
export const generateCacheKey = (prefix: string, ...args: (string | number | undefined)[]) => {
  return [prefix, ...args.filter((arg) => arg !== undefined)];
};

/**
 * キャッシュを無効化
 */
export const invalidateQueries = async (queryKey: string | readonly unknown[]) => {
  await queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
};

/**
 * キャッシュをクリア
 */
export const clearCache = () => {
  queryClient.clear();
};

/**
 * 特定のクエリをプリフェッチ
 */
export const prefetchQuery = async <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
};

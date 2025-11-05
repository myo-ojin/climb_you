/**
 * useApiQuery Hook
 * React Queryのラッパーフック（自動キャンセル処理付き）
 *
 * 機能:
 * - 自動リクエストキャンセル（コンポーネントアンマウント時）
 * - キャッシング
 * - リトライ
 * - エラーハンドリング
 */

import { useQuery, UseQueryOptions, UseQueryResult, QueryKey } from '@tanstack/react-query';

/**
 * APIクエリオプション
 */
export interface ApiQueryOptions<TData, TError = Error>
  extends Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'> {
  /**
   * クエリキー
   */
  queryKey: QueryKey;

  /**
   * クエリ関数（AbortSignal付き）
   */
  queryFn: (signal?: AbortSignal) => Promise<TData>;

  /**
   * クエリを有効にするか（デフォルト: true）
   */
  enabled?: boolean;
}

/**
 * useApiQuery Hook
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useApiQuery({
 *   queryKey: ['quests', userId],
 *   queryFn: (signal) => fetchQuests(userId, signal),
 * });
 * ```
 */
export function useApiQuery<TData, TError = Error>({
  queryKey,
  queryFn,
  enabled = true,
  ...options
}: ApiQueryOptions<TData, TError>): UseQueryResult<TData, TError> {
  return useQuery<TData, TError, TData, QueryKey>({
    queryKey,
    queryFn: async ({ signal }) => {
      // AbortSignalを渡してリクエストキャンセル可能にする
      return await queryFn(signal);
    },
    enabled,
    ...options,
  });
}

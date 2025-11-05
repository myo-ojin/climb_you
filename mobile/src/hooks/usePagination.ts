/**
 * usePagination Hook
 * ページネーションとデータ読み込みを管理
 *
 * 機能:
 * - ページ単位のデータ読み込み
 * - 無限スクロールのサポート
 * - リフレッシュ機能
 * - ローディング状態の管理
 * - エラーハンドリング
 */

import { useState, useCallback, useRef } from 'react';

export interface PaginationOptions<T> {
  /**
   * データフェッチ関数
   * @param page ページ番号（1始まり）
   * @param limit ページサイズ
   * @returns データとメタ情報
   */
  fetchData: (
    page: number,
    limit: number
  ) => Promise<{
    data: T[];
    total: number;
    hasMore: boolean;
  }>;

  /**
   * ページサイズ（デフォルト: 20）
   */
  pageSize?: number;

  /**
   * 初期ページ（デフォルト: 1）
   */
  initialPage?: number;

  /**
   * 自動的に最初のページを読み込むか（デフォルト: true）
   */
  autoLoad?: boolean;

  /**
   * エラー時のコールバック
   */
  onError?: (error: Error) => void;
}

export interface PaginationResult<T> {
  /**
   * データ配列
   */
  data: T[];

  /**
   * 読み込み中かどうか
   */
  loading: boolean;

  /**
   * リフレッシュ中かどうか
   */
  refreshing: boolean;

  /**
   * エラー
   */
  error: Error | null;

  /**
   * 次のページがあるかどうか
   */
  hasMore: boolean;

  /**
   * 現在のページ
   */
  currentPage: number;

  /**
   * 総データ数
   */
  total: number;

  /**
   * 次のページを読み込む
   */
  loadMore: () => Promise<void>;

  /**
   * リフレッシュ（最初のページから再読み込み）
   */
  refresh: () => Promise<void>;

  /**
   * データをクリア
   */
  clear: () => void;

  /**
   * 特定のページに移動
   */
  goToPage: (page: number) => Promise<void>;
}

/**
 * usePagination Hook
 *
 * @example
 * ```tsx
 * function QuestListScreen() {
 *   const {
 *     data: quests,
 *     loading,
 *     hasMore,
 *     loadMore,
 *     refresh,
 *   } = usePagination({
 *     fetchData: async (page, limit) => {
 *       const response = await fetchQuests({ page, limit });
 *       return {
 *         data: response.quests,
 *         total: response.total,
 *         hasMore: response.hasMore,
 *       };
 *     },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <LazyList
 *       data={quests}
 *       renderItem={(quest) => <QuestCard quest={quest} />}
 *       onLoadMore={loadMore}
 *       onRefresh={refresh}
 *       hasMore={hasMore}
 *       loading={loading}
 *     />
 *   );
 * }
 * ```
 */
export function usePagination<T>({
  fetchData,
  pageSize = 20,
  initialPage = 1,
  autoLoad = true,
  onError,
}: PaginationOptions<T>): PaginationResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [total, setTotal] = useState(0);

  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  /**
   * データを読み込む
   */
  const loadData = useCallback(
    async (page: number, append: boolean = false) => {
      if (isLoadingRef.current) {
        console.log('[usePagination] Already loading, skipping');
        return;
      }

      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        console.log(`[usePagination] Loading page ${page}...`);

        const result = await fetchData(page, pageSize);

        setData((prevData) => (append ? [...prevData, ...result.data] : result.data));
        setHasMore(result.hasMore);
        setCurrentPage(page);
        setTotal(result.total);
        hasLoadedRef.current = true;

        console.log(
          `[usePagination] Loaded ${result.data.length} items (total: ${result.total}, hasMore: ${result.hasMore})`
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load data');
        setError(error);
        onError?.(error);
        console.error('[usePagination] Load failed:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        isLoadingRef.current = false;
      }
    },
    [fetchData, pageSize, onError]
  );

  /**
   * 次のページを読み込む
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || refreshing) {
      console.log('[usePagination] Cannot load more:', { hasMore, loading, refreshing });
      return;
    }

    const nextPage = currentPage + 1;
    await loadData(nextPage, true);
  }, [hasMore, loading, refreshing, currentPage, loadData]);

  /**
   * リフレッシュ（最初のページから再読み込み）
   */
  const refresh = useCallback(async () => {
    console.log('[usePagination] Refreshing...');
    setRefreshing(true);
    setHasMore(true);
    await loadData(initialPage, false);
  }, [loadData, initialPage]);

  /**
   * データをクリア
   */
  const clear = useCallback(() => {
    setData([]);
    setCurrentPage(initialPage);
    setHasMore(true);
    setTotal(0);
    setError(null);
    hasLoadedRef.current = false;
  }, [initialPage]);

  /**
   * 特定のページに移動
   */
  const goToPage = useCallback(
    async (page: number) => {
      if (page < 1) {
        console.warn('[usePagination] Invalid page number:', page);
        return;
      }

      console.log(`[usePagination] Going to page ${page}...`);
      await loadData(page, false);
    },
    [loadData]
  );

  /**
   * 初回読み込み
   */
  useState(() => {
    if (autoLoad && !hasLoadedRef.current) {
      loadData(initialPage, false);
    }
  });

  return {
    data,
    loading,
    refreshing,
    error,
    hasMore,
    currentPage,
    total,
    loadMore,
    refresh,
    clear,
    goToPage,
  };
}

/**
 * useInfiniteScroll Hook
 * 無限スクロール専用の簡易版
 *
 * @example
 * ```tsx
 * const { data, loadMore, refresh, hasMore, loading } = useInfiniteScroll({
 *   fetchData: fetchQuests,
 * });
 * ```
 */
export function useInfiniteScroll<T>(options: PaginationOptions<T>) {
  return usePagination<T>({
    ...options,
    autoLoad: true,
  });
}

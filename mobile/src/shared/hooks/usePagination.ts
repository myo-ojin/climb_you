/**
 * usePagination Hook
 * ページネーション処理を管理するカスタムフック
 *
 * 機能:
 * - ページ番号管理
 * - データ自動フェッチ
 * - ローディング・エラー状態管理
 * - 無限スクロール対応
 * - リフレッシュ対応
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ページネーションレスポンス
 */
export interface PaginatedResponse<T> {
  /**
   * データ配列
   */
  data: T[];

  /**
   * 現在のページ番号
   */
  currentPage: number;

  /**
   * 1ページあたりのアイテム数
   */
  pageSize: number;

  /**
   * 総アイテム数
   */
  totalItems: number;

  /**
   * 総ページ数
   */
  totalPages: number;

  /**
   * 次のページがあるか
   */
  hasMore: boolean;
}

/**
 * ページネーションオプション
 */
export interface PaginationOptions {
  /**
   * 初期ページ番号（デフォルト: 1）
   */
  initialPage?: number;

  /**
   * 1ページあたりのアイテム数（デフォルト: 20）
   */
  pageSize?: number;

  /**
   * 自動フェッチを有効にするか（デフォルト: true）
   */
  autoFetch?: boolean;

  /**
   * 依存配列（変更時にリセット＆再フェッチ）
   */
  deps?: readonly any[];
}

/**
 * ページネーション状態
 */
export interface PaginationState<T> {
  /**
   * 全データ（累積）
   */
  data: T[];

  /**
   * ローディング中か（初回のみ）
   */
  isLoading: boolean;

  /**
   * さらに読み込み中か
   */
  isLoadingMore: boolean;

  /**
   * リフレッシュ中か
   */
  isRefreshing: boolean;

  /**
   * エラー
   */
  error: Error | null;

  /**
   * 次のページがあるか
   */
  hasMore: boolean;

  /**
   * 現在のページ番号
   */
  currentPage: number;

  /**
   * さらに読み込む
   */
  loadMore: () => void;

  /**
   * リフレッシュ（最初から再読み込み）
   */
  refresh: () => void;

  /**
   * リセット
   */
  reset: () => void;
}

/**
 * フェッチ関数の型
 */
export type FetchFunction<T> = (
  page: number,
  pageSize: number
) => Promise<PaginatedResponse<T>>;

/**
 * usePagination Hook
 */
export function usePagination<T>(
  fetchFunction: FetchFunction<T>,
  options: PaginationOptions = {}
): PaginationState<T> {
  const {
    initialPage = 1,
    pageSize = 20,
    autoFetch = true,
    deps = [],
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  // フェッチ中フラグ（重複リクエスト防止）
  const isFetchingRef = useRef<boolean>(false);

  /**
   * データをフェッチ
   */
  const fetchData = useCallback(
    async (page: number, isRefresh: boolean = false) => {
      // 既にフェッチ中の場合はスキップ
      if (isFetchingRef.current) {
        return;
      }

      // これ以上データがない場合はスキップ
      if (!isRefresh && !hasMore && page > initialPage) {
        return;
      }

      try {
        isFetchingRef.current = true;

        // ローディング状態を設定
        if (page === initialPage) {
          if (isRefresh) {
            setIsRefreshing(true);
          } else {
            setIsLoading(true);
          }
        } else {
          setIsLoadingMore(true);
        }

        setError(null);

        // データをフェッチ
        const response = await fetchFunction(page, pageSize);

        // データを更新
        setData((prevData) => {
          if (page === initialPage) {
            // 初回またはリフレッシュ時は置き換え
            return response.data;
          } else {
            // 追加読み込み時は結合
            return [...prevData, ...response.data];
          }
        });

        setHasMore(response.hasMore);
        setCurrentPage(page);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Pagination fetch error:', error);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [fetchFunction, pageSize, hasMore, initialPage]
  );

  /**
   * さらに読み込む
   */
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchData(currentPage + 1, false);
    }
  }, [fetchData, currentPage, isLoadingMore, hasMore]);

  /**
   * リフレッシュ
   */
  const refresh = useCallback(() => {
    setData([]);
    setHasMore(true);
    setCurrentPage(initialPage);
    fetchData(initialPage, true);
  }, [fetchData, initialPage]);

  /**
   * リセット
   */
  const reset = useCallback(() => {
    setData([]);
    setIsLoading(false);
    setIsLoadingMore(false);
    setIsRefreshing(false);
    setError(null);
    setHasMore(true);
    setCurrentPage(initialPage);
  }, [initialPage]);

  /**
   * 初回フェッチまたは依存配列変更時
   */
  useEffect(() => {
    if (autoFetch) {
      reset();
      fetchData(initialPage, false);
    }
  }, [autoFetch, initialPage, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    currentPage,
    loadMore,
    refresh,
    reset,
  };
}

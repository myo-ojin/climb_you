/**
 * usePagination Hook ユニットテスト
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePagination, PaginatedResponse } from '../usePagination';

describe('usePagination', () => {
  // モックデータ
  const createMockData = (page: number, pageSize: number): string[] => {
    return Array.from({ length: pageSize }, (_, i) => `Item ${(page - 1) * pageSize + i + 1}`);
  };

  // モックフェッチ関数
  const createMockFetchFunction = (totalItems: number = 100) => {
    return jest.fn(async (page: number, pageSize: number): Promise<PaginatedResponse<string>> => {
      const data = createMockData(page, pageSize);
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasMore = page < totalPages;

      return {
        data,
        currentPage: page,
        pageSize,
        totalItems,
        totalPages,
        hasMore,
      };
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('初期化', () => {
    it('初期状態が正しく設定される', async () => {
      const fetchFunction = createMockFetchFunction();

      const { result } = renderHook(() =>
        usePagination(fetchFunction, { autoFetch: false })
      );

      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isLoadingMore).toBe(false);
      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.currentPage).toBe(1);
    });

    it('autoFetch=trueの場合、自動的にデータをフェッチする', async () => {
      const fetchFunction = createMockFetchFunction();

      const { result } = renderHook(() => usePagination(fetchFunction));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchFunction).toHaveBeenCalledTimes(1);
      expect(fetchFunction).toHaveBeenCalledWith(1, 20);
      expect(result.current.data).toHaveLength(20);
      expect(result.current.currentPage).toBe(1);
    });

    it('autoFetch=falseの場合、自動フェッチしない', () => {
      const fetchFunction = createMockFetchFunction();

      renderHook(() => usePagination(fetchFunction, { autoFetch: false }));

      expect(fetchFunction).not.toHaveBeenCalled();
    });
  });

  describe('データフェッチ', () => {
    it('初回フェッチが成功する', async () => {
      const fetchFunction = createMockFetchFunction();

      const { result } = renderHook(() => usePagination(fetchFunction));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(20);
      expect(result.current.data[0]).toBe('Item 1');
      expect(result.current.data[19]).toBe('Item 20');
      expect(result.current.hasMore).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('フェッチ失敗時にエラーを設定する', async () => {
      const errorMessage = 'Network error';
      const fetchFunction = jest.fn(() => Promise.reject(new Error(errorMessage)));

      const { result } = renderHook(() => usePagination(fetchFunction));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBe(null);
      expect(result.current.error?.message).toBe(errorMessage);
      expect(result.current.data).toEqual([]);
    });
  });

  describe('loadMore', () => {
    it('次のページを読み込む', async () => {
      const fetchFunction = createMockFetchFunction();

      const { result } = renderHook(() => usePagination(fetchFunction));

      // 初回フェッチ完了を待つ
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(20);
      expect(result.current.currentPage).toBe(1);

      // 次のページを読み込む
      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.isLoadingMore).toBe(false);
      });

      expect(fetchFunction).toHaveBeenCalledTimes(2);
      expect(fetchFunction).toHaveBeenCalledWith(2, 20);
      expect(result.current.data).toHaveLength(40);
      expect(result.current.data[0]).toBe('Item 1');
      expect(result.current.data[39]).toBe('Item 40');
      expect(result.current.currentPage).toBe(2);
    });

    it('hasMore=falseの場合、loadMoreを呼んでも何もしない', async () => {
      const fetchFunction = createMockFetchFunction(20); // 1ページ分のみ

      const { result } = renderHook(() => usePagination(fetchFunction));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(false);

      const callCountBefore = fetchFunction.mock.calls.length;

      // loadMoreを呼ぶ
      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(fetchFunction.mock.calls.length).toBe(callCountBefore);
      });
    });

    it('ローディング中にloadMoreを呼んでも重複リクエストしない', async () => {
      const fetchFunction = jest.fn(async (page: number, pageSize: number) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return createMockFetchFunction()(page, pageSize);
      });

      const { result } = renderHook(() => usePagination(fetchFunction));

      // 初回フェッチ完了を待つ
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 連続してloadMoreを呼ぶ
      act(() => {
        result.current.loadMore();
        result.current.loadMore();
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.isLoadingMore).toBe(false);
      });

      // 1回のみ呼ばれる
      expect(fetchFunction).toHaveBeenCalledTimes(2); // 初回 + loadMore 1回
    });
  });

  describe('refresh', () => {
    it('データをリフレッシュする', async () => {
      const fetchFunction = createMockFetchFunction();

      const { result } = renderHook(() => usePagination(fetchFunction));

      // 初回フェッチ完了を待つ
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 2ページ目を読み込む
      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.isLoadingMore).toBe(false);
      });

      expect(result.current.data).toHaveLength(40);
      expect(result.current.currentPage).toBe(2);

      // リフレッシュ
      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(false);
      });

      // 1ページ目のデータのみになる
      expect(result.current.data).toHaveLength(20);
      expect(result.current.currentPage).toBe(1);
      expect(fetchFunction).toHaveBeenCalledTimes(3); // 初回 + loadMore + refresh
    });
  });

  describe('reset', () => {
    it('状態をリセットする', async () => {
      const fetchFunction = createMockFetchFunction();

      const { result } = renderHook(() => usePagination(fetchFunction));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(20);

      // リセット
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isLoadingMore).toBe(false);
      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('オプション', () => {
    it('initialPageを指定できる', async () => {
      const fetchFunction = createMockFetchFunction();

      const { result } = renderHook(() =>
        usePagination(fetchFunction, { initialPage: 2 })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchFunction).toHaveBeenCalledWith(2, 20);
      expect(result.current.currentPage).toBe(2);
    });

    it('pageSizeを指定できる', async () => {
      const fetchFunction = createMockFetchFunction();

      const { result } = renderHook(() =>
        usePagination(fetchFunction, { pageSize: 10 })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchFunction).toHaveBeenCalledWith(1, 10);
      expect(result.current.data).toHaveLength(10);
    });

    it('deps変更時に再フェッチする', async () => {
      const fetchFunction = createMockFetchFunction();
      let dep = 'dep1';

      const { result, rerender } = renderHook(
        ({ deps }) => usePagination(fetchFunction, { deps }),
        { initialProps: { deps: [dep] } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchFunction).toHaveBeenCalledTimes(1);

      // 依存配列を変更
      dep = 'dep2';
      rerender({ deps: [dep] });

      await waitFor(() => {
        expect(fetchFunction).toHaveBeenCalledTimes(2);
      });
    });
  });
});

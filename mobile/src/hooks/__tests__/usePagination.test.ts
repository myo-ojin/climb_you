/**
 * usePagination Hook ユニットテスト
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  const mockData = Array.from({ length: 50 }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `Item ${i + 1}`,
  }));

  const createFetchData = (data: typeof mockData, pageSize: number = 20) => {
    return jest.fn(async (page: number, limit: number) => {
      const start = (page - 1) * limit;
      const end = start + limit;
      const pageData = data.slice(start, end);

      return {
        data: pageData,
        total: data.length,
        hasMore: end < data.length,
      };
    });
  };

  describe('初期状態', () => {
    it('autoLoad=trueの場合、自動的に最初のページを読み込む', async () => {
      const fetchData = createFetchData(mockData);

      const { result } = renderHook(() =>
        usePagination({
          fetchData,
          pageSize: 20,
          autoLoad: true,
        })
      );

      // 初期状態
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toEqual([]);

      // データ読み込み完了を待つ
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data.length).toBe(20);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.total).toBe(50);
      expect(result.current.hasMore).toBe(true);
      expect(fetchData).toHaveBeenCalledWith(1, 20);
    });

    it('autoLoad=falseの場合、自動読み込みしない', async () => {
      const fetchData = createFetchData(mockData);

      const { result } = renderHook(() =>
        usePagination({
          fetchData,
          pageSize: 20,
          autoLoad: false,
        })
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual([]);
      expect(fetchData).not.toHaveBeenCalled();
    });
  });

  describe('ページ読み込み', () => {
    it('loadMore()で次のページを読み込む', async () => {
      const fetchData = createFetchData(mockData);

      const { result } = renderHook(() =>
        usePagination({
          fetchData,
          pageSize: 20,
          autoLoad: true,
        })
      );

      // 最初のページが読み込まれるまで待つ
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data.length).toBe(20);

      // 次のページを読み込む
      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.data.length).toBe(40);
      expect(result.current.currentPage).toBe(2);
      expect(result.current.hasMore).toBe(true);
      expect(fetchData).toHaveBeenCalledWith(2, 20);
    });

    it('hasMore=falseの場合、loadMore()は何もしない', async () => {
      const fetchData = createFetchData(mockData.slice(0, 20), 20);

      const { result } = renderHook(() =>
        usePagination({
          fetchData,
          pageSize: 20,
          autoLoad: true,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasMore).toBe(false);

      const callCount = fetchData.mock.calls.length;

      await act(async () => {
        await result.current.loadMore();
      });

      // 呼び出し回数が変わらない
      expect(fetchData).toHaveBeenCalledTimes(callCount);
    });
  });

  describe('リフレッシュ', () => {
    it('refresh()で最初のページから再読み込み', async () => {
      const fetchData = createFetchData(mockData);

      const { result } = renderHook(() =>
        usePagination({
          fetchData,
          pageSize: 20,
          autoLoad: true,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 次のページを読み込む
      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.data.length).toBe(40);
      expect(result.current.currentPage).toBe(2);

      // リフレッシュ
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.data.length).toBe(20);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.hasMore).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    it('fetchData失敗時、エラーを設定', async () => {
      const errorMessage = 'Network error';
      const fetchData = jest.fn().mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() =>
        usePagination({
          fetchData,
          pageSize: 20,
          autoLoad: true,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe(errorMessage);
      expect(result.current.data).toEqual([]);
    });

    it('onErrorコールバックが呼ばれる', async () => {
      const errorMessage = 'Network error';
      const fetchData = jest.fn().mockRejectedValue(new Error(errorMessage));
      const onError = jest.fn();

      const { result } = renderHook(() =>
        usePagination({
          fetchData,
          pageSize: 20,
          autoLoad: true,
          onError,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toBe(errorMessage);
    });
  });

  describe('その他の機能', () => {
    it('clear()でデータをクリア', async () => {
      const fetchData = createFetchData(mockData);

      const { result } = renderHook(() =>
        usePagination({
          fetchData,
          pageSize: 20,
          autoLoad: true,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data.length).toBe(20);

      act(() => {
        result.current.clear();
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.total).toBe(0);
    });

    it('goToPage()で特定のページに移動', async () => {
      const fetchData = createFetchData(mockData);

      const { result } = renderHook(() =>
        usePagination({
          fetchData,
          pageSize: 20,
          autoLoad: false,
        })
      );

      await act(async () => {
        await result.current.goToPage(2);
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.data.length).toBe(20);
      expect(fetchData).toHaveBeenCalledWith(2, 20);
    });
  });
});

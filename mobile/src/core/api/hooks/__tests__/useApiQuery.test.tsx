/**
 * useApiQuery Hook ユニットテスト
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useApiQuery } from '../useApiQuery';

describe('useApiQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // テスト時はリトライしない
          staleTime: 5 * 60 * 1000, // 5分間キャッシュを新鮮な状態に保つ
          cacheTime: 10 * 60 * 1000, // 10分間キャッシュを保持
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('データフェッチ', () => {
    it('データを正常にフェッチできる', async () => {
      const mockData = { id: '1', name: 'Test Quest' };
      const queryFn = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(
        () =>
          useApiQuery({
            queryKey: ['quest', '1'],
            queryFn,
          }),
        { wrapper }
      );

      // 初期状態
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // データフェッチ完了を待つ
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    it('AbortSignalが渡される', async () => {
      const queryFn = jest.fn().mockResolvedValue({ data: 'test' });

      renderHook(
        () =>
          useApiQuery({
            queryKey: ['test'],
            queryFn,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(queryFn).toHaveBeenCalled();
      });

      // AbortSignalが渡されることを確認
      const signal = queryFn.mock.calls[0][0];
      expect(signal).toBeInstanceOf(AbortSignal);
    });

    it('フェッチ失敗時にエラーを返す', async () => {
      const errorMessage = 'Network error';
      const queryFn = jest.fn().mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(
        () =>
          useApiQuery({
            queryKey: ['quest', '1'],
            queryFn,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).not.toBe(null);
      expect(result.current.error?.message).toBe(errorMessage);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('キャッシング', () => {
    it('同じクエリキーで2回目はキャッシュから返す', async () => {
      const mockData = { id: '1', name: 'Test Quest' };
      const queryFn = jest.fn().mockResolvedValue(mockData);

      // 1回目
      const { result: result1, unmount: unmount1 } = renderHook(
        () =>
          useApiQuery({
            queryKey: ['quest', '1'],
            queryFn,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      expect(queryFn).toHaveBeenCalledTimes(1);

      // アンマウント
      unmount1();

      // 2回目 - キャッシュから返す
      const { result: result2 } = renderHook(
        () =>
          useApiQuery({
            queryKey: ['quest', '1'],
            queryFn,
          }),
        { wrapper }
      );

      // キャッシュがあるので即座にデータが返る
      expect(result2.current.data).toEqual(mockData);
      expect(result2.current.isLoading).toBe(false);

      // フェッチ関数は呼ばれない
      expect(queryFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('enabled オプション', () => {
    it('enabled=falseの場合、フェッチしない', () => {
      const queryFn = jest.fn().mockResolvedValue({ data: 'test' });

      const { result } = renderHook(
        () =>
          useApiQuery({
            queryKey: ['test'],
            queryFn,
            enabled: false,
          }),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(queryFn).not.toHaveBeenCalled();
    });

    it('enabled=trueに変更すると、フェッチする', async () => {
      const queryFn = jest.fn().mockResolvedValue({ data: 'test' });
      let enabled = false;

      const { result, rerender } = renderHook(
        ({ enabled }) =>
          useApiQuery({
            queryKey: ['test'],
            queryFn,
            enabled,
          }),
        { wrapper, initialProps: { enabled } }
      );

      expect(queryFn).not.toHaveBeenCalled();

      // enabledをtrueに変更
      enabled = true;
      rerender({ enabled });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(queryFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('リクエストキャンセル', () => {
    it('アンマウント時にリクエストがキャンセルされる', async () => {
      const queryFn = jest.fn(async (signal?: AbortSignal) => {
        // 長時間かかる処理をシミュレート
        await new Promise((resolve, reject) => {
          setTimeout(resolve, 1000);

          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new Error('Aborted'));
            });
          }
        });

        return { data: 'test' };
      });

      const { unmount } = renderHook(
        () =>
          useApiQuery({
            queryKey: ['test'],
            queryFn,
          }),
        { wrapper }
      );

      // すぐにアンマウント
      unmount();

      // AbortSignalのabortが呼ばれることを確認
      await waitFor(() => {
        expect(queryFn).toHaveBeenCalled();
      });

      const signal = queryFn.mock.calls[0][0];
      expect(signal.aborted).toBe(true);
    });
  });
});

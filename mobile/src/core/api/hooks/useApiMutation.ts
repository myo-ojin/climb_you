/**
 * useApiMutation Hook
 * React QueryのuseMutationラッパーフック
 *
 * 機能:
 * - データ変更処理（POST, PUT, DELETE）
 * - 楽観的更新
 * - キャッシュ無効化
 * - エラーハンドリング
 */

import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  QueryKey,
} from '@tanstack/react-query';
import { queryClient } from '../queryClient';

/**
 * APIMutationオプション
 */
export interface ApiMutationOptions<TData, TVariables, TError = Error>
  extends Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> {
  /**
   * ミューテーション関数
   */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * 成功時に無効化するクエリキー
   */
  invalidateKeys?: QueryKey[];

  /**
   * 楽観的更新を行うクエリキー
   */
  optimisticUpdateKey?: QueryKey;

  /**
   * 楽観的更新関数
   */
  optimisticUpdateFn?: (oldData: any, variables: TVariables) => any;
}

/**
 * useApiMutation Hook
 *
 * @example
 * ```tsx
 * const { mutate, isLoading } = useApiMutation({
 *   mutationFn: (questId) => completeQuest(questId),
 *   invalidateKeys: [['quests'], ['progress']],
 *   onSuccess: () => {
 *     showToast('クエスト完了！');
 *   },
 * });
 *
 * // 使用
 * mutate(questId);
 * ```
 */
export function useApiMutation<TData, TVariables, TError = Error>({
  mutationFn,
  invalidateKeys = [],
  optimisticUpdateKey,
  optimisticUpdateFn,
  onSuccess,
  onError,
  onSettled,
  ...options
}: ApiMutationOptions<TData, TVariables, TError>): UseMutationResult<
  TData,
  TError,
  TVariables
> {
  return useMutation<TData, TError, TVariables>({
    mutationFn,

    // 楽観的更新（ミューテーション実行前）
    onMutate: async (variables) => {
      if (optimisticUpdateKey && optimisticUpdateFn) {
        // 進行中のクエリをキャンセル
        await queryClient.cancelQueries({ queryKey: optimisticUpdateKey });

        // 以前のデータを保存
        const previousData = queryClient.getQueryData(optimisticUpdateKey);

        // 楽観的更新
        queryClient.setQueryData(optimisticUpdateKey, (oldData: any) =>
          optimisticUpdateFn(oldData, variables)
        );

        // コンテキストとして以前のデータを返す
        return { previousData };
      }

      return undefined;
    },

    // 成功時
    onSuccess: async (data, variables, context) => {
      // カスタム成功ハンドラー
      if (onSuccess) {
        await onSuccess(data, variables, context);
      }

      // 指定されたクエリを無効化
      for (const queryKey of invalidateKeys) {
        await queryClient.invalidateQueries({ queryKey });
      }
    },

    // エラー時（楽観的更新をロールバック）
    onError: (error, variables, context: any) => {
      if (optimisticUpdateKey && context?.previousData) {
        queryClient.setQueryData(optimisticUpdateKey, context.previousData);
      }

      // カスタムエラーハンドラー
      if (onError) {
        onError(error, variables, context);
      }
    },

    // 完了時（成功/失敗に関わらず）
    onSettled: async (data, error, variables, context) => {
      // カスタム完了ハンドラー
      if (onSettled) {
        await onSettled(data, error, variables, context);
      }

      // 楽観的更新したクエリを再フェッチ
      if (optimisticUpdateKey) {
        await queryClient.invalidateQueries({ queryKey: optimisticUpdateKey });
      }
    },

    ...options,
  });
}

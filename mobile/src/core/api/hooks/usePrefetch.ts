/**
 * usePrefetch Hook
 * データプリフェッチ用フック
 *
 * 機能:
 * - 画面遷移前にデータをプリフェッチ
 * - キャッシュにデータを事前ロード
 * - ユーザー体験の向上
 */

import { useCallback } from 'react';
import { QueryKey } from '@tanstack/react-query';
import { queryClient } from '../queryClient';

/**
 * usePrefetch Hook
 *
 * @example
 * ```tsx
 * function HomeScreen({ navigation }) {
 *   const prefetchQuestDetail = usePrefetch();
 *
 *   const handleQuestPress = (questId: string) => {
 *     // 画面遷移前にデータをプリフェッチ
 *     prefetchQuestDetail(
 *       ['quest', questId],
 *       () => fetchQuest(questId)
 *     );
 *
 *     navigation.navigate('QuestDetail', { questId });
 *   };
 *
 *   return <QuestList onQuestPress={handleQuestPress} />;
 * }
 * ```
 */
export function usePrefetch() {
  /**
   * データをプリフェッチ
   */
  const prefetch = useCallback(
    async <TData>(queryKey: QueryKey, queryFn: () => Promise<TData>) => {
      // 既にキャッシュがある場合はスキップ
      const cachedData = queryClient.getQueryData(queryKey);
      if (cachedData) {
        return;
      }

      // プリフェッチ実行
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
      });
    },
    []
  );

  return prefetch;
}

/**
 * 複数のクエリを並行してプリフェッチ
 */
export async function prefetchQueries(
  queries: Array<{
    queryKey: QueryKey;
    queryFn: () => Promise<any>;
  }>
) {
  await Promise.all(
    queries.map(({ queryKey, queryFn }) =>
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
      })
    )
  );
}

/**
 * useQuests Hook
 * 今日のクエストと進捗情報を取得するカスタムフック
 */

import { useQuery } from '@tanstack/react-query';
import { useQuestUseCase } from './useQuestUseCase';
import { useProgress } from './useProgress';
import { useStreak } from './useStreak';
import type { Quest, Streak } from '@/core/domain/entities';
import type { Progress } from './useProgress';

export interface UseQuestsReturn {
  todayQuests: Quest[];
  progress: Progress;
  currentStreak: Streak;
  isLoading: boolean;
  error: Error | null;
  refreshQuests: () => Promise<void>;
}

/**
 * 今日のクエストを取得するフック
 * React Query で自動的にキャッシュと再フェッチを管理
 */
export const useQuests = (): UseQuestsReturn => {
  const questUseCase = useQuestUseCase();
  const progress = useProgress();
  const currentStreak = useStreak();

  const {
    data: todayQuests = [],
    isLoading,
    error,
    refetch: refetchQuests
  } = useQuery({
    queryKey: ['todayQuests'],
    queryFn: async () => {
      try {
        return await questUseCase.getTodayQuests();
      } catch (err) {
        console.error('[useQuests] Failed to fetch today quests:', err);
        // TODO: LocalDataSource からフォールバック取得
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,        // 5分
    gcTime: 10 * 60 * 1000,          // キャッシュ保持時間: 10分
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const refreshQuests = async () => {
    await refetchQuests();
  };

  return {
    todayQuests,
    progress,
    currentStreak,
    isLoading,
    error: error as Error | null,
    refreshQuests,
  };
};

/**
 * useStreak Hook
 * ユーザーのストリーク情報を取得するカスタムフック
 */

import { useState, useEffect } from 'react';
import type { Streak } from '@/core/domain/entities/Streak';

/**
 * ユーザーのストリーク情報を取得
 * TODO: 実装予定 - データソースから取得
 */
export const useStreak = (): Streak => {
  const [streak, setStreak] = useState<Streak>({
    userId: '',
    currentStreak: 15,
    maxStreak: 28,
    freezeDaysUsed: 0,
    lastCompletionDate: new Date(),
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  useEffect(() => {
    // TODO: LocalDataSource または RemoteDataSource からストリーク情報を取得
    // const fetchStreak = async () => {
    //   const streakData = await streakUseCase.getStreak();
    //   setStreak(streakData);
    // };
    // fetchStreak();
  }, []);

  return streak;
};

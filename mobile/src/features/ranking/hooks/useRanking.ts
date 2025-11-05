/**
 * useRanking Hook
 * ランキングデータを取得するカスタムフック
 */

import { useState, useEffect, useCallback } from 'react';
import {
  RankingStats,
  WeeklyRanking,
  LevelBand,
  RankingEntry,
  getLevelBandFromSteps,
  getBadgeForRank,
} from '../types';
import { DatabaseManager } from '@/core/data/DatabaseManager';

/**
 * 週のIDを生成（YYYY-WW形式）
 */
const getWeekId = (date: Date): string => {
  const year = date.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${year}-${String(weekNumber).padStart(2, '0')}`;
};

/**
 * 週の開始日と終了日を取得
 */
const getWeekRange = (weekId: string): { startDate: Date; endDate: Date } => {
  const [year, week] = weekId.split('-').map(Number);
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay();
  const startDate = new Date(year, 0, 1 + daysOffset);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

/**
 * モックランキングデータを生成
 */
const generateMockRankingData = (
  weekId: string,
  levelBand: LevelBand,
  userRank: number,
  userWeeklySteps: number
): WeeklyRanking => {
  const { startDate, endDate } = getWeekRange(weekId);

  // 上位20名のモックデータを生成
  const entries: RankingEntry[] = [];
  for (let i = 1; i <= 20; i++) {
    const isCurrentUser = i === userRank && userRank <= 20;
    const weeklySteps = isCurrentUser
      ? userWeeklySteps
      : Math.floor(Math.random() * 1000) + 500 - i * 20;
    const achievementRate = Math.floor(Math.random() * 30) + 70 - i;

    entries.push({
      rank: i,
      anonymousName: `登山者${String.fromCharCode(65 + i - 1)}`, // A, B, C, ...
      weeklySteps,
      achievementRate,
      isCurrentUser,
      badge: getBadgeForRank(i),
    });
  }

  return {
    weekId,
    startDate,
    endDate,
    levelBand,
    entries,
    myRank: userRank > 20 ? userRank : undefined,
    myWeeklySteps: userRank > 20 ? userWeeklySteps : undefined,
    myAchievementRate: userRank > 20 ? 75 : undefined,
    totalParticipants: Math.floor(Math.random() * 50) + 50,
  };
};

/**
 * useRanking Hook
 */
export const useRanking = (userId: string) => {
  const [rankingStats, setRankingStats] = useState<RankingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * ランキングデータを読み込み
   */
  const loadRankingData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const dbManager = DatabaseManager.getInstance();

      // 進捗データを取得（累計歩数を取得）
      const progressResult = await dbManager.execute(
        `SELECT * FROM user_progress WHERE user_id = ? LIMIT 1`,
        [userId]
      );

      const progress = progressResult.rows[0] || {
        total_steps: 0,
      };

      const totalSteps = progress.total_steps || 0;
      const currentLevelBand = getLevelBandFromSteps(totalSteps);

      // 現在の週のIDを取得
      const currentWeekId = getWeekId(new Date());

      // TODO: 実際のAPIからランキングデータを取得
      // 現在はモックデータを使用
      const userRank = Math.floor(Math.random() * 30) + 1; // 1-30位のランダム順位
      const userWeeklySteps = Math.floor(Math.random() * 500) + 200;

      const currentWeek = generateMockRankingData(
        currentWeekId,
        currentLevelBand,
        userRank,
        userWeeklySteps
      );

      // 過去4週間のデータを生成
      const pastWeeks: WeeklyRanking[] = [];
      for (let i = 1; i <= 4; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - i * 7);
        const pastWeekId = getWeekId(pastDate);
        const pastRank = Math.floor(Math.random() * 30) + 1;
        const pastWeeklySteps = Math.floor(Math.random() * 500) + 200;
        pastWeeks.push(
          generateMockRankingData(pastWeekId, currentLevelBand, pastRank, pastWeeklySteps)
        );
      }

      // 自己ベスト順位を計算
      const allRanks = [userRank, ...pastWeeks.map((w) => w.myRank || w.entries.find((e) => e.isCurrentUser)?.rank || 99)];
      const bestRank = Math.min(...allRanks);
      const bestRankWeekIndex = allRanks.indexOf(bestRank);
      const bestRankWeek = bestRankWeekIndex === 0 ? currentWeekId : pastWeeks[bestRankWeekIndex - 1].weekId;

      // バッジカウント
      const badgesEarned = {
        champion: allRanks.filter((r) => r === 1).length,
        top3: allRanks.filter((r) => r <= 3).length,
        top10: allRanks.filter((r) => r <= 10).length,
      };

      const stats: RankingStats = {
        currentWeek,
        pastWeeks,
        bestRank,
        bestRankWeek,
        badgesEarned,
        currentLevelBand,
        totalSteps,
      };

      setRankingStats(stats);
    } catch (err) {
      console.error('Error loading ranking data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * データを再読み込み
   */
  const refresh = useCallback(async () => {
    await loadRankingData();
  }, [loadRankingData]);

  useEffect(() => {
    loadRankingData();
  }, [loadRankingData]);

  return {
    rankingStats,
    isLoading,
    error,
    refresh,
  };
};

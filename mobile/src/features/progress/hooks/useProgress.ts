/**
 * useProgress Hook
 * 進捗データを取得するカスタムフック
 */

import { useState, useEffect, useCallback } from 'react';
import { ProgressData, Station, StationStatus, NextStationInfo } from '../types';
import { DatabaseManager } from '@/core/data/DatabaseManager';

/**
 * useProgress Hook
 */
export const useProgress = (userId: string) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 進捗データを読み込み
   */
  const loadProgressData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const dbManager = DatabaseManager.getInstance();

      // 目標データを取得
      const goalResult = await dbManager.execute(
        `SELECT * FROM goals WHERE user_id = ? LIMIT 1`,
        [userId]
      );

      if (!goalResult.rows || goalResult.rows.length === 0) {
        throw new Error('目標が見つかりません');
      }

      const goal = goalResult.rows[0];

      // マイルストーンデータを取得
      const milestonesResult = await dbManager.execute(
        `SELECT * FROM milestones WHERE goal_id = ? ORDER BY station_number ASC`,
        [goal.id]
      );

      const milestones = milestonesResult.rows;

      // 進捗データを取得
      const progressResult = await dbManager.execute(
        `SELECT * FROM user_progress WHERE user_id = ? LIMIT 1`,
        [userId]
      );

      const progress = progressResult.rows[0] || {
        total_steps: 0,
        current_station: 1,
        steps_for_current_station: 0,
      };

      // ストリークデータを取得
      const streakResult = await dbManager.execute(
        `SELECT * FROM streaks WHERE user_id = ? LIMIT 1`,
        [userId]
      );

      const streak = streakResult.rows[0] || {
        current_streak: 0,
        max_streak: 0,
      };

      // 各合目のデータを作成
      const stations: Station[] = milestones.map((milestone: any) => {
        const stationNumber = milestone.station_number;
        const requiredSteps = milestone.required_steps;

        let status: StationStatus;
        let progressRate: number;

        if (stationNumber < progress.current_station) {
          // 達成済み
          status = StationStatus.ACHIEVED;
          progressRate = 100;
        } else if (stationNumber === progress.current_station) {
          // 現在の合目
          status = StationStatus.REACHED;
          // 現在の合目の進捗率を計算
          progressRate = requiredSteps > 0
            ? Math.floor((progress.steps_for_current_station / requiredSteps) * 100)
            : 0;
        } else {
          // 未到達
          status = StationStatus.NOT_REACHED;
          progressRate = 0;
        }

        return {
          stationNumber,
          title: milestone.title,
          criteria: milestone.criteria,
          requiredSteps,
          status,
          progressRate,
          achievedAt: milestone.achieved_at ? new Date(milestone.achieved_at) : undefined,
          evidence: milestone.evidence ? JSON.parse(milestone.evidence) : undefined,
        };
      });

      // 全体進捗率を計算
      const overallProgress = Math.floor((progress.current_station - 1) / 10 * 100);

      const progressData: ProgressData = {
        userId,
        totalSteps: progress.total_steps || 0,
        currentStation: progress.current_station || 1,
        overallProgress,
        stations,
        currentStreak: streak.current_streak || 0,
        maxStreak: streak.max_streak || 0,
        goalTitle: goal.title,
        goalDeadline: new Date(goal.deadline),
      };

      setProgressData(progressData);
    } catch (err) {
      console.error('Error loading progress data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * 次の合目情報を取得
   */
  const getNextStationInfo = useCallback((): NextStationInfo | null => {
    if (!progressData) return null;

    const nextStation = progressData.stations.find(
      (s) => s.stationNumber === progressData.currentStation + 1
    );

    if (!nextStation) return null;

    const remainingSteps = nextStation.requiredSteps - progressData.totalSteps;
    const progressRate = Math.max(
      0,
      Math.min(100, (progressData.totalSteps / nextStation.requiredSteps) * 100)
    );

    return {
      stationNumber: nextStation.stationNumber,
      title: nextStation.title,
      requiredSteps: nextStation.requiredSteps,
      remainingSteps: Math.max(0, remainingSteps),
      progressRate,
    };
  }, [progressData]);

  /**
   * データを再読み込み
   */
  const refresh = useCallback(async () => {
    await loadProgressData();
  }, [loadProgressData]);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  return {
    progressData,
    nextStationInfo: getNextStationInfo(),
    isLoading,
    error,
    refresh,
  };
};

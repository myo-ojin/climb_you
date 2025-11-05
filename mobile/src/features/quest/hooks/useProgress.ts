/**
 * useProgress Hook
 * ユーザーの進捗情報を取得するカスタムフック
 */

import { useState, useEffect } from 'react';

export interface Progress {
  currentStation: number;      // 1-10
  stepsInCurrentStation: number; // その合目内での歩数
  totalSteps: number;          // 累計歩数
  progressPercentage: number;  // 現在の合目の進捗率（0-100）
}

/**
 * ユーザーの進捗情報を取得
 * TODO: 実装予定 - データソースから取得
 */
export const useProgress = (): Progress => {
  const [progress, setProgress] = useState<Progress>({
    currentStation: 3,
    stepsInCurrentStation: 250,
    totalSteps: 1200,
    progressPercentage: 45,
  });

  useEffect(() => {
    // TODO: LocalDataSource または RemoteDataSource から進捗情報を取得
    // const fetchProgress = async () => {
    //   const progressData = await progressUseCase.getProgress();
    //   setProgress(progressData);
    // };
    // fetchProgress();
  }, []);

  return progress;
};

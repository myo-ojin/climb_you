/**
 * Milestone Transformer Utility
 * MCPレスポンス形式をUI形式に変換する
 */

import { MilestoneResponse } from '@/core/network/mcp';
import { Milestone } from '../types';

/**
 * MCP MilestoneResponse を UI Milestone 形式に変換
 */
export const transformMilestoneResponse = (
  mcpMilestone: MilestoneResponse
): Milestone => {
  return {
    station: mcpMilestone.station_number,
    title: mcpMilestone.title,
    description: mcpMilestone.description,
    estimatedDuration: mcpMilestone.target_date
      ? calculateDurationDisplay(mcpMilestone.target_date)
      : `${Math.ceil(mcpMilestone.estimated_steps / 10)}週間`, // 推定ステップから期間を計算
    completionCriteria: mcpMilestone.criteria,
  };
};

/**
 * MCP MilestoneResponse[] をUI Milestone[] に変換
 */
export const transformMilestoneResponses = (
  mcpMilestones: MilestoneResponse[]
): Milestone[] => {
  // ソート：station_number順（1-10）
  const sorted = [...mcpMilestones].sort(
    (a, b) => a.station_number - b.station_number
  );

  return sorted.map(transformMilestoneResponse);
};

/**
 * 目標のテキストから難易度レベルを推定
 * 本来はLLMやバックエンドで判定すべき
 */
export const estimateDifficultyLevel = (
  goal: string,
  duration?: string
): 'easy' | 'medium' | 'hard' => {
  const goalLength = goal.length;
  const complexKeywords = [
    'マスター',
    '習得',
    'プロ',
    'expert',
    'certification',
    'degree',
    '資格',
  ];

  const hasComplexKeywords = complexKeywords.some((keyword) =>
    goal.toLowerCase().includes(keyword.toLowerCase())
  );

  // 期間が短い場合は難易度が上がる傾向
  const isShortDuration =
    duration &&
    (duration.includes('月以内') || duration.includes('week'));

  if (hasComplexKeywords && isShortDuration) {
    return 'hard';
  } else if (hasComplexKeywords) {
    return 'medium';
  }

  return 'medium'; // デフォルトは中程度
};

/**
 * 期間テキストを日数に変換
 */
export const parseDurationToDays = (duration: string): number => {
  const dayMatch = duration.match(/(\d+)\s*日/);
  if (dayMatch) {
    return parseInt(dayMatch[1], 10);
  }

  const weekMatch = duration.match(/(\d+)\s*週/);
  if (weekMatch) {
    return parseInt(weekMatch[1], 10) * 7;
  }

  const monthMatch = duration.match(/(\d+)\s*ヶ月|月/);
  if (monthMatch) {
    return parseInt(monthMatch[1], 10) * 30;
  }

  // 「1ヶ月以内」等のパターン
  if (duration.includes('1ヶ月')) return 30;
  if (duration.includes('3ヶ月')) return 90;
  if (duration.includes('6ヶ月')) return 180;
  if (duration.includes('1年')) return 365;

  return 90; // デフォルト3ヶ月
};

/**
 * target_dateを表示用の期間テキストに変換
 */
export const calculateDurationDisplay = (targetDate: string): string => {
  try {
    const now = new Date();
    const target = new Date(targetDate);
    const daysUntil = Math.ceil(
      (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil <= 0) {
      return '完了';
    } else if (daysUntil <= 7) {
      return `${daysUntil}日`;
    } else if (daysUntil <= 30) {
      const weeks = Math.ceil(daysUntil / 7);
      return `${weeks}週間`;
    } else {
      const months = Math.ceil(daysUntil / 30);
      return `${months}ヶ月`;
    }
  } catch {
    return '未定';
  }
};

/**
 * マイルストーン生成用のパラメータを構築
 */
export const buildMilestoneGenerationParams = (
  goalId: string,
  goalText: string,
  duration?: string,
  difficulty?: 'easy' | 'medium' | 'hard'
) => {
  const difficultyLevel =
    difficulty || estimateDifficultyLevel(goalText, duration);
  const durationDays = duration
    ? parseDurationToDays(duration)
    : 90; // デフォルト3ヶ月

  return {
    goal_id: goalId,
    goal: goalText,
    difficulty_level: difficultyLevel,
    duration_days: durationDays,
  };
};

/**
 * マイルストーンの検証
 */
export const validateMilestones = (milestones: Milestone[]): boolean => {
  if (!Array.isArray(milestones) || milestones.length === 0) {
    return false;
  }

  // 1-10の全ての合目が揃っているか確認
  const stations = new Set(milestones.map((m) => m.station));
  for (let i = 1; i <= 10; i++) {
    if (!stations.has(i)) {
      return false;
    }
  }

  // 各マイルストーンに必要なフィールドがあるか確認
  return milestones.every(
    (m) =>
      m.station &&
      m.title &&
      m.description &&
      m.estimatedDuration &&
      m.completionCriteria
  );
};

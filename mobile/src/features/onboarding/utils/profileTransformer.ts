/**
 * Profile Transformer Utility
 * ユーザープロファイルデータの変換、検証、正規化を行う
 */

import { UserProfileData, ProfileQuestionOption } from '../types';

/**
 * プロファイルデータの正規化
 * ユーザー入力から API 送信用形式に変換
 */
export interface NormalizedProfileData {
  lifestyle: string;
  focusTime: string;
  workEnvironment: string;
  taskPace: string;
  pastFailureReason: string;
  skillLevel: string;
  difficultyPreference: string;
}

/**
 * MCP API 送信用プロファイル形式
 */
export interface ProfileAPIRequest {
  user_id: string;
  daily_commit_time: string; // "15分", "30分", "1時間" など
  lifestyle: string;
  focus_time: string;
  work_environment: string;
  task_pace: string;
  past_failure_reason: string;
  skill_level: string;
  difficulty_preference: string;
}

/**
 * MCP API レスポンス形式
 */
export interface ProfileAPIResponse {
  profile_id: string;
  user_id: string;
  daily_commit_time: string;
  lifestyle: string;
  focus_time: string;
  work_environment: string;
  task_pace: string;
  past_failure_reason: string;
  skill_level: string;
  difficulty_preference: string;
  created_at: string;
  updated_at: string;
}

/**
 * コミットタイムを分に変換
 */
export const parseCommitTimeToMinutes = (commitTime: string): number => {
  if (commitTime.includes('15')) return 15;
  if (commitTime.includes('30')) return 30;
  if (commitTime.includes('1時間') || commitTime.includes('60')) return 60;
  if (commitTime.includes('2時間') || commitTime.includes('120')) return 120;
  if (commitTime.includes('3時間') || commitTime.includes('180')) return 180;

  // デフォルト: 30 分
  return 30;
};

/**
 * 分をコミットタイム表示形式に変換
 */
export const formatMinutesToCommitTime = (minutes: number): string => {
  if (minutes === 15) return '15分';
  if (minutes === 30) return '30分';
  if (minutes === 60) return '1時間';
  if (minutes === 120) return '2時間';
  if (minutes === 180) return '3時間';

  // デフォルト表示
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
  }

  return `${minutes}分`;
};

/**
 * プロファイルデータを正規化
 */
export const normalizeProfileData = (
  profileData: Partial<UserProfileData>
): NormalizedProfileData => {
  return {
    lifestyle: profileData.lifestyle?.trim() || '',
    focusTime: profileData.focusTime?.trim() || '',
    workEnvironment: profileData.workEnvironment?.trim() || '',
    taskPace: profileData.taskPace?.trim() || '',
    pastFailureReason: profileData.pastFailureReason?.trim() || '',
    skillLevel: profileData.skillLevel?.trim() || '',
    difficultyPreference: profileData.difficultyPreference?.trim() || '',
  };
};

/**
 * プロファイルデータを検証
 */
export const validateProfileData = (
  profile: NormalizedProfileData
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 必須フィールドチェック
  if (!profile.lifestyle) {
    errors.push('生活パターンを選択してください');
  }
  if (!profile.focusTime) {
    errors.push('集中できる時間帯を選択してください');
  }
  if (!profile.workEnvironment) {
    errors.push('作業環境を選択してください');
  }
  if (!profile.taskPace) {
    errors.push('タスクのペースを選択してください');
  }
  if (!profile.pastFailureReason) {
    errors.push('過去の失敗理由を選択してください');
  }
  if (!profile.skillLevel) {
    errors.push('スキルレベルを選択してください');
  }
  if (!profile.difficultyPreference) {
    errors.push('難易度の好みを選択してください');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * プロファイルを MCP API リクエスト形式に変換
 */
export const transformProfileToAPIRequest = (
  userId: string,
  commitTime: string,
  profile: NormalizedProfileData
): ProfileAPIRequest => {
  return {
    user_id: userId,
    daily_commit_time: commitTime,
    lifestyle: profile.lifestyle,
    focus_time: profile.focusTime,
    work_environment: profile.workEnvironment,
    task_pace: profile.taskPace,
    past_failure_reason: profile.pastFailureReason,
    skill_level: profile.skillLevel,
    difficulty_preference: profile.difficultyPreference,
  };
};

/**
 * MCP API レスポンスを UI 形式に変換
 */
export const transformAPIResponseToProfile = (
  response: ProfileAPIResponse
): UserProfileData => {
  return {
    lifestyle: response.lifestyle,
    focusTime: response.focus_time,
    workEnvironment: response.work_environment,
    taskPace: response.task_pace,
    pastFailureReason: response.past_failure_reason,
    skillLevel: response.skill_level,
    difficultyPreference: response.difficulty_preference,
  };
};

/**
 * プロファイル回答の実用的な分析を取得
 * クエスト生成に使用される情報を抽出
 */
export interface ProfileInsights {
  availableMinutesPerDay: number; // コミットタイム
  preferredFocusTime: string; // 集中時間帯
  workEnvironment: string; // 作業環境
  preferredPace: 'daily' | 'weekly' | 'flexible'; // タスク頻度
  estimatedDifficultyLevel: 'easy' | 'medium' | 'hard'; // 推奨難易度
  commonObstacles: string[]; // よくある障害
}

/**
 * プロファイルデータから有用な洞察を抽出
 */
export const extractProfileInsights = (
  commitTime: string,
  profile: NormalizedProfileData
): ProfileInsights => {
  // 難易度推定: スキルレベルと経験から判定
  let estimatedDifficultyLevel: 'easy' | 'medium' | 'hard' = 'medium';

  if (profile.skillLevel.includes('初心者') || profile.skillLevel.includes('全く')) {
    estimatedDifficultyLevel = 'easy';
  } else if (
    profile.skillLevel.includes('豊富') ||
    profile.skillLevel.includes('経験豊')
  ) {
    estimatedDifficultyLevel = 'hard';
  }

  // ユーザーの希望難易度も考慮
  if (
    profile.difficultyPreference.includes('チャレンジ') ||
    profile.difficultyPreference.includes('成長')
  ) {
    estimatedDifficultyLevel = 'hard';
  } else if (profile.difficultyPreference.includes('確実') || profile.difficultyPreference.includes('簡単')) {
    estimatedDifficultyLevel = 'easy';
  }

  // ペース判定
  let preferredPace: 'daily' | 'weekly' | 'flexible' = 'daily';
  if (profile.taskPace.includes('週末') || profile.taskPace.includes('週')) {
    preferredPace = 'weekly';
  } else if (profile.taskPace.includes('柔軟') || profile.taskPace.includes('気分')) {
    preferredPace = 'flexible';
  }

  // よくある障害を抽出
  const commonObstacles: string[] = [];
  if (
    profile.pastFailureReason.includes('時間') ||
    profile.pastFailureReason.includes('忙しい')
  ) {
    commonObstacles.push('時間不足');
  }
  if (
    profile.pastFailureReason.includes('モチベーション') ||
    profile.pastFailureReason.includes('モヤ')
  ) {
    commonObstacles.push('モチベーション低下');
  }
  if (profile.pastFailureReason.includes('難しい') || profile.pastFailureReason.includes('複雑')) {
    commonObstacles.push('難易度が高い');
  }
  if (profile.pastFailureReason.includes('忘れ') || profile.pastFailureReason.includes('記憶')) {
    commonObstacles.push('習慣化の失敗');
  }

  return {
    availableMinutesPerDay: parseCommitTimeToMinutes(commitTime),
    preferredFocusTime: profile.focusTime,
    workEnvironment: profile.workEnvironment,
    preferredPace,
    estimatedDifficultyLevel,
    commonObstacles: commonObstacles.length > 0 ? commonObstacles : ['その他'],
  };
};

/**
 * 2 つのプロファイルデータが同等か確認
 */
export const areProfilesEqual = (
  profile1: UserProfileData,
  profile2: UserProfileData
): boolean => {
  return (
    profile1.lifestyle === profile2.lifestyle &&
    profile1.focusTime === profile2.focusTime &&
    profile1.workEnvironment === profile2.workEnvironment &&
    profile1.taskPace === profile2.taskPace &&
    profile1.pastFailureReason === profile2.pastFailureReason &&
    profile1.skillLevel === profile2.skillLevel &&
    profile1.difficultyPreference === profile2.difficultyPreference
  );
};

/**
 * プロファイル質問の定義
 */
export const PROFILE_QUESTIONS = [
  {
    id: 'lifestyle',
    question: 'あなたの平日の生活パターンは？',
    options: ['会社員（9-18時）', '学生', 'フリーランス', 'その他'],
  },
  {
    id: 'focusTime',
    question: 'いつが一番集中できますか？',
    options: ['朝（6-9時）', '昼（12-15時）', '夜（18-21時）', '深夜（21時以降）'],
  },
  {
    id: 'workEnvironment',
    question: '主にどこで作業しますか？',
    options: ['自宅', 'オフィス', 'カフェ・外出先', '移動中'],
  },
  {
    id: 'taskPace',
    question: 'どんなペースが続けやすいですか？',
    options: ['毎日少しずつ', '週末にまとめて', '気分次第で柔軟に', 'その他'],
  },
  {
    id: 'pastFailureReason',
    question: '過去に目標が続かなかった理由は？',
    options: ['時間がなくなった', 'モチベーション低下', '難しすぎた', '忘れてしまった'],
  },
  {
    id: 'skillLevel',
    question: 'この目標に関する現在の経験は？',
    options: ['全くの初心者', '少し経験あり', 'ある程度できる', '経験豊富'],
  },
  {
    id: 'difficultyPreference',
    question: 'どんな難易度のタスクが好きですか？',
    options: [
      '確実にできる簡単なこと',
      '少し頑張れば達成できること',
      'チャレンジングで成長を感じること',
      'その他',
    ],
  },
];

/**
 * コミットタイム選択肢
 */
export const COMMIT_TIME_OPTIONS = [
  '15分',
  '30分',
  '1時間',
  '2時間',
  'その他（カスタム）',
];

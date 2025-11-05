/**
 * Milestone Types
 * マイルストーン関連の型定義
 */

/**
 * 証跡タイプ
 */
export enum EvidenceType {
  IMAGE = 'image',
  MEMO = 'memo',
  FILE = 'file',
}

/**
 * 証跡データ
 */
export interface Evidence {
  /**
   * 証跡タイプ
   */
  type: EvidenceType;

  /**
   * 画像またはファイルのURL（type=image/fileの場合）
   */
  url?: string;

  /**
   * メモテキスト（type=memoの場合）
   */
  text?: string;

  /**
   * ファイル名（type=fileの場合）
   */
  fileName?: string;

  /**
   * アップロード日時
   */
  uploadedAt: Date;
}

/**
 * 未達成時の選択肢
 */
export enum NotAchievedOption {
  CONTINUE = 'continue', // このまま続ける
  ADJUST_GOAL = 'adjust_goal', // 目標を調整する
  REDESIGN_MILESTONES = 'redesign_milestones', // マイルストーンを再設計する
}

/**
 * 未達成時の選択肢情報
 */
export interface NotAchievedOptionInfo {
  option: NotAchievedOption;
  label: string;
  description: string;
  icon: string;
}

/**
 * 未達成時の選択肢一覧
 */
export const NOT_ACHIEVED_OPTIONS: NotAchievedOptionInfo[] = [
  {
    option: NotAchievedOption.CONTINUE,
    label: 'このまま続ける',
    description: '現在の目標とマイルストーンで引き続き挑戦します',
    icon: '🚶',
  },
  {
    option: NotAchievedOption.ADJUST_GOAL,
    label: '目標を調整する',
    description: '現実的な目標に調整して、再チャレンジします',
    icon: '🔧',
  },
  {
    option: NotAchievedOption.REDESIGN_MILESTONES,
    label: 'マイルストーンを再設計する',
    description: 'AIが新しいマイルストーンプランを提案します',
    icon: '🗺️',
  },
];

/**
 * 目標調整提案
 */
export interface GoalAdjustmentProposal {
  /**
   * 提案ID
   */
  proposalId: string;

  /**
   * 調整前の目標
   */
  originalGoal: {
    title: string;
    kpi: string;
    deadline: Date;
  };

  /**
   * 調整後の目標
   */
  adjustedGoal: {
    title: string;
    kpi: string;
    deadline: Date;
  };

  /**
   * 調整理由
   */
  reason: string;

  /**
   * 変更点の詳細
   */
  changes: {
    field: 'title' | 'kpi' | 'deadline';
    before: string;
    after: string;
    explanation: string;
  }[];

  /**
   * 提案日時
   */
  proposedAt: Date;
}

/**
 * マイルストーン再設計提案
 */
export interface MilestoneRedesignProposal {
  /**
   * 提案ID
   */
  proposalId: string;

  /**
   * 再設計理由
   */
  reason: string;

  /**
   * 現在の進捗状況分析
   */
  progressAnalysis: {
    currentStation: number;
    totalSteps: number;
    completedQuests: number;
    averageAchievementRate: number;
    identifiedIssues: string[];
  };

  /**
   * 新しいマイルストーン計画
   */
  newMilestones: {
    stationNumber: number;
    title: string;
    criteria: string;
    requiredSteps: number;
  }[];

  /**
   * 提案日時
   */
  proposedAt: Date;
}

/**
 * マイルストーン達成確認データ
 */
export interface MilestoneAchievementConfirmation {
  /**
   * マイルストーンID
   */
  milestoneId: string;

  /**
   * 合目番号
   */
  stationNumber: number;

  /**
   * 達成したかどうか
   */
  achieved: boolean;

  /**
   * 証跡（達成時）
   */
  evidence?: Evidence;

  /**
   * 進捗率（未達成時）
   */
  progressRate?: number;

  /**
   * 未達成時の選択肢（未達成時）
   */
  notAchievedOption?: NotAchievedOption;

  /**
   * 確認日時
   */
  confirmedAt: Date;
}

/**
 * マイルストーン達成状態
 */
export interface MilestoneAchievementState {
  /**
   * マイルストーン情報
   */
  milestone: {
    id: string;
    stationNumber: number;
    title: string;
    criteria: string;
    requiredSteps: number;
  };

  /**
   * 現在の累計歩数
   */
  currentSteps: number;

  /**
   * 達成確認済みかどうか
   */
  isConfirmed: boolean;

  /**
   * 達成確認データ（確認済みの場合）
   */
  confirmation?: MilestoneAchievementConfirmation;
}

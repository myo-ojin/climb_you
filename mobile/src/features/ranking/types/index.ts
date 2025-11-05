/**
 * Ranking Feature Types
 * ランキング機能の型定義
 */

/**
 * レベル帯
 */
export enum LevelBand {
  BEGINNER = 'beginner',           // 初心者（0〜1,000歩）
  NOVICE = 'novice',               // 駆け出し（1,001〜5,000歩）
  INTERMEDIATE = 'intermediate',   // 中級者（5,001〜15,000歩）
  ADVANCED = 'advanced',           // 上級者（15,001〜30,000歩）
  EXPERT = 'expert',               // エキスパート（30,001〜50,000歩）
  MASTER = 'master',               // マスター（50,001歩以上）
}

/**
 * レベル帯情報
 */
export interface LevelBandInfo {
  /**
   * レベル帯
   */
  band: LevelBand;

  /**
   * 表示名
   */
  name: string;

  /**
   * 最小歩数
   */
  minSteps: number;

  /**
   * 最大歩数（nullの場合は上限なし）
   */
  maxSteps: number | null;

  /**
   * 色
   */
  color: string;

  /**
   * アイコン
   */
  icon?: string;
}

/**
 * ランキングエントリー
 */
export interface RankingEntry {
  /**
   * 順位
   */
  rank: number;

  /**
   * 匿名表示名（「登山者A」など）
   */
  anonymousName: string;

  /**
   * 週次獲得歩数
   */
  weeklySteps: number;

  /**
   * 達成率（0-100）
   */
  achievementRate: number;

  /**
   * 自分かどうか
   */
  isCurrentUser: boolean;

  /**
   * バッジ（週間チャンピオン、トップ3など）
   */
  badge?: 'champion' | 'top3' | 'top10';
}

/**
 * 週次ランキングデータ
 */
export interface WeeklyRanking {
  /**
   * 週の識別子（YYYY-WW形式）
   */
  weekId: string;

  /**
   * 週の開始日
   */
  startDate: Date;

  /**
   * 週の終了日
   */
  endDate: Date;

  /**
   * レベル帯
   */
  levelBand: LevelBand;

  /**
   * ランキングエントリー（上位20名）
   */
  entries: RankingEntry[];

  /**
   * 自分の順位（20位外の場合）
   */
  myRank?: number;

  /**
   * 自分の週次獲得歩数
   */
  myWeeklySteps?: number;

  /**
   * 自分の達成率
   */
  myAchievementRate?: number;

  /**
   * 総参加者数
   */
  totalParticipants: number;
}

/**
 * ランキング統計
 */
export interface RankingStats {
  /**
   * 現在の週のランキング
   */
  currentWeek: WeeklyRanking;

  /**
   * 過去4週間のランキング
   */
  pastWeeks: WeeklyRanking[];

  /**
   * 自己ベスト順位
   */
  bestRank: number;

  /**
   * 自己ベスト順位の週
   */
  bestRankWeek: string;

  /**
   * 獲得バッジ数
   */
  badgesEarned: {
    champion: number;
    top3: number;
    top10: number;
  };

  /**
   * 現在のレベル帯
   */
  currentLevelBand: LevelBand;

  /**
   * 累計歩数
   */
  totalSteps: number;
}

/**
 * レベル帯範囲のマップ
 */
export const LEVEL_BAND_RANGES: Record<LevelBand, LevelBandInfo> = {
  [LevelBand.BEGINNER]: {
    band: LevelBand.BEGINNER,
    name: '初心者',
    minSteps: 0,
    maxSteps: 1000,
    color: '#9E9E9E', // Gray
  },
  [LevelBand.NOVICE]: {
    band: LevelBand.NOVICE,
    name: '駆け出し',
    minSteps: 1001,
    maxSteps: 5000,
    color: '#8BC34A', // Light Green
  },
  [LevelBand.INTERMEDIATE]: {
    band: LevelBand.INTERMEDIATE,
    name: '中級者',
    minSteps: 5001,
    maxSteps: 15000,
    color: '#2196F3', // Blue
  },
  [LevelBand.ADVANCED]: {
    band: LevelBand.ADVANCED,
    name: '上級者',
    minSteps: 15001,
    maxSteps: 30000,
    color: '#9C27B0', // Purple
  },
  [LevelBand.EXPERT]: {
    band: LevelBand.EXPERT,
    name: 'エキスパート',
    minSteps: 30001,
    maxSteps: 50000,
    color: '#FF9800', // Orange
  },
  [LevelBand.MASTER]: {
    band: LevelBand.MASTER,
    name: 'マスター',
    minSteps: 50001,
    maxSteps: null,
    color: '#FFD700', // Gold
  },
};

/**
 * 累計歩数からレベル帯を取得
 */
export const getLevelBandFromSteps = (totalSteps: number): LevelBand => {
  if (totalSteps <= 1000) return LevelBand.BEGINNER;
  if (totalSteps <= 5000) return LevelBand.NOVICE;
  if (totalSteps <= 15000) return LevelBand.INTERMEDIATE;
  if (totalSteps <= 30000) return LevelBand.ADVANCED;
  if (totalSteps <= 50000) return LevelBand.EXPERT;
  return LevelBand.MASTER;
};

/**
 * 順位に応じたバッジを取得
 */
export const getBadgeForRank = (
  rank: number
): 'champion' | 'top3' | 'top10' | undefined => {
  if (rank === 1) return 'champion';
  if (rank <= 3) return 'top3';
  if (rank <= 10) return 'top10';
  return undefined;
};

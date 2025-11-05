/**
 * Streak Entity
 * ストリーク（連続達成日数）を表すエンティティ
 */

export interface Streak {
  userId: string;
  currentStreak: number; // 現在の連続日数
  maxStreak: number; // 最大記録
  freezeDaysUsed: number; // 今週使った休息日数
  lastCompletionDate: Date; // 最後にクエストを完了した日
  startDate: Date; // 現在のストリーク開始日
  createdAt: Date;
  updatedAt: Date;
}

export interface FreezeDay {
  userId: string;
  usedDate: Date; // 使用した日付
  weekStartDate: Date; // その週の開始日
  createdAt: Date;
}

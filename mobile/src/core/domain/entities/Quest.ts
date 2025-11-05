/**
 * Quest Entity
 * 毎日のクエスト（タスク）を表すエンティティ
 */

export enum QuestType {
  SMALL = 'small',           // 小クエスト（15-30分）
  MEDIUM = 'medium',         // 中クエスト（30-60分）
  VALIDATION = 'validation'  // 検証クエスト（10-20分）
}

export enum QuestDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  CHALLENGING = 'challenging'
}

export enum QuestStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  OBSTRUCTED = 'obstructed'
}

export enum EvidenceType {
  TEXT = 'text',
  IMAGE = 'image',
  URL = 'url',
  NONE = 'none'
}

export interface Quest {
  id: string;
  questBundleId: string;
  type: QuestType;
  title: string;
  description: string;
  estimatedTime: number; // 分単位
  difficulty: QuestDifficulty;
  completionCriteria: string;
  evidenceType: EvidenceType;
  contributesToStation: number; // どの合目への貢献か（1-10）
  order: number; // クエストの順序
  status: QuestStatus;
  createdAt: Date;
  validUntil: Date; // このクエストが有効な期限
}

export interface QuestLog {
  id: string;
  questId: string;
  userId: string;
  status: QuestStatus;
  actualTime?: number; // 実際にかかった時間（分）
  skipReason?: string;
  skipMemo?: string;
  obstacle?: string;
  obstacleDetails?: string;
  contingencyPlan?: string;
  evidenceType?: EvidenceType;
  evidenceUrl?: string;
  evidenceNote?: string;
  memo?: string;
  stepsEarned: number; // 獲得した歩数
  completedAt?: Date;
  createdAt: Date;
  isSynced: boolean; // サーバーと同期済みか
}

export interface QuestBundle {
  id: string;
  userId: string;
  date: Date;
  quests: Quest[];
  createdAt: Date;
  validUntil: Date;
}

/**
 * Milestone Data Model
 * SQLiteデータモデルとドメインエンティティ間の変換
 */

import { Milestone, MilestoneStatus } from '@/core/domain/entities/Milestone';

/**
 * SQLiteのmilestonesテーブルのレコード型
 */
export interface MilestoneModel {
  id: string;
  goal_id: string;
  station: number;
  title: string;
  description: string | null;
  estimated_duration: string | null;
  achievement_criteria: string | null;
  status: string;
  completed_at: string | null; // ISO 8601
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  is_synced: number; // 0 or 1
}

/**
 * MilestoneMapper
 * データモデル ↔ ドメインエンティティ変換
 */
export class MilestoneMapper {
  /**
   * データモデル → ドメインエンティティ
   */
  static toDomain(model: MilestoneModel): Milestone {
    return {
      id: model.id,
      goalId: model.goal_id,
      station: model.station,
      title: model.title,
      description: model.description || undefined,
      estimatedDuration: model.estimated_duration || undefined,
      achievementCriteria: model.achievement_criteria || undefined,
      status: model.status as MilestoneStatus,
      completedAt: model.completed_at ? new Date(model.completed_at) : undefined,
      createdAt: new Date(model.created_at),
      updatedAt: new Date(model.updated_at),
    };
  }

  /**
   * ドメインエンティティ → データモデル
   */
  static toModel(entity: Milestone, isSynced: boolean = false): MilestoneModel {
    return {
      id: entity.id,
      goal_id: entity.goalId,
      station: entity.station,
      title: entity.title,
      description: entity.description || null,
      estimated_duration: entity.estimatedDuration || null,
      achievement_criteria: entity.achievementCriteria || null,
      status: entity.status,
      completed_at: entity.completedAt ? entity.completedAt.toISOString() : null,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
      is_synced: isSynced ? 1 : 0,
    };
  }
}

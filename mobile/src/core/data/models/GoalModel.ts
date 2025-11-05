/**
 * Goal Data Model
 * SQLiteデータモデルとドメインエンティティ間の変換
 */

import { Goal, GoalStatus } from '@/core/domain/entities/Goal';

/**
 * SQLiteのgoalsテーブルのレコード型
 */
export interface GoalModel {
  id: string;
  user_id: string;
  title: string;
  kpi: string;
  duration: string;
  deadline: string | null;
  obstacles: string; // JSON string
  plans: string; // JSON string
  status: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  is_synced: number; // 0 or 1
}

/**
 * GoalMapper
 * データモデル ↔ ドメインエンティティ変換
 */
export class GoalMapper {
  /**
   * データモデル → ドメインエンティティ
   */
  static toDomain(model: GoalModel): Goal {
    return {
      id: model.id,
      userId: model.user_id,
      title: model.title,
      kpi: model.kpi,
      duration: model.duration,
      deadline: model.deadline ? new Date(model.deadline) : undefined,
      obstacles: JSON.parse(model.obstacles || '[]'),
      plans: JSON.parse(model.plans || '[]'),
      status: model.status as GoalStatus,
      createdAt: new Date(model.created_at),
      updatedAt: new Date(model.updated_at),
    };
  }

  /**
   * ドメインエンティティ → データモデル
   */
  static toModel(entity: Goal, isSynced: boolean = false): GoalModel {
    return {
      id: entity.id,
      user_id: entity.userId,
      title: entity.title,
      kpi: entity.kpi,
      duration: entity.duration,
      deadline: entity.deadline ? entity.deadline.toISOString() : null,
      obstacles: JSON.stringify(entity.obstacles),
      plans: JSON.stringify(entity.plans),
      status: entity.status,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
      is_synced: isSynced ? 1 : 0,
    };
  }
}

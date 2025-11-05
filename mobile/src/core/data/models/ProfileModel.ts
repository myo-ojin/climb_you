/**
 * Profile Data Model
 * SQLiteデータモデルとドメインエンティティ間の変換
 */

import { OnboardingProfile } from '@/core/domain/repositories/ProfileRepository';

/**
 * SQLiteのuser_profilesテーブルのレコード型
 */
export interface ProfileModel {
  user_id: string;
  daily_commit_time: string;
  lifestyle: string | null;
  focus_time: string | null;
  work_environment: string | null;
  task_pace: string | null;
  past_failure_reason: string | null;
  skill_level: string | null;
  difficulty_preference: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  is_synced: number; // 0 or 1
}

/**
 * ProfileMapper
 * データモデル ↔ ドメインエンティティ変換
 */
export class ProfileMapper {
  /**
   * データモデル → ドメインエンティティ
   */
  static toDomain(model: ProfileModel): OnboardingProfile {
    return {
      userId: model.user_id,
      dailyCommitTime: model.daily_commit_time,
      lifestyle: model.lifestyle || undefined,
      focusTime: model.focus_time || undefined,
      workEnvironment: model.work_environment || undefined,
      taskPace: model.task_pace || undefined,
      pastFailureReason: model.past_failure_reason || undefined,
      skillLevel: model.skill_level || undefined,
      difficultyPreference: model.difficulty_preference || undefined,
      createdAt: new Date(model.created_at),
      updatedAt: new Date(model.updated_at),
    };
  }

  /**
   * ドメインエンティティ → データモデル
   */
  static toModel(entity: OnboardingProfile, isSynced: boolean = false): ProfileModel {
    return {
      user_id: entity.userId,
      daily_commit_time: entity.dailyCommitTime,
      lifestyle: entity.lifestyle || null,
      focus_time: entity.focusTime || null,
      work_environment: entity.workEnvironment || null,
      task_pace: entity.taskPace || null,
      past_failure_reason: entity.pastFailureReason || null,
      skill_level: entity.skillLevel || null,
      difficulty_preference: entity.difficultyPreference || null,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
      is_synced: isSynced ? 1 : 0,
    };
  }
}

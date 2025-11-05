/**
 * Profile Repository Implementation
 * ユーザープロファイルデータの永続化実装
 */

import {
  ProfileRepository,
  OnboardingProfile,
  CreateProfileDTO,
} from '@/core/domain/repositories/ProfileRepository';
import { LocalDataSource } from '../datasources/LocalDataSource';
import { ProfileMapper } from '../models/ProfileModel';

export class ProfileRepositoryImpl implements ProfileRepository {
  constructor(private localDataSource: LocalDataSource) {}

  /**
   * プロファイルを作成（ローカル保存）
   */
  async createProfile(profileData: CreateProfileDTO): Promise<OnboardingProfile> {
    try {
      const now = new Date();
      const profile: OnboardingProfile = {
        userId: profileData.userId,
        dailyCommitTime: profileData.dailyCommitTime,
        lifestyle: profileData.lifestyle,
        focusTime: profileData.focusTime,
        workEnvironment: profileData.workEnvironment,
        taskPace: profileData.taskPace,
        pastFailureReason: profileData.pastFailureReason,
        skillLevel: profileData.skillLevel,
        difficultyPreference: profileData.difficultyPreference,
        createdAt: now,
        updatedAt: now,
      };

      await this.localDataSource.saveProfile(profile);

      return profile;
    } catch (error) {
      console.error('Failed to create profile:', error);
      throw error;
    }
  }

  /**
   * ユーザーIDでプロファイルを取得
   */
  async getProfileByUserId(userId: string): Promise<OnboardingProfile | null> {
    try {
      return await this.localDataSource.getProfile(userId);
    } catch (error) {
      console.error('Failed to get profile by user id:', error);
      throw error;
    }
  }

  /**
   * プロファイルを更新
   */
  async updateProfile(profile: OnboardingProfile): Promise<OnboardingProfile> {
    try {
      profile.updatedAt = new Date();
      await this.localDataSource.updateProfile(profile);
      return profile;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * プロファイルを削除
   */
  async deleteProfile(userId: string): Promise<void> {
    try {
      await this.localDataSource.deleteProfile(userId);
    } catch (error) {
      console.error('Failed to delete profile:', error);
      throw error;
    }
  }
}

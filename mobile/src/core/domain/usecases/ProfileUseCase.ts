/**
 * Profile Use Case
 * ユーザープロファイルに関するビジネスロジック
 */

import {
  ProfileRepository,
  OnboardingProfile,
  CreateProfileDTO,
} from '../repositories/ProfileRepository';

export class ProfileUseCase {
  constructor(private profileRepository: ProfileRepository) {}

  /**
   * プロファイルを作成
   */
  async createProfile(profileData: CreateProfileDTO): Promise<OnboardingProfile> {
    // バリデーション
    if (!profileData.userId) {
      throw new Error('User ID is required');
    }

    if (!profileData.dailyCommitTime) {
      throw new Error('Daily commit time is required');
    }

    return this.profileRepository.createProfile(profileData);
  }

  /**
   * プロファイルを取得
   */
  async getProfile(userId: string): Promise<OnboardingProfile | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return this.profileRepository.getProfileByUserId(userId);
  }

  /**
   * プロファイルを更新
   */
  async updateProfile(profile: OnboardingProfile): Promise<OnboardingProfile> {
    if (!profile.userId) {
      throw new Error('User ID is required');
    }

    return this.profileRepository.updateProfile(profile);
  }

  /**
   * プロファイルを削除
   */
  async deleteProfile(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return this.profileRepository.deleteProfile(userId);
  }

  /**
   * プロファイルが存在するか確認
   */
  async hasProfile(userId: string): Promise<boolean> {
    const profile = await this.getProfile(userId);
    return profile !== null;
  }
}

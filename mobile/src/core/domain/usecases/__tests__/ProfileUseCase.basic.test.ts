/**
 * ProfileUseCase Basic Tests
 * プロファイルユースケースの基本テスト
 */

import { ProfileUseCase } from '../ProfileUseCase';
import type { ProfileRepository, OnboardingProfile, CreateProfileDTO } from '../../repositories/ProfileRepository';

describe('ProfileUseCase - Basic Tests', () => {
  let profileUseCase: ProfileUseCase;
  let mockRepository: jest.Mocked<ProfileRepository>;

  beforeEach(() => {
    mockRepository = {
      createProfile: jest.fn(),
      getProfileByUserId: jest.fn(),
      updateProfile: jest.fn(),
      deleteProfile: jest.fn(),
    } as any;

    profileUseCase = new ProfileUseCase(mockRepository);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('インスタンスを作成できること', () => {
      expect(profileUseCase).toBeInstanceOf(ProfileUseCase);
    });
  });

  describe('createProfile', () => {
    it('プロファイルを作成できること', async () => {
      const mockProfile: OnboardingProfile = {
        userId: 'user-1',
        dailyCommitTime: '09:00',
        lifestyle: 'active',
        workEnvironment: 'office',
        focusTime: 'morning',
        difficultyPreference: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRepository.createProfile.mockResolvedValue(mockProfile);

      const profileData: CreateProfileDTO = {
        userId: 'user-1',
        dailyCommitTime: '09:00',
        lifestyle: 'active',
        workEnvironment: 'office',
        focusTime: 'morning',
        difficultyPreference: 'medium',
      };

      const result = await profileUseCase.createProfile(profileData);

      expect(result).toEqual(mockProfile);
      expect(mockRepository.createProfile).toHaveBeenCalledWith(profileData);
    });

    it('User IDがない場合はエラーをスローすること', async () => {
      const profileData: CreateProfileDTO = {
        userId: '',
        dailyCommitTime: '09:00',
      } as any;

      await expect(profileUseCase.createProfile(profileData)).rejects.toThrow('User ID is required');
    });

    it('dailyCommitTimeがない場合はエラーをスローすること', async () => {
      const profileData: CreateProfileDTO = {
        userId: 'user-1',
        dailyCommitTime: '',
      } as any;

      await expect(profileUseCase.createProfile(profileData)).rejects.toThrow('Daily commit time is required');
    });
  });

  describe('getProfile', () => {
    it('プロファイルを取得できること', async () => {
      const mockProfile: OnboardingProfile = {
        userId: 'user-1',
        dailyCommitTime: '09:00',
        lifestyle: 'active',
        workEnvironment: 'office',
        focusTime: 'morning',
        difficultyPreference: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRepository.getProfileByUserId.mockResolvedValue(mockProfile);

      const result = await profileUseCase.getProfile('user-1');

      expect(result).toEqual(mockProfile);
      expect(mockRepository.getProfileByUserId).toHaveBeenCalledWith('user-1');
    });

    it('User IDがない場合はエラーをスローすること', async () => {
      await expect(profileUseCase.getProfile('')).rejects.toThrow('User ID is required');
    });
  });
});

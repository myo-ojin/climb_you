/**
 * ProfileRepositoryImpl Tests
 * プロファイルリポジトリの実装テスト
 */

import { ProfileRepositoryImpl } from './ProfileRepositoryImpl';
import type { LocalDataSource } from '../datasources/LocalDataSource';
import type {
  OnboardingProfile,
  CreateProfileDTO,
} from '@/core/domain/repositories/ProfileRepository';

// モック定義
class MockLocalDataSource implements Partial<LocalDataSource> {
  saveProfile = jest.fn();
  getProfile = jest.fn();
  updateProfile = jest.fn();
  deleteProfile = jest.fn();
}

describe('ProfileRepositoryImpl', () => {
  let repository: ProfileRepositoryImpl;
  let mockLocal: MockLocalDataSource;

  const mockProfile: OnboardingProfile = {
    userId: 'user-1',
    dailyCommitTime: '朝',
    lifestyle: 'アクティブ',
    focusTime: '午前中',
    workEnvironment: 'リモート',
    taskPace: 'マイペース',
    pastFailureReason: '時間がない',
    skillLevel: '中級',
    difficultyPreference: 'medium',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    mockLocal = new MockLocalDataSource();
    repository = new ProfileRepositoryImpl(mockLocal as LocalDataSource);
    jest.clearAllMocks();
  });

  describe('createProfile', () => {
    it('プロファイルを作成してローカルに保存できること', async () => {
      const profileData: CreateProfileDTO = {
        userId: 'user-1',
        dailyCommitTime: '朝',
        lifestyle: 'アクティブ',
        focusTime: '午前中',
        workEnvironment: 'リモート',
        taskPace: 'マイペース',
        pastFailureReason: '時間がない',
        skillLevel: '中級',
        difficultyPreference: 'medium',
      };

      mockLocal.saveProfile.mockResolvedValue(undefined);

      const result = await repository.createProfile(profileData);

      expect(result.userId).toBe('user-1');
      expect(result.dailyCommitTime).toBe('朝');
      expect(result.lifestyle).toBe('アクティブ');
      expect(result.difficultyPreference).toBe('medium');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(mockLocal.saveProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          dailyCommitTime: '朝',
        })
      );
    });

    it('作成時にタイムスタンプが設定されること', async () => {
      const profileData: CreateProfileDTO = {
        userId: 'user-1',
        dailyCommitTime: '朝',
        lifestyle: 'アクティブ',
        focusTime: '午前中',
        workEnvironment: 'リモート',
        taskPace: 'マイペース',
        pastFailureReason: '時間がない',
        skillLevel: '中級',
        difficultyPreference: 'medium',
      };

      mockLocal.saveProfile.mockResolvedValue(undefined);

      const before = Date.now();
      const result = await repository.createProfile(profileData);
      const after = Date.now();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after);
      expect(result.updatedAt.getTime()).toBe(result.createdAt.getTime());
    });

    it('ローカル保存失敗時に例外をスローすること', async () => {
      const profileData: CreateProfileDTO = {
        userId: 'user-1',
        dailyCommitTime: '朝',
        lifestyle: 'アクティブ',
        focusTime: '午前中',
        workEnvironment: 'リモート',
        taskPace: 'マイペース',
        pastFailureReason: '時間がない',
        skillLevel: '中級',
        difficultyPreference: 'medium',
      };

      mockLocal.saveProfile.mockRejectedValue(new Error('Database error'));

      await expect(repository.createProfile(profileData)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getProfileByUserId', () => {
    it('ユーザーIDでプロファイルを取得できること', async () => {
      mockLocal.getProfile.mockResolvedValue(mockProfile);

      const result = await repository.getProfileByUserId('user-1');

      expect(result).toEqual(mockProfile);
      expect(mockLocal.getProfile).toHaveBeenCalledWith('user-1');
    });

    it('プロファイルが見つからない場合はnullを返すこと', async () => {
      mockLocal.getProfile.mockResolvedValue(null);

      const result = await repository.getProfileByUserId('non-existent');

      expect(result).toBeNull();
      expect(mockLocal.getProfile).toHaveBeenCalledWith('non-existent');
    });

    it('データベースエラー時に例外をスローすること', async () => {
      mockLocal.getProfile.mockRejectedValue(new Error('DB error'));

      await expect(repository.getProfileByUserId('user-1')).rejects.toThrow(
        'DB error'
      );
    });
  });

  describe('updateProfile', () => {
    it('プロファイルを更新できること', async () => {
      const updatedProfile = {
        ...mockProfile,
        dailyCommitTime: '夜',
        lifestyle: '静的',
      };
      mockLocal.updateProfile.mockResolvedValue(undefined);

      const result = await repository.updateProfile(updatedProfile);

      expect(result.dailyCommitTime).toBe('夜');
      expect(result.lifestyle).toBe('静的');
      expect(mockLocal.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          dailyCommitTime: '夜',
          lifestyle: '静的',
        })
      );
    });

    it('更新時にupdatedAtが更新されること', async () => {
      const oldDate = new Date('2025-01-01');
      const profileToUpdate = { ...mockProfile, updatedAt: oldDate };
      mockLocal.updateProfile.mockResolvedValue(undefined);

      const before = Date.now();
      const result = await repository.updateProfile(profileToUpdate);
      const after = Date.now();

      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after);
      expect(result.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('更新失敗時に例外をスローすること', async () => {
      mockLocal.updateProfile.mockRejectedValue(new Error('Update failed'));

      await expect(repository.updateProfile(mockProfile)).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('deleteProfile', () => {
    it('プロファイルを削除できること', async () => {
      mockLocal.deleteProfile.mockResolvedValue(undefined);

      await repository.deleteProfile('user-1');

      expect(mockLocal.deleteProfile).toHaveBeenCalledWith('user-1');
    });

    it('削除失敗時に例外をスローすること', async () => {
      mockLocal.deleteProfile.mockRejectedValue(new Error('Delete failed'));

      await expect(repository.deleteProfile('user-1')).rejects.toThrow(
        'Delete failed'
      );
    });
  });
});

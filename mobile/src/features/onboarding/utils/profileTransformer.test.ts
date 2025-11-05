/**
 * Unit Tests for Profile Transformer
 * プロファイル変換、検証、分析のテスト
 */

import {
  parseCommitTimeToMinutes,
  formatMinutesToCommitTime,
  normalizeProfileData,
  validateProfileData,
  transformProfileToAPIRequest,
  transformAPIResponseToProfile,
  extractProfileInsights,
  areProfilesEqual,
  PROFILE_QUESTIONS,
  COMMIT_TIME_OPTIONS,
  NormalizedProfileData,
  ProfileAPIResponse,
} from './profileTransformer';
import { UserProfileData } from '../types';

describe('Profile Transformer', () => {
  // サンプルデータ
  const mockProfileData: UserProfileData = {
    lifestyle: '会社員（9-18時）',
    focusTime: '朝（6-9時）',
    workEnvironment: '自宅',
    taskPace: '毎日少しずつ',
    pastFailureReason: 'モチベーション低下',
    skillLevel: 'ある程度できる',
    difficultyPreference: '少し頑張れば達成できること',
  };

  const mockAPIResponse: ProfileAPIResponse = {
    profile_id: 'prof_1',
    user_id: 'user_1',
    daily_commit_time: '30分',
    lifestyle: '会社員（9-18時）',
    focus_time: '朝（6-9時）',
    work_environment: '自宅',
    task_pace: '毎日少しずつ',
    past_failure_reason: 'モチベーション低下',
    skill_level: 'ある程度できる',
    difficulty_preference: '少し頑張れば達成できること',
    created_at: '2025-10-22T00:00:00Z',
    updated_at: '2025-10-22T00:00:00Z',
  };

  describe('parseCommitTimeToMinutes', () => {
    it('should parse "15分" to 15 minutes', () => {
      expect(parseCommitTimeToMinutes('15分')).toBe(15);
    });

    it('should parse "30分" to 30 minutes', () => {
      expect(parseCommitTimeToMinutes('30分')).toBe(30);
    });

    it('should parse "1時間" to 60 minutes', () => {
      expect(parseCommitTimeToMinutes('1時間')).toBe(60);
    });

    it('should parse "2時間" to 120 minutes', () => {
      expect(parseCommitTimeToMinutes('2時間')).toBe(120);
    });

    it('should return 30 minutes as default for unknown format', () => {
      expect(parseCommitTimeToMinutes('不明')).toBe(30);
    });
  });

  describe('formatMinutesToCommitTime', () => {
    it('should format 15 minutes to "15分"', () => {
      expect(formatMinutesToCommitTime(15)).toBe('15分');
    });

    it('should format 30 minutes to "30分"', () => {
      expect(formatMinutesToCommitTime(30)).toBe('30分');
    });

    it('should format 60 minutes to "1時間"', () => {
      expect(formatMinutesToCommitTime(60)).toBe('1時間');
    });

    it('should format 120 minutes to "2時間"', () => {
      expect(formatMinutesToCommitTime(120)).toBe('2時間');
    });

    it('should format mixed time correctly', () => {
      expect(formatMinutesToCommitTime(90)).toBe('1時間30分');
    });
  });

  describe('normalizeProfileData', () => {
    it('should normalize profile data correctly', () => {
      const result = normalizeProfileData(mockProfileData);

      expect(result.lifestyle).toBe('会社員（9-18時）');
      expect(result.focusTime).toBe('朝（6-9時）');
      expect(result.workEnvironment).toBe('自宅');
      expect(result.taskPace).toBe('毎日少しずつ');
    });

    it('should trim whitespace', () => {
      const profileWithWhitespace = {
        ...mockProfileData,
        lifestyle: '  会社員（9-18時）  ',
      };

      const result = normalizeProfileData(profileWithWhitespace);
      expect(result.lifestyle).toBe('会社員（9-18時）');
    });

    it('should handle missing fields', () => {
      const result = normalizeProfileData({});

      expect(result.lifestyle).toBe('');
      expect(result.focusTime).toBe('');
      expect(result.workEnvironment).toBe('');
    });
  });

  describe('validateProfileData', () => {
    it('should validate correct profile data', () => {
      const normalized = normalizeProfileData(mockProfileData);
      const result = validateProfileData(normalized);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect missing lifestyle', () => {
      const incompleteProfile: NormalizedProfileData = {
        ...normalizeProfileData(mockProfileData),
        lifestyle: '',
      };

      const result = validateProfileData(incompleteProfile);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('生活パターンを選択してください');
    });

    it('should detect multiple missing fields', () => {
      const incompleteProfile: NormalizedProfileData = {
        lifestyle: '',
        focusTime: '',
        workEnvironment: '自宅',
        taskPace: '毎日少しずつ',
        pastFailureReason: '',
        skillLevel: '',
        difficultyPreference: '',
      };

      const result = validateProfileData(incompleteProfile);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });

  describe('transformProfileToAPIRequest', () => {
    it('should transform profile to API request format', () => {
      const normalized = normalizeProfileData(mockProfileData);
      const result = transformProfileToAPIRequest('user_123', '30分', normalized);

      expect(result.user_id).toBe('user_123');
      expect(result.daily_commit_time).toBe('30分');
      expect(result.lifestyle).toBe('会社員（9-18時）');
      expect(result.focus_time).toBe('朝（6-9時）');
    });

    it('should use snake_case for API fields', () => {
      const normalized = normalizeProfileData(mockProfileData);
      const result = transformProfileToAPIRequest('user_123', '30分', normalized);

      expect(result).toHaveProperty('focus_time');
      expect(result).toHaveProperty('work_environment');
      expect(result).toHaveProperty('task_pace');
      expect(result).toHaveProperty('past_failure_reason');
      expect(result).toHaveProperty('skill_level');
      expect(result).toHaveProperty('difficulty_preference');
    });
  });

  describe('transformAPIResponseToProfile', () => {
    it('should transform API response to profile format', () => {
      const result = transformAPIResponseToProfile(mockAPIResponse);

      expect(result.lifestyle).toBe('会社員（9-18時）');
      expect(result.focusTime).toBe('朝（6-9時）');
      expect(result.workEnvironment).toBe('自宅');
      expect(result.taskPace).toBe('毎日少しずつ');
      expect(result.pastFailureReason).toBe('モチベーション低下');
      expect(result.skillLevel).toBe('ある程度できる');
      expect(result.difficultyPreference).toBe('少し頑張れば達成できること');
    });

    it('should convert snake_case to camelCase', () => {
      const result = transformAPIResponseToProfile(mockAPIResponse);

      expect(result).toHaveProperty('focusTime');
      expect(result).toHaveProperty('workEnvironment');
      expect(result).toHaveProperty('taskPace');
      expect(result).toHaveProperty('pastFailureReason');
      expect(result).toHaveProperty('skillLevel');
      expect(result).toHaveProperty('difficultyPreference');
    });
  });

  describe('extractProfileInsights', () => {
    it('should extract insights from profile data', () => {
      const normalized = normalizeProfileData(mockProfileData);
      const insights = extractProfileInsights('30分', normalized);

      expect(insights.availableMinutesPerDay).toBe(30);
      expect(insights.preferredFocusTime).toBe('朝（6-9時）');
      expect(insights.workEnvironment).toBe('自宅');
      expect(insights.preferredPace).toBe('daily');
    });

    it('should estimate difficulty as easy for beginners', () => {
      const beginnerProfile: NormalizedProfileData = normalizeProfileData({
        ...mockProfileData,
        skillLevel: '全くの初心者',
      });

      const insights = extractProfileInsights('30分', beginnerProfile);

      expect(insights.estimatedDifficultyLevel).toBe('easy');
    });

    it('should estimate difficulty as hard for experienced users', () => {
      const expertProfile: NormalizedProfileData = normalizeProfileData({
        ...mockProfileData,
        skillLevel: '経験豊富',
      });

      const insights = extractProfileInsights('30分', expertProfile);

      expect(insights.estimatedDifficultyLevel).toBe('hard');
    });

    it('should identify common obstacles', () => {
      const profileWithMotivationIssue: NormalizedProfileData = normalizeProfileData(
        {
          ...mockProfileData,
          pastFailureReason: 'モチベーション低下',
        }
      );

      const insights = extractProfileInsights('30分', profileWithMotivationIssue);

      expect(insights.commonObstacles).toContain('モチベーション低下');
    });

    it('should detect weekly pace preference', () => {
      const weeklyProfile: NormalizedProfileData = normalizeProfileData({
        ...mockProfileData,
        taskPace: '週末にまとめて',
      });

      const insights = extractProfileInsights('30分', weeklyProfile);

      expect(insights.preferredPace).toBe('weekly');
    });

    it('should detect flexible pace preference', () => {
      const flexibleProfile: NormalizedProfileData = normalizeProfileData({
        ...mockProfileData,
        taskPace: '気分次第で柔軟に',
      });

      const insights = extractProfileInsights('30分', flexibleProfile);

      expect(insights.preferredPace).toBe('flexible');
    });
  });

  describe('areProfilesEqual', () => {
    it('should return true for identical profiles', () => {
      const profile1 = mockProfileData;
      const profile2 = { ...mockProfileData };

      expect(areProfilesEqual(profile1, profile2)).toBe(true);
    });

    it('should return false for different profiles', () => {
      const profile1 = mockProfileData;
      const profile2: UserProfileData = {
        ...mockProfileData,
        lifestyle: 'フリーランス',
      };

      expect(areProfilesEqual(profile1, profile2)).toBe(false);
    });

    it('should detect difference in single field', () => {
      const profile1 = mockProfileData;
      const profile2: UserProfileData = {
        ...mockProfileData,
        focusTime: '夜（18-21時）',
      };

      expect(areProfilesEqual(profile1, profile2)).toBe(false);
    });
  });

  describe('PROFILE_QUESTIONS', () => {
    it('should have 7 profile questions', () => {
      expect(PROFILE_QUESTIONS.length).toBe(7);
    });

    it('should have all required question properties', () => {
      PROFILE_QUESTIONS.forEach((question) => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('options');
        expect(Array.isArray(question.options)).toBe(true);
        expect(question.options.length).toBeGreaterThan(0);
      });
    });

    it('should have unique question IDs', () => {
      const ids = PROFILE_QUESTIONS.map((q) => q.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('COMMIT_TIME_OPTIONS', () => {
    it('should have commit time options', () => {
      expect(COMMIT_TIME_OPTIONS.length).toBeGreaterThan(0);
    });

    it('should include standard time options', () => {
      expect(COMMIT_TIME_OPTIONS).toContain('15分');
      expect(COMMIT_TIME_OPTIONS).toContain('30分');
      expect(COMMIT_TIME_OPTIONS).toContain('1時間');
      expect(COMMIT_TIME_OPTIONS).toContain('2時間');
    });
  });
});

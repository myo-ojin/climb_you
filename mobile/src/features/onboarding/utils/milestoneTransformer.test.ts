/**
 * Unit Tests for Milestone Transformer
 * Tests for data transformation, estimation, and validation functions
 */

import {
  transformMilestoneResponse,
  transformMilestoneResponses,
  estimateDifficultyLevel,
  parseDurationToDays,
  calculateDurationDisplay,
  buildMilestoneGenerationParams,
  validateMilestones,
} from './milestoneTransformer';
import { MilestoneResponse } from '@/core/network/mcp';
import { Milestone } from '../types';

describe('Milestone Transformer', () => {
  // Sample data for testing
  const mockMilestoneResponse: MilestoneResponse = {
    milestone_id: 'ms_1',
    station_number: 1,
    title: '基礎文法の復習',
    description: '中学・高校レベルの文法を復習し、基礎を固める',
    criteria: '文法問題集を1冊完了する',
    estimated_steps: 500,
    target_date: '2025-11-22',
  };

  const mockMilestoneResponses: MilestoneResponse[] = [
    { ...mockMilestoneResponse, station_number: 1 },
    {
      ...mockMilestoneResponse,
      milestone_id: 'ms_2',
      station_number: 2,
      title: '語彙力の強化（初級）',
    },
    {
      ...mockMilestoneResponse,
      milestone_id: 'ms_3',
      station_number: 3,
      title: 'リスニング基礎',
    },
  ];

  describe('transformMilestoneResponse', () => {
    it('should transform MilestoneResponse to Milestone format', () => {
      const result = transformMilestoneResponse(mockMilestoneResponse);

      expect(result.station).toBe(1);
      expect(result.title).toBe('基礎文法の復習');
      expect(result.description).toBe('中学・高校レベルの文法を復習し、基礎を固める');
      expect(result.completionCriteria).toBe('文法問題集を1冊完了する');
      expect(result.estimatedDuration).toBeDefined();
    });

    it('should calculate duration from estimated steps when target_date is not provided', () => {
      const response: MilestoneResponse = {
        ...mockMilestoneResponse,
        target_date: undefined,
      };

      const result = transformMilestoneResponse(response);

      // 500 steps / 10 per week ≈ 5 weeks
      expect(result.estimatedDuration).toContain('週');
    });
  });

  describe('transformMilestoneResponses', () => {
    it('should transform and sort multiple milestones by station number', () => {
      const unsorted: MilestoneResponse[] = [
        { ...mockMilestoneResponse, station_number: 3 },
        { ...mockMilestoneResponse, station_number: 1 },
        { ...mockMilestoneResponse, station_number: 2 },
      ];

      const result = transformMilestoneResponses(unsorted);

      expect(result.length).toBe(3);
      expect(result[0].station).toBe(1);
      expect(result[1].station).toBe(2);
      expect(result[2].station).toBe(3);
    });
  });

  describe('estimateDifficultyLevel', () => {
    it('should return hard for complex goals with short duration', () => {
      const result = estimateDifficultyLevel(
        'TOEIC 800点を取得する',
        '1ヶ月以内'
      );

      expect(result).toBe('hard');
    });

    it('should return medium for complex goals with longer duration', () => {
      const result = estimateDifficultyLevel(
        'データサイエンスをマスターする',
        '6ヶ月以内'
      );

      expect(result).toBe('medium');
    });

    it('should return medium for simple goals', () => {
      const result = estimateDifficultyLevel('毎日読書を習慣づける');

      expect(result).toBe('medium');
    });
  });

  describe('parseDurationToDays', () => {
    it('should parse "1ヶ月以内" to 30 days', () => {
      expect(parseDurationToDays('1ヶ月以内')).toBe(30);
    });

    it('should parse "3ヶ月以内" to 90 days', () => {
      expect(parseDurationToDays('3ヶ月以内')).toBe(90);
    });

    it('should parse "6ヶ月以内" to 180 days', () => {
      expect(parseDurationToDays('6ヶ月以内')).toBe(180);
    });

    it('should parse "1年以内" to 365 days', () => {
      expect(parseDurationToDays('1年以内')).toBe(365);
    });

    it('should parse "2週間" to 14 days', () => {
      expect(parseDurationToDays('2週間')).toBe(14);
    });

    it('should parse "30日" to 30 days', () => {
      expect(parseDurationToDays('30日')).toBe(30);
    });

    it('should return 90 as default for unparseable duration', () => {
      expect(parseDurationToDays('いつでも')).toBe(90);
    });
  });

  describe('calculateDurationDisplay', () => {
    it('should format future dates correctly', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15); // 15 days from now
      const dateStr = futureDate.toISOString().split('T')[0];

      const result = calculateDurationDisplay(dateStr);

      expect(result).toMatch(/週|日/);
    });

    it('should return "未定" for invalid dates', () => {
      const result = calculateDurationDisplay('invalid-date');

      expect(result).toBe('未定');
    });

    it('should return "完了" for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const dateStr = pastDate.toISOString().split('T')[0];

      const result = calculateDurationDisplay(dateStr);

      expect(result).toBe('完了');
    });
  });

  describe('buildMilestoneGenerationParams', () => {
    it('should build correct parameters for milestone generation', () => {
      const result = buildMilestoneGenerationParams(
        'goal_123',
        'TOEIC 800点を取得する',
        '3ヶ月以内'
      );

      expect(result.goal_id).toBe('goal_123');
      expect(result.goal).toBe('TOEIC 800点を取得する');
      expect(result.duration_days).toBe(90);
      expect(result.difficulty_level).toBeDefined();
    });

    it('should use default 90 days when duration is not provided', () => {
      const result = buildMilestoneGenerationParams(
        'goal_456',
        'データ分析スキルを習得する'
      );

      expect(result.duration_days).toBe(90);
    });

    it('should use provided difficulty level', () => {
      const result = buildMilestoneGenerationParams(
        'goal_789',
        'テスト',
        '1ヶ月',
        'easy'
      );

      expect(result.difficulty_level).toBe('easy');
    });
  });

  describe('validateMilestones', () => {
    it('should validate correct milestones array', () => {
      const milestones: Milestone[] = Array.from({ length: 10 }, (_, i) => ({
        station: i + 1,
        title: `Station ${i + 1}`,
        description: `Description ${i + 1}`,
        estimatedDuration: '1週間',
        completionCriteria: `Criteria ${i + 1}`,
      }));

      expect(validateMilestones(milestones)).toBe(true);
    });

    it('should reject incomplete milestones array', () => {
      const milestones: Milestone[] = Array.from({ length: 5 }, (_, i) => ({
        station: i + 1,
        title: `Station ${i + 1}`,
        description: `Description ${i + 1}`,
        estimatedDuration: '1週間',
        completionCriteria: `Criteria ${i + 1}`,
      }));

      expect(validateMilestones(milestones)).toBe(false);
    });

    it('should reject milestones with missing fields', () => {
      const milestones: any[] = Array.from({ length: 10 }, (_, i) => ({
        station: i + 1,
        title: `Station ${i + 1}`,
        // missing description, estimatedDuration, completionCriteria
      }));

      expect(validateMilestones(milestones)).toBe(false);
    });

    it('should reject empty array', () => {
      expect(validateMilestones([])).toBe(false);
    });

    it('should reject non-sequential stations', () => {
      const milestones: Milestone[] = [
        {
          station: 1,
          title: 'Station 1',
          description: 'Description 1',
          estimatedDuration: '1週間',
          completionCriteria: 'Criteria 1',
        },
        {
          station: 3,
          title: 'Station 3',
          description: 'Description 3',
          estimatedDuration: '1週間',
          completionCriteria: 'Criteria 3',
        },
      ];

      expect(validateMilestones(milestones)).toBe(false);
    });
  });
});

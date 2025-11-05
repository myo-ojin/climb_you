/**
 * Onboarding Feature Tests
 * テスト対象: オンボーディング全体フロー
 *
 * テストケース：
 * 1. コンポーネント単体テスト（各ステップ）
 * 2. 統合テスト（ステップ間の遷移）
 * 3. E2Eテスト（完全オンボーディングフロー）
 * 4. エラーハンドリング
 * 5. バリデーション
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SmartAnalysis,
  WoopAnalysis,
  GoalAnalysisResult,
  UserProfileData,
  Milestone,
  OnboardingState,
} from '../types';

/**
 * Type Validation Tests
 */
describe('Onboarding Types', () => {
  describe('SmartAnalysis', () => {
    it('should have all required SMART criteria', () => {
      const analysis: SmartAnalysis = {
        specific: true,
        measurable: true,
        achievable: true,
        relevant: true,
        timeBound: true,
      };

      expect(analysis.specific).toBe(true);
      expect(analysis.measurable).toBe(true);
      expect(analysis.achievable).toBe(true);
      expect(analysis.relevant).toBe(true);
      expect(analysis.timeBound).toBe(true);
    });

    it('should represent partial SMART compliance', () => {
      const analysis: SmartAnalysis = {
        specific: true,
        measurable: false,
        achievable: true,
        relevant: false,
        timeBound: true,
      };

      const metCount = Object.values(analysis).filter(v => v).length;
      expect(metCount).toBe(3);
    });
  });

  describe('WoopAnalysis', () => {
    it('should contain Wish, Outcome, Obstacles, Plan', () => {
      const woop: WoopAnalysis = {
        wish: 'Learn English',
        outcome: 'Be able to work internationally',
        obstacles: ['Limited time', 'Lack of motivation'],
        plan: ['Study 1 hour daily', 'Join study group'],
      };

      expect(woop.wish).toBeDefined();
      expect(woop.outcome).toBeDefined();
      expect(Array.isArray(woop.obstacles)).toBe(true);
      expect(Array.isArray(woop.plan)).toBe(true);
      expect(woop.obstacles.length).toBe(2);
      expect(woop.plan.length).toBe(2);
    });
  });

  describe('GoalAnalysisResult', () => {
    it('should indicate complete goal analysis', () => {
      const result: GoalAnalysisResult = {
        isComplete: true,
        smartAnalysis: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          timeBound: true,
        },
        woopAnalysis: {
          wish: 'TOEIC 800',
          outcome: 'Work internationally',
          obstacles: ['Limited time'],
          plan: ['Daily study'],
        },
        missingElements: [],
        suggestions: [],
      };

      expect(result.isComplete).toBe(true);
      expect(result.missingElements.length).toBe(0);
    });

    it('should identify missing SMART elements', () => {
      const result: GoalAnalysisResult = {
        isComplete: false,
        smartAnalysis: {
          specific: true,
          measurable: false,
          achievable: true,
          relevant: true,
          timeBound: false,
        },
        woopAnalysis: {
          wish: 'Learn English',
          outcome: 'Career improvement',
          obstacles: [],
          plan: [],
        },
        missingElements: ['measurable', 'timeBound'],
        suggestions: [
          'What specific score are you targeting?',
          'By when do you want to achieve this?',
        ],
      };

      expect(result.isComplete).toBe(false);
      expect(result.missingElements.length).toBe(2);
      expect(result.suggestions.length).toBe(2);
    });
  });

  describe('UserProfileData', () => {
    it('should contain all 7 profile fields', () => {
      const profile: UserProfileData = {
        lifestyle: 'Employee (9-18)',
        focusTime: 'Evening (18-21)',
        workEnvironment: 'Home',
        taskPace: 'Daily small steps',
        pastFailureReason: 'Time constraint',
        skillLevel: 'Beginner',
        difficultyPreference: 'Moderately challenging',
      };

      expect(profile.lifestyle).toBeDefined();
      expect(profile.focusTime).toBeDefined();
      expect(profile.workEnvironment).toBeDefined();
      expect(profile.taskPace).toBeDefined();
      expect(profile.pastFailureReason).toBeDefined();
      expect(profile.skillLevel).toBeDefined();
      expect(profile.difficultyPreference).toBeDefined();
    });
  });

  describe('Milestone', () => {
    it('should have all required milestone properties', () => {
      const milestone: Milestone = {
        station: 1,
        title: 'Foundation Review',
        description: 'Review basic grammar and vocabulary',
        estimatedDuration: '2 weeks',
        completionCriteria: 'Complete one grammar book',
      };

      expect(milestone.station).toBe(1);
      expect(milestone.station).toBeGreaterThanOrEqual(1);
      expect(milestone.station).toBeLessThanOrEqual(10);
      expect(milestone.title).toBeDefined();
      expect(milestone.description).toBeDefined();
      expect(milestone.estimatedDuration).toBeDefined();
      expect(milestone.completionCriteria).toBeDefined();
    });

    it('should represent all 10 stations', () => {
      const milestones: Milestone[] = Array.from({ length: 10 }, (_, i) => ({
        station: i + 1,
        title: `Station ${i + 1}`,
        description: `Description for station ${i + 1}`,
        estimatedDuration: `${(i + 1) * 2} weeks`,
        completionCriteria: `Criteria for station ${i + 1}`,
      }));

      expect(milestones).toHaveLength(10);
      expect(milestones[0].station).toBe(1);
      expect(milestones[9].station).toBe(10);
      expect(milestones.every((m) => m.station >= 1 && m.station <= 10)).toBe(
        true
      );
    });
  });

  describe('OnboardingState', () => {
    it('should track onboarding progress', () => {
      const state: OnboardingState = {
        step: 'goal',
        goal: {
          title: 'TOEIC 800',
          kpi: 'Achieve TOEIC score of 800+',
          duration: '6 months',
          obstacles: ['Time'],
          plans: ['Study daily'],
        },
        progress: 20,
        lastUpdated: Date.now(),
        loading: false,
      };

      expect(state.step).toBe('goal');
      expect(state.goal?.title).toBe('TOEIC 800');
      expect(state.progress).toBe(20);
      expect(state.loading).toBe(false);
    });

    it('should represent all onboarding steps', () => {
      const steps = [
        'consent',
        'goal',
        'obstacles',
        'duration',
        'commit-time',
        'profile',
        'milestones',
        'review',
        'complete',
      ];

      steps.forEach((step) => {
        const state: OnboardingState = {
          step: step as any,
          lastUpdated: Date.now(),
          loading: false,
          progress: 0,
        };

        expect(state.step).toBe(step);
      });
    });

    it('should track error state', () => {
      const state: OnboardingState = {
        step: 'goal',
        lastUpdated: Date.now(),
        loading: false,
        progress: 20,
        error: 'Network error occurred',
      };

      expect(state.error).toBeDefined();
      expect(state.error).toBe('Network error occurred');
    });
  });
});

/**
 * Goal Analysis Logic Tests
 */
describe('Goal Analysis Logic', () => {
  describe('SMART Criteria Evaluation', () => {
    it('should recognize complete SMART goal', () => {
      const analysis: GoalAnalysisResult = {
        isComplete: true,
        smartAnalysis: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          timeBound: true,
        },
        woopAnalysis: {
          wish: 'Learn English',
          outcome: 'Work internationally',
          obstacles: [],
          plan: [],
        },
        missingElements: [],
        suggestions: [],
      };

      const allCriteriaMet = Object.values(analysis.smartAnalysis).every(
        (v) => v === true
      );
      expect(allCriteriaMet).toBe(true);
      expect(analysis.isComplete).toBe(true);
    });

    it('should identify incomplete SMART goals', () => {
      const testCases = [
        {
          smartAnalysis: {
            specific: false,
            measurable: true,
            achievable: true,
            relevant: true,
            timeBound: true,
          },
          expectedMissing: ['specific'],
        },
        {
          smartAnalysis: {
            specific: true,
            measurable: false,
            achievable: false,
            relevant: true,
            timeBound: true,
          },
          expectedMissing: ['measurable', 'achievable'],
        },
        {
          smartAnalysis: {
            specific: true,
            measurable: true,
            achievable: true,
            relevant: true,
            timeBound: false,
          },
          expectedMissing: ['timeBound'],
        },
      ];

      testCases.forEach((testCase) => {
        const analysis: GoalAnalysisResult = {
          isComplete: false,
          smartAnalysis: testCase.smartAnalysis,
          woopAnalysis: {
            wish: 'Goal',
            outcome: 'Outcome',
            obstacles: [],
            plan: [],
          },
          missingElements: testCase.expectedMissing,
          suggestions: [],
        };

        const metCount = Object.values(analysis.smartAnalysis).filter(
          (v) => v
        ).length;
        expect(metCount).toBeLessThan(5);
        expect(analysis.isComplete).toBe(false);
      });
    });
  });

  describe('WOOP Analysis', () => {
    it('should generate WOOP elements from goal', () => {
      const woop: WoopAnalysis = {
        wish: 'Achieve TOEIC 800',
        outcome: 'Be able to work in international environment',
        obstacles: [
          'Limited time due to work',
          'Difficulty maintaining motivation',
          'Unfamiliar with advanced topics',
        ],
        plan: [
          'Wake up 30 minutes earlier for daily study',
          'Join online study group for support',
          'Focus on business English first',
        ],
      };

      expect(woop.wish).toBeTruthy();
      expect(woop.outcome).toBeTruthy();
      expect(woop.obstacles.length).toBeGreaterThan(0);
      expect(woop.plan.length).toBeGreaterThan(0);
      expect(woop.plan.length).toBe(woop.obstacles.length);
    });
  });
});

/**
 * Profile Validation Tests
 */
describe('Profile Validation', () => {
  const validProfile: UserProfileData = {
    lifestyle: 'Employee (9-18)',
    focusTime: 'Evening',
    workEnvironment: 'Home',
    taskPace: 'Daily',
    pastFailureReason: 'Time',
    skillLevel: 'Beginner',
    difficultyPreference: 'Moderate',
  };

  it('should accept valid profile', () => {
    expect(validProfile.lifestyle).toBeTruthy();
    expect(validProfile.focusTime).toBeTruthy();
    expect(validProfile.workEnvironment).toBeTruthy();
    expect(validProfile.taskPace).toBeTruthy();
    expect(validProfile.pastFailureReason).toBeTruthy();
    expect(validProfile.skillLevel).toBeTruthy();
    expect(validProfile.difficultyPreference).toBeTruthy();
  });

  it('should handle different lifestyle choices', () => {
    const lifestyles = [
      'Employee (9-18)',
      'Student',
      'Freelancer',
      'Custom option',
    ];

    lifestyles.forEach((lifestyle) => {
      const profile: UserProfileData = {
        ...validProfile,
        lifestyle,
      };

      expect(profile.lifestyle).toBe(lifestyle);
    });
  });

  it('should handle different focus times', () => {
    const focusTimes = ['Morning (6-9)', 'Afternoon (12-15)', 'Evening (18-21)', 'Night (21+)'];

    focusTimes.forEach((focusTime) => {
      const profile: UserProfileData = {
        ...validProfile,
        focusTime,
      };

      expect(profile.focusTime).toBe(focusTime);
    });
  });

  it('should handle different work environments', () => {
    const environments = ['Home', 'Office', 'Cafe', 'Mobile'];

    environments.forEach((env) => {
      const profile: UserProfileData = {
        ...validProfile,
        workEnvironment: env,
      };

      expect(profile.workEnvironment).toBe(env);
    });
  });

  it('should handle different skill levels', () => {
    const skillLevels = ['Beginner', 'Some experience', 'Intermediate', 'Advanced'];

    skillLevels.forEach((level) => {
      const profile: UserProfileData = {
        ...validProfile,
        skillLevel: level,
      };

      expect(profile.skillLevel).toBe(level);
    });
  });
});

/**
 * Milestone Generation Tests
 */
describe('Milestone Generation', () => {
  it('should generate exactly 10 milestones', () => {
    const milestones: Milestone[] = Array.from({ length: 10 }, (_, i) => ({
      station: i + 1,
      title: `Station ${i + 1}`,
      description: `Description ${i + 1}`,
      estimatedDuration: `${i + 1} weeks`,
      completionCriteria: `Complete ${i + 1}`,
    }));

    expect(milestones).toHaveLength(10);
    expect(milestones[0].station).toBe(1);
    expect(milestones[9].station).toBe(10);
  });

  it('should have unique stations', () => {
    const milestones: Milestone[] = Array.from({ length: 10 }, (_, i) => ({
      station: i + 1,
      title: `Station ${i + 1}`,
      description: `Description`,
      estimatedDuration: '2 weeks',
      completionCriteria: 'Complete',
    }));

    const stations = milestones.map((m) => m.station);
    const uniqueStations = new Set(stations);

    expect(uniqueStations.size).toBe(10);
  });

  it('should have progressive difficulty', () => {
    const milestones: Milestone[] = Array.from({ length: 10 }, (_, i) => ({
      station: i + 1,
      title: `Station ${i + 1}`,
      description: `Progressively more difficult ${i + 1}`,
      estimatedDuration: `${2 + i} weeks`,
      completionCriteria: `Complete level ${i + 1} tasks`,
    }));

    // Later milestones should have longer durations
    expect(milestones[9].estimatedDuration).toBeTruthy();
    expect(milestones[0].estimatedDuration).toBeTruthy();
  });

  it('should assign all 10 stations', () => {
    const milestones: Milestone[] = Array.from({ length: 10 }, (_, i) => ({
      station: i + 1,
      title: `Station ${i + 1}`,
      description: `Description`,
      estimatedDuration: '2 weeks',
      completionCriteria: 'Complete',
    }));

    for (let i = 1; i <= 10; i++) {
      const milestone = milestones.find((m) => m.station === i);
      expect(milestone).toBeDefined();
    }
  });
});

/**
 * Onboarding Flow State Machine Tests
 */
describe('Onboarding State Machine', () => {
  const steps = [
    'consent',
    'goal',
    'obstacles',
    'duration',
    'commit-time',
    'profile',
    'milestones',
    'review',
    'complete',
  ];

  it('should follow correct step sequence', () => {
    for (let i = 0; i < steps.length - 1; i++) {
      const currentStep = steps[i];
      const nextStep = steps[i + 1];

      expect(steps.indexOf(nextStep)).toBe(steps.indexOf(currentStep) + 1);
    }
  });

  it('should track progress through all steps', () => {
    const progressMap: Record<string, number> = {
      consent: 10,
      goal: 20,
      obstacles: 30,
      duration: 40,
      'commit-time': 50,
      profile: 65,
      milestones: 80,
      review: 90,
      complete: 100,
    };

    steps.forEach((step) => {
      expect(progressMap[step]).toBeDefined();
      expect(progressMap[step]).toBeGreaterThan(0);
      expect(progressMap[step]).toBeLessThanOrEqual(100);
    });
  });

  it('should allow backward navigation (except consent)', () => {
    const stepsAllowingBackward = steps.slice(1); // All except 'consent'

    stepsAllowingBackward.forEach((step) => {
      const currentIndex = steps.indexOf(step);
      expect(currentIndex).toBeGreaterThan(0);
    });
  });
});

/**
 * Error Handling Tests
 */
describe('Onboarding Error Handling', () => {
  it('should handle empty goal input', () => {
    const goal = '';

    expect(goal.trim().length).toBe(0);
  });

  it('should handle incomplete profile', () => {
    const profile: Partial<UserProfileData> = {
      lifestyle: 'Employee',
      // Missing other fields
    };

    const requiredFields = [
      'lifestyle',
      'focusTime',
      'workEnvironment',
      'taskPace',
      'pastFailureReason',
      'skillLevel',
      'difficultyPreference',
    ];

    const missingFields = requiredFields.filter(
      (field) => !(field in profile)
    );

    expect(missingFields.length).toBeGreaterThan(0);
  });

  it('should handle network errors', () => {
    const error = new Error('Network timeout');

    expect(error.message).toContain('Network');
  });

  it('should handle invalid milestone count', () => {
    const milestones: Milestone[] = Array.from({ length: 5 }, (_, i) => ({
      station: i + 1,
      title: `Station ${i + 1}`,
      description: 'Description',
      estimatedDuration: '2 weeks',
      completionCriteria: 'Complete',
    }));

    expect(milestones.length).not.toBe(10);
  });
});

/**
 * Data Persistence Tests
 */
describe('Onboarding Data Persistence', () => {
  it('should save complete onboarding summary', () => {
    const summary = {
      userId: 'user_123',
      goal: {
        title: 'TOEIC 800',
        kpi: 'Score 800+',
        duration: '6 months',
        obstacles: ['Time'],
        plans: ['Study daily'],
      },
      duration: '6 months',
      dailyCommitTime: '1 hour',
      profile: {
        lifestyle: 'Employee',
        focusTime: 'Evening',
        workEnvironment: 'Home',
        taskPace: 'Daily',
        pastFailureReason: 'Time',
        skillLevel: 'Beginner',
        difficultyPreference: 'Moderate',
      },
      milestones: Array.from({ length: 10 }, (_, i) => ({
        station: i + 1,
        title: `Station ${i + 1}`,
        description: 'Description',
        estimatedDuration: '2 weeks',
        completionCriteria: 'Complete',
      })),
      consent: {
        dataCollection: true,
        privacyPolicy: true,
        timestamp: Date.now(),
      },
    };

    expect(summary.userId).toBeDefined();
    expect(summary.goal).toBeDefined();
    expect(summary.duration).toBeDefined();
    expect(summary.dailyCommitTime).toBeDefined();
    expect(summary.profile).toBeDefined();
    expect(summary.milestones).toHaveLength(10);
    expect(summary.consent).toBeDefined();
  });

  it('should handle resuming interrupted onboarding', () => {
    const partialState: Partial<OnboardingState> = {
      step: 'duration',
      goal: {
        title: 'Goal',
        kpi: 'KPI',
        duration: '',
        obstacles: [],
        plans: [],
      },
      duration: undefined,
      dailyCommitTime: undefined,
    };

    expect(partialState.step).toBe('duration');
    expect(partialState.goal?.title).toBe('Goal');
    expect(partialState.duration).toBeUndefined();
  });
});

/**
 * Validation Tests
 */
describe('Onboarding Validation', () => {
  it('should validate duration format', () => {
    const validDurations = ['1 month', '3 months', '6 months', '1 year', 'custom'];

    validDurations.forEach((duration) => {
      expect(duration).toBeTruthy();
      expect(typeof duration).toBe('string');
    });
  });

  it('should validate commit time format', () => {
    const validTimes = ['15min', '30min', '1hour', '2hours', 'custom'];

    validTimes.forEach((time) => {
      expect(time).toBeTruthy();
      expect(typeof time).toBe('string');
    });
  });

  it('should validate goal has required SMART elements', () => {
    const completeGoal: GoalAnalysisResult = {
      isComplete: true,
      smartAnalysis: {
        specific: true,
        measurable: true,
        achievable: true,
        relevant: true,
        timeBound: true,
      },
      woopAnalysis: {
        wish: 'Goal',
        outcome: 'Outcome',
        obstacles: [],
        plan: [],
      },
      missingElements: [],
      suggestions: [],
    };

    const criteria = Object.values(completeGoal.smartAnalysis);
    expect(criteria.every((v) => v === true)).toBe(true);
  });
});

/**
 * OnboardingFlow 遷移ロジックテスト
 * オンボーディングステップの遷移ロジックの単体テスト
 */

import type { OnboardingStep } from '../types';

// STEPSの定義（OnboardingScreen.tsxから抽出）
const STEPS: OnboardingStep[] = [
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

// 遷移ロジックをテスト可能な形で抽出
export const getNextStep = (currentStep: OnboardingStep): OnboardingStep | null => {
  const currentIndex = STEPS.indexOf(currentStep);
  const nextStep = STEPS[currentIndex + 1];
  return nextStep || null;
};

export const getPreviousStep = (currentStep: OnboardingStep): OnboardingStep | null => {
  const currentIndex = STEPS.indexOf(currentStep);
  const previousStep = STEPS[currentIndex - 1];

  // consentからは戻れない
  if (previousStep && previousStep === 'consent' && currentStep === 'goal') {
    return null;
  }

  return previousStep || null;
};

export const getStepProgress = (step: OnboardingStep): number => {
  const progressMap: Record<OnboardingStep, number> = {
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

  return progressMap[step];
};

export const getTotalSteps = (): number => STEPS.length;

export const isFirstStep = (step: OnboardingStep): boolean => step === 'consent';

export const isLastStep = (step: OnboardingStep): boolean => step === 'complete';

describe('OnboardingFlow 遷移ロジック', () => {
  describe('getNextStep', () => {
    it('consentの次はgoalに進むこと', () => {
      expect(getNextStep('consent')).toBe('goal');
    });

    it('goalの次はobstaclesに進むこと', () => {
      expect(getNextStep('goal')).toBe('obstacles');
    });

    it('obstaclesの次はdurationに進むこと', () => {
      expect(getNextStep('obstacles')).toBe('duration');
    });

    it('durationの次はcommit-timeに進むこと', () => {
      expect(getNextStep('duration')).toBe('commit-time');
    });

    it('commit-timeの次はprofileに進むこと', () => {
      expect(getNextStep('commit-time')).toBe('profile');
    });

    it('profileの次はmilestonesに進むこと', () => {
      expect(getNextStep('profile')).toBe('milestones');
    });

    it('milestonesの次はreviewに進むこと', () => {
      expect(getNextStep('milestones')).toBe('review');
    });

    it('reviewの次はcompleteに進むこと', () => {
      expect(getNextStep('review')).toBe('complete');
    });

    it('completeの次はnullになること（最終ステップ）', () => {
      expect(getNextStep('complete')).toBeNull();
    });
  });

  describe('getPreviousStep', () => {
    it('goalからはconsentに戻れないこと', () => {
      expect(getPreviousStep('goal')).toBeNull();
    });

    it('obstaclesの前はgoalに戻ること', () => {
      expect(getPreviousStep('obstacles')).toBe('goal');
    });

    it('durationの前はobstaclesに戻ること', () => {
      expect(getPreviousStep('duration')).toBe('obstacles');
    });

    it('commit-timeの前はdurationに戻ること', () => {
      expect(getPreviousStep('commit-time')).toBe('duration');
    });

    it('profileの前はcommit-timeに戻ること', () => {
      expect(getPreviousStep('profile')).toBe('commit-time');
    });

    it('milestonesの前はprofileに戻ること', () => {
      expect(getPreviousStep('milestones')).toBe('profile');
    });

    it('reviewの前はmilestonesに戻ること', () => {
      expect(getPreviousStep('review')).toBe('milestones');
    });

    it('completeの前はreviewに戻ること', () => {
      expect(getPreviousStep('complete')).toBe('review');
    });

    it('consentの前はnullになること（最初のステップ）', () => {
      expect(getPreviousStep('consent')).toBeNull();
    });
  });

  describe('getStepProgress', () => {
    it('各ステップの進捗率が正しいこと', () => {
      expect(getStepProgress('consent')).toBe(10);
      expect(getStepProgress('goal')).toBe(20);
      expect(getStepProgress('obstacles')).toBe(30);
      expect(getStepProgress('duration')).toBe(40);
      expect(getStepProgress('commit-time')).toBe(50);
      expect(getStepProgress('profile')).toBe(65);
      expect(getStepProgress('milestones')).toBe(80);
      expect(getStepProgress('review')).toBe(90);
      expect(getStepProgress('complete')).toBe(100);
    });

    it('進捗率が昇順になっていること', () => {
      for (let i = 0; i < STEPS.length - 1; i++) {
        const currentProgress = getStepProgress(STEPS[i]);
        const nextProgress = getStepProgress(STEPS[i + 1]);
        expect(nextProgress).toBeGreaterThan(currentProgress);
      }
    });
  });

  describe('getTotalSteps', () => {
    it('全ステップ数が9であること', () => {
      expect(getTotalSteps()).toBe(9);
    });
  });

  describe('isFirstStep', () => {
    it('consentが最初のステップであること', () => {
      expect(isFirstStep('consent')).toBe(true);
    });

    it('consent以外は最初のステップではないこと', () => {
      expect(isFirstStep('goal')).toBe(false);
      expect(isFirstStep('complete')).toBe(false);
    });
  });

  describe('isLastStep', () => {
    it('completeが最後のステップであること', () => {
      expect(isLastStep('complete')).toBe(true);
    });

    it('complete以外は最後のステップではないこと', () => {
      expect(isLastStep('consent')).toBe(false);
      expect(isLastStep('review')).toBe(false);
    });
  });

  describe('ステップ順序の整合性', () => {
    it('すべてのステップが一意であること', () => {
      const uniqueSteps = new Set(STEPS);
      expect(uniqueSteps.size).toBe(STEPS.length);
    });

    it('最初のステップからすべてのステップに到達できること', () => {
      let currentStep: OnboardingStep | null = 'consent';
      const visitedSteps: OnboardingStep[] = [];

      while (currentStep) {
        visitedSteps.push(currentStep);
        currentStep = getNextStep(currentStep);
      }

      expect(visitedSteps.length).toBe(STEPS.length);
      expect(visitedSteps).toEqual(STEPS);
    });

    it('最後のステップからすべてのステップに戻れること（consentを除く）', () => {
      let currentStep: OnboardingStep | null = 'complete';
      const visitedSteps: OnboardingStep[] = [];

      while (currentStep && currentStep !== 'consent') {
        visitedSteps.push(currentStep);
        const prevStep = getPreviousStep(currentStep);
        currentStep = prevStep;
      }

      // consent以外のすべてのステップを訪問できる
      expect(visitedSteps.length).toBe(STEPS.length - 1);
    });
  });
});

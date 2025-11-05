/**
 * Onboarding Screen
 * オンボーディングフロー全体を管理するスクリーン
 *
 * ステップ：
 * 1. 同意画面（データ収集・プライバシー）
 * 2. 目標設定（SMART + WOOP分析）
 * 3. 期間選択
 * 4. コミットタイム選択
 * 5. プロファイル質問（7項目）
 * 6. マイルストーン生成・確認
 * 7. 完了画面
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { NetworkErrorHandler } from '@/core/network/utils';
import { AppError } from '@/core/network/interceptors';
import { SecureTokenStore } from '@/services/auth';
import { useGoalUseCase, useMilestoneUseCase, useProfileUseCase } from '../hooks';
import { useAccessibility } from '@/shared/hooks';
import {
  OnboardingStep,
  OnboardingState,
  GoalData,
  UserProfileData,
  Milestone,
  ConsentData,
} from '../types';
import ConsentStep from '../steps/ConsentStep';
import GoalStep from '../steps/GoalStep';
import DurationStep from '../steps/DurationStep';
import CommitTimeStep from '../steps/CommitTimeStep';
import ProfileStep from '../steps/ProfileStep';
import MilestoneStep from '../steps/MilestoneStep';
import ReviewStep from '../steps/ReviewStep';
import CompleteStep from '../steps/CompleteStep';
import ProgressBar from '../components/ProgressBar';
import {
  transformMilestoneResponses,
  estimateDifficultyLevel,
  parseDurationToDays,
  validateMilestones,
  buildMilestoneGenerationParams,
} from '../utils/milestoneTransformer';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  userId: string;
  onComplete: (summary: any) => void;
  onCancel?: () => void;
}

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

const STEP_PROGRESS: Record<OnboardingStep, number> = {
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

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  userId,
  onComplete,
  onCancel,
}) => {
  const [state, setState] = useState<OnboardingState>({
    step: 'consent',
    lastUpdated: Date.now(),
    loading: false,
    progress: 10,
    error: undefined,
  });

  // UseCaseフックを使用
  const goalUseCase = useGoalUseCase();
  const milestoneUseCase = useMilestoneUseCase();
  const profileUseCase = useProfileUseCase();
  const { announce } = useAccessibility();

  const errorHandler = new NetworkErrorHandler({
    maxRetries: 3,
    initialRetryDelay: 100,
    maxRetryDelay: 1000,
    backoffMultiplier: 2,
  });

  // Restore state from storage (if interrupted)
  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedState = await SecureTokenStore.getToken();
        // In a real app, you'd restore the onboarding state from AsyncStorage
        // For now, we start fresh
      } catch (error) {
        console.warn('Could not restore onboarding state:', error);
      }
    };

    restoreState();
  }, []);

  // Update progress
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      progress: STEP_PROGRESS[state.step],
    }));

    // ステップ変更時にアナウンス
    const stepNames: Record<OnboardingStep, string> = {
      consent: '同意画面',
      goal: '目標設定',
      obstacles: '障害の設定',
      duration: '期間選択',
      'commit-time': 'コミットタイム選択',
      profile: 'プロファイル質問',
      milestones: 'マイルストーン確認',
      review: '確認画面',
      complete: '完了画面',
    };
    announce(`${stepNames[state.step]}に移動しました。進捗${STEP_PROGRESS[state.step]}パーセント`);
  }, [state.step, announce]);

  const getCurrentStepIndex = useCallback(() => {
    return STEPS.indexOf(state.step);
  }, [state.step]);

  const goToNextStep = useCallback((stepData?: Partial<OnboardingState>) => {
    setState((prev) => {
      const currentIndex = STEPS.indexOf(prev.step);
      const nextStep = STEPS[currentIndex + 1];

      if (!nextStep) {
        return prev;
      }

      return {
        ...prev,
        ...stepData,
        step: nextStep,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  const goToPreviousStep = useCallback(() => {
    setState((prev) => {
      const currentIndex = STEPS.indexOf(prev.step);
      const previousStep = STEPS[currentIndex - 1];

      if (!previousStep || previousStep === 'consent') {
        // Can't go back from consent
        return prev;
      }

      return {
        ...prev,
        step: previousStep,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  const handleConsentAgree = useCallback(
    async (consent: ConsentData) => {
      goToNextStep({
        consent: {
          dataCollection: consent.dataCollection,
          privacyPolicy: consent.privacyPolicy,
          timestamp: Date.now(),
        },
      });
    },
    [goToNextStep]
  );

  const handleGoalSubmit = useCallback(
    async (goalText: string, context?: string) => {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));

      try {
        // GoalUseCaseを使用して目標を分析
        const analysis = await goalUseCase.analyzeGoal(goalText, context);

        if (analysis.isComplete) {
          // Goal is complete, move to duration
          goToNextStep({
            goal: {
              title: goalText,
              kpi: analysis.woopAnalysis?.outcome || goalText,
              duration: '',
              obstacles: analysis.woopAnalysis?.obstacles || [],
              plans: analysis.woopAnalysis?.plan || [],
            },
            analysis,
            loading: false,
          });
        } else {
          // Show missing elements and ask for clarification
          setState((prev) => ({
            ...prev,
            analysis,
            loading: false,
            error: undefined,
          }));
        }
      } catch (error) {
        const appError =
          error instanceof AppError
            ? error
            : new AppError('ANALYSIS_ERROR', 'Goal analysis failed');

        const strategy = errorHandler.getRecoveryStrategy(appError);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: `Failed to analyze goal: ${appError.message}`,
        }));

        Alert.alert('Error', appError.message, [
          {
            text: 'Retry',
            onPress: () => {
              // Retry logic can be added here
            },
          },
          {
            text: 'Continue Without Analysis',
            onPress: () => {
              goToNextStep({
                goal: {
                  title: goalText,
                  kpi: goalText,
                  duration: '',
                  obstacles: [],
                  plans: [],
                },
                loading: false,
              });
            },
          },
        ]);
      }
    },
    [mcpClient, errorHandler, goToNextStep]
  );

  const handleDurationSelect = useCallback(
    (duration: string) => {
      goToNextStep({
        duration,
      });
    },
    [goToNextStep]
  );

  const handleCommitTimeSelect = useCallback(
    (commitTime: string) => {
      goToNextStep({
        dailyCommitTime: commitTime,
      });
    },
    [goToNextStep]
  );

  const handleProfileComplete = useCallback(
    (profile: UserProfileData) => {
      goToNextStep({
        profile,
      });
    },
    [goToNextStep]
  );

  const handleGenerateMilestones = useCallback(async () => {
    if (!state.goal || !state.profile) {
      Alert.alert('Error', 'Please complete profile before generating milestones');
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      // Generate unique goal ID
      const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Determine difficulty level based on goal and duration
      const difficultyLevel = estimateDifficultyLevel(
        state.goal.title,
        state.duration
      );

      // Convert duration to days
      const durationDays = state.duration
        ? parseDurationToDays(state.duration)
        : 90; // Default 3 months

      console.log('[Milestone Generation] Starting with params:', {
        goalId,
        goal: state.goal.title,
        difficulty: difficultyLevel,
        duration: durationDays,
      });

      // MilestoneUseCaseを使用してマイルストーンを生成
      const milestones = await milestoneUseCase.generateMilestones({
        goalId,
        goalText: state.goal.title,
        difficulty: difficultyLevel,
        durationDays,
      });

      // Validate response (UseCaseで既に検証済みだが、念のため)
      if (!milestones || milestones.length === 0) {
        throw new AppError(
          'MILESTONE_ERROR',
          'Generated empty milestones. Please try again.'
        );
      }

      console.log('[Milestone Generation] Successfully generated:', milestones.length);

      // Move to milestone review step with generated milestones
      goToNextStep({
        milestones,
        loading: false,
      });
    } catch (error) {
      console.error('[Milestone Generation] Error:', error);

      const appError =
        error instanceof AppError
          ? error
          : error instanceof Error
          ? new AppError('MILESTONE_ERROR', error.message)
          : new AppError('MILESTONE_ERROR', 'Failed to generate milestones');

      const errorMessage = `マイルストーン生成に失敗しました: ${appError.message}`;

      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      Alert.alert('マイルストーン生成エラー', appError.message, [
        {
          text: 'リトライ',
          onPress: handleGenerateMilestones,
        },
        {
          text: 'キャンセル',
          onPress: goToPreviousStep,
          style: 'cancel',
        },
      ]);
    }
  }, [state.goal, state.profile, state.duration, mcpClient, goToNextStep, goToPreviousStep]);

  const handleMilestonesConfirm = useCallback(
    (milestones: Milestone[]) => {
      goToNextStep({
        milestones,
      });
    },
    [goToNextStep]
  );

  const handleCompleteOnboarding = useCallback(async () => {
    if (!state.goal || !state.profile || !state.milestones) {
      Alert.alert('Error', 'Missing required data for onboarding');
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      // Save all data to backend
      const summary = {
        userId,
        goal: state.goal,
        duration: state.duration,
        dailyCommitTime: state.dailyCommitTime,
        profile: state.profile,
        milestones: state.milestones,
        consent: {
          dataCollection: true,
          privacyPolicy: true,
          timestamp: Date.now(),
        },
      };

      // Move to complete step
      goToNextStep({
        loading: false,
      });

      // After showing complete screen, call the callback
      setTimeout(() => {
        onComplete(summary);
      }, 2000);
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError('SAVE_ERROR', 'Failed to save onboarding data');

      setState((prev) => ({
        ...prev,
        loading: false,
        error: appError.message,
      }));
    }
  }, [userId, state, goToNextStep, onComplete]);

  const renderStep = () => {
    switch (state.step) {
      case 'consent':
        return (
          <ConsentStep
            onAgree={handleConsentAgree}
            onCancel={onCancel}
            loading={state.loading}
          />
        );

      case 'goal':
      case 'obstacles':
        return (
          <GoalStep
            step={state.step}
            analysis={state.analysis}
            goal={state.goal}
            onSubmit={handleGoalSubmit}
            onBack={goToPreviousStep}
            loading={state.loading}
          />
        );

      case 'duration':
        return (
          <DurationStep
            selected={state.duration}
            onSelect={handleDurationSelect}
            onBack={goToPreviousStep}
          />
        );

      case 'commit-time':
        return (
          <CommitTimeStep
            selected={state.dailyCommitTime}
            onSelect={handleCommitTimeSelect}
            onBack={goToPreviousStep}
          />
        );

      case 'profile':
        return (
          <ProfileStep
            profile={state.profile}
            onComplete={handleProfileComplete}
            onBack={goToPreviousStep}
            onGenerateMilestones={handleGenerateMilestones}
            loading={state.loading}
          />
        );

      case 'milestones':
        return (
          <MilestoneStep
            milestones={state.milestones}
            onConfirm={handleMilestonesConfirm}
            onBack={goToPreviousStep}
            loading={state.loading}
          />
        );

      case 'review':
        return (
          <ReviewStep
            goal={state.goal}
            duration={state.duration}
            dailyCommitTime={state.dailyCommitTime}
            profile={state.profile}
            milestonesCount={state.milestones?.length || 0}
            onConfirm={handleCompleteOnboarding}
            onBack={goToPreviousStep}
            loading={state.loading}
          />
        );

      case 'complete':
        return <CompleteStep />;

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProgressBar
          current={getCurrentStepIndex() + 1}
          total={STEPS.length}
          percentage={state.progress}
        />

        {state.error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{state.error}</Text>
          </View>
        )}

        {state.loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3C507D" />
          </View>
        )}

        {!state.loading && renderStep()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#D32F2F',
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
});

export default OnboardingScreen;

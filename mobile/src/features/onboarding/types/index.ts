/**
 * Onboarding Feature Types
 * 型定義：オンボーディング機能
 */

// SMART Analysis
export interface SmartAnalysis {
  specific: boolean;
  measurable: boolean;
  achievable: boolean;
  relevant: boolean;
  timeBound: boolean;
}

// WOOP Analysis
export interface WoopAnalysis {
  wish: string;
  outcome: string;
  obstacles: string[];
  plan: string[];
}

// Goal Analysis Result
export interface GoalAnalysisResult {
  isComplete: boolean;
  smartAnalysis: SmartAnalysis;
  woopAnalysis: WoopAnalysis;
  missingElements: string[];
  suggestions: string[];
}

// User Profile Data
export interface UserProfileData {
  lifestyle: string;
  focusTime: string;
  workEnvironment: string;
  taskPace: string;
  pastFailureReason: string;
  skillLevel: string;
  difficultyPreference: string;
}

// Goal Data
export interface GoalData {
  title: string;
  kpi: string;
  duration: string;
  deadline?: string;
  obstacles: string[];
  plans: string[];
}

// Milestone
export interface Milestone {
  station: number;
  title: string;
  description: string;
  estimatedDuration: string;
  completionCriteria: string;
}

// Onboarding State
export type OnboardingStep =
  | 'consent'
  | 'goal'
  | 'obstacles'
  | 'duration'
  | 'commit-time'
  | 'profile'
  | 'milestones'
  | 'review'
  | 'complete';

export interface OnboardingState {
  step: OnboardingStep;
  goal?: GoalData;
  analysis?: GoalAnalysisResult;
  duration?: string;
  dailyCommitTime?: string;
  profile?: UserProfileData;
  milestones?: Milestone[];
  lastUpdated: number;
  error?: string;
  loading: boolean;
  progress: number; // 0-100
}

// Profile Question Option
export interface ProfileQuestionOption {
  label: string;
  value: string;
}

export interface ProfileQuestion {
  id: string;
  question: string;
  type: 'single-choice' | 'text';
  options?: ProfileQuestionOption[];
  helpText?: string;
}

// Consent Agreement
export interface ConsentData {
  dataCollection: boolean;
  privacyPolicy: boolean;
  timestamp: number;
}

// Onboarding Summary
export interface OnboardingSummary {
  userId: string;
  goal: GoalData;
  duration: string;
  dailyCommitTime: string;
  profile: UserProfileData;
  milestones: Milestone[];
  consent: ConsentData;
}

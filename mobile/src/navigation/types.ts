/**
 * Navigation Types
 * アプリケーション全体のナビゲーション型定義
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Root Navigator Param List
 */
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: { userId: string };
};

/**
 * Auth Navigator Param List
 */
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

/**
 * Main Navigator Param List
 */
export type MainStackParamList = {
  Home: undefined;
  QuestDetail: { questId: string };
  QuestCompletion: { questId: string };
  QuestSkip: { questId: string };
  QuestObstruction: { questId: string };
  Progress: undefined;
  Ranking: undefined;
  Settings: undefined;
  LanguageSettings: undefined;
  NotificationSettings: undefined;
  PrivacyPolicy: undefined;
  GoalDetail: { goalId: string };
  GoalEdit: { goalId: string };
  MilestoneAchievement: { milestoneId: string };
};

/**
 * Screen Props Types
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type MainStackScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  T
>;

/**
 * Navigation Prop Types (useNavigation用)
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

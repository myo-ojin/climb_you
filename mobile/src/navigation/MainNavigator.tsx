/**
 * Main Navigator
 * メイン画面のナビゲーション（ログイン後）
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import {
  HomeScreen,
  QuestDetailScreen,
  QuestCompletionScreen,
  QuestSkipScreen,
  QuestObstructionScreen,
} from '@/features/quest/screens';
import {
  GoalDetailScreen,
  GoalsListScreen,
  GoalEditScreen,
} from '@/features/goals/screens';
import { SettingsScreen, NotificationSettingsScreen, PrivacyPolicyScreen } from '@/features/settings/screens';
import { ProgressScreen } from '@/features/progress/screens';
import { RankingScreen } from '@/features/ranking/screens';
import { MilestoneAchievementScreen } from '@/features/milestones/screens';

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * Main Navigator
 */
export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        headerStyle: {
          backgroundColor: '#3C507D', // Mountain Blue
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Home & Quest Screens */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'ホーム',
          headerShown: false, // HomeScreenは独自のヘッダーを持つ
        }}
      />
      <Stack.Screen
        name="QuestDetail"
        component={QuestDetailScreen}
        options={{
          title: 'クエスト詳細',
        }}
      />
      <Stack.Screen
        name="QuestCompletion"
        component={QuestCompletionScreen}
        options={{
          title: 'クエスト完了',
        }}
      />
      <Stack.Screen
        name="QuestSkip"
        component={QuestSkipScreen}
        options={{
          title: 'クエスト見送り',
        }}
      />
      <Stack.Screen
        name="QuestObstruction"
        component={QuestObstructionScreen}
        options={{
          title: 'クエスト阻害',
        }}
      />

      {/* Goal Screens */}
      <Stack.Screen
        name="GoalDetail"
        component={GoalDetailScreen}
        options={{
          title: '目標詳細',
        }}
      />
      <Stack.Screen
        name="GoalEdit"
        component={GoalEditScreen}
        options={{
          title: '目標編集',
        }}
      />

      {/* Milestone Screens */}
      <Stack.Screen
        name="MilestoneAchievement"
        component={MilestoneAchievementScreen}
        options={{
          title: 'マイルストーン達成確認',
        }}
      />

      {/* Progress & Ranking */}
      <Stack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: '進捗',
        }}
      />
      <Stack.Screen
        name="Ranking"
        component={RankingScreen}
        options={{
          title: 'ランキング',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '設定',
        }}
      />

      {/* Notification Settings */}
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: '通知設定',
        }}
      />

      {/* Privacy Policy */}
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          title: 'プライバシーポリシー',
        }}
      />
    </Stack.Navigator>
  );
};

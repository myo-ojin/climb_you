/**
 * HomeScreen
 * ホーム画面 - 今日のクエストと進捗を表示
 *
 * 表示内容:
 * - 進捗サマリ（現在の合目、ストリーク、累計歩数）
 * - 今日のクエストリスト（3つ）
 * - Pull-to-Refresh機能
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuests } from '../hooks/useQuests';
import { QuestCard, ProgressSummary } from '../components';
import { Colors } from '@/shared/theme';
import { useAccessibility, useAccessibleTheme, useReduceMotion } from '@/shared/hooks';
import { ScaledText, ScaledTitle } from '@/shared/components';
import { adjustAnimationDuration } from '@/shared/utils';

type HomeScreenProps = NativeStackScreenProps<
  any, // QuestStackParamList
  'Home'
>;

/**
 * HomeScreen コンポーネント
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const theme = useAccessibleTheme();
  const isReduceMotionEnabled = useReduceMotion();

  const {
    todayQuests,
    progress,
    currentStreak,
    isLoading,
    error,
    refreshQuests,
  } = useQuests();

  const { isScreenReaderEnabled, announce } = useAccessibility();

  // クエスト取得完了時にアナウンス
  useEffect(() => {
    if (!isLoading && todayQuests.length > 0) {
      announce(`今日のクエストが${todayQuests.length}件あります。`);
    }
  }, [isLoading, todayQuests.length, announce]);

  // エラー発生時にアナウンス
  useEffect(() => {
    if (error) {
      announce(`エラーが発生しました: ${error.message}`);
    }
  }, [error, announce]);

  const handleRefresh = useCallback(async () => {
    announce('クエストを更新しています');
    await refreshQuests();
  }, [refreshQuests, announce]);

  const handleQuestPress = useCallback(
    (questId: string) => {
      // クエストタップ時にアナウンス
      const quest = todayQuests.find((q) => q.id === questId);
      if (quest && isScreenReaderEnabled) {
        announce(`${quest.title}の詳細を開いています`);
      }
      // Task 6.1: Quest詳細画面に遷移
      navigation.navigate('QuestDetail', { questId });
    },
    [navigation, todayQuests, isScreenReaderEnabled, announce]
  );

  const renderQuestItem = useCallback(
    ({ item }: any) => (
      <View style={styles.questCardContainer}>
        <QuestCard quest={item} onPress={handleQuestPress} />
      </View>
    ),
    [handleQuestPress]
  );

  const renderHeader = useCallback(
    () => (
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        {/* ProgressSummary コンポーネント */}
        <ProgressSummary
          currentStation={progress.currentStation}
          stepsInCurrentStation={progress.stepsInCurrentStation}
          totalSteps={progress.totalSteps}
          progressPercentage={progress.progressPercentage}
          currentStreak={currentStreak.currentStreak}
          maxStreak={currentStreak.maxStreak}
        />

        {/* Error Banner */}
        {error && (
          <View
            style={[styles.errorBanner, { backgroundColor: Colors.error }]}
            accessible={true}
            accessibilityLabel={`エラー: クエスト取得エラー: ${error.message}`}
            accessibilityRole="alert"
          >
            <ScaledText baseFontSize={14} style={styles.errorText}>
              クエスト取得エラー: {error.message}
            </ScaledText>
          </View>
        )}

        {/* Today's Quests Title */}
        <ScaledTitle
          style={[
            styles.todayTitle,
            {
              color: theme.text,
            },
          ]}
          accessible={true}
          accessibilityLabel="今日のクエスト"
          accessibilityRole="header"
        >
          今日のクエスト
        </ScaledTitle>
      </View>
    ),
    [progress, currentStreak, error, theme]
  );

  const renderEmpty = useCallback(
    () => (
      <View
        style={[
          styles.emptyContainer,
          {
            backgroundColor: theme.background,
          },
        ]}
        accessible={true}
        accessibilityLabel="今日のクエストはありません"
        accessibilityRole="text"
      >
        <ScaledText
          baseFontSize={16}
          style={[
            styles.emptyText,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          今日のクエストはありません
        </ScaledText>
      </View>
    ),
    [theme]
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
        },
      ]}
      accessibilityLabel="ホーム画面"
    >
      {isLoading && !todayQuests.length ? (
        <View
          style={[
            styles.loadingContainer,
            {
              backgroundColor: theme.background,
            },
          ]}
          accessibilityLabel="読み込み中"
          accessibilityRole="progressbar"
        >
          <ActivityIndicator
            size="large"
            color={Colors.mountainBlue}
            testID="quest-loading-indicator"
            accessible={true}
            accessibilityLabel="クエストを読み込んでいます"
          />
        </View>
      ) : (
        <FlatList
          data={todayQuests}
          renderItem={renderQuestItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={Colors.mountainBlue}
              accessibilityLabel={isLoading ? "更新中" : "下に引いて更新"}
            />
          }
          contentContainerStyle={{
            backgroundColor: theme.background,
          }}
          scrollEnabled={true}
          testID="quests-list"
          accessible={true}
          accessibilityLabel="今日のクエストリスト"
          accessibilityHint={`${todayQuests.length}件のクエストがあります。各クエストをタップして詳細を確認できます。`}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingVertical: 8,
  },
  errorBanner: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  errorText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  questCardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
  },
});

export default HomeScreen;

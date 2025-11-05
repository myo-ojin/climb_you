/**
 * ProgressSummary Component
 * ユーザーの進捗状況をサマリ表示するコンポーネント
 *
 * 表示情報:
 * - 現在の合目（1-10）
 * - ストリーク（連続達成日数）
 * - 累計歩数
 * - 進捗バー（現在の合目内での進捗率）
 * - 最大ストリーク記録
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  useColorScheme,
  StyleSheet,
  Animated,
} from 'react-native';
import { Colors, LightTheme, DarkTheme } from '@/shared/theme';

interface ProgressSummaryProps {
  currentStation: number;        // 1-10
  stepsInCurrentStation: number; // 現在の合目内での歩数
  totalSteps: number;            // 累計歩数
  progressPercentage: number;    // 0-100
  currentStreak: number;         // 連続日数
  maxStreak: number;             // 最大記録
}

/**
 * ProgressSummary コンポーネント
 * ユーザーの進捗を3つの統計情報と進捗バーで表示
 */
export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  currentStation,
  stepsInCurrentStation,
  totalSteps,
  progressPercentage,
  currentStreak,
  maxStreak,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;

  // 進捗パーセンテージを0-100の範囲に正規化
  const normalizedProgress = useMemo(() => {
    return Math.min(Math.max(progressPercentage, 0), 100);
  }, [progressPercentage]);

  // アクセシビリティラベル
  const stationLabel = useMemo(() => {
    return `現在地: ${currentStation}合目`;
  }, [currentStation]);

  const streakLabel = useMemo(() => {
    return `ストリーク: ${currentStreak}日連続、最大記録: ${maxStreak}日`;
  }, [currentStreak, maxStreak]);

  const stepsLabel = useMemo(() => {
    return `累計歩数: ${totalSteps}歩`;
  }, [totalSteps]);

  const progressLabel = useMemo(() => {
    return `${currentStation}合目内の進捗: ${normalizedProgress}%`;
  }, [currentStation, normalizedProgress]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.elevation.level1,
        },
      ]}
      testID="progress-summary"
    >
      {/* 3列統計情報 */}
      <View style={styles.statsContainer}>
        {/* ステーション */}
        <View
          style={styles.statCard}
          testID="station-card"
          accessible={true}
          accessibilityLabel={stationLabel}
          accessibilityRole="text"
        >
          <Text
            style={[
              styles.statIcon,
              {
                color: Colors.mountainBlue,
              },
            ]}
          >
            ⛰️
          </Text>
          <Text
            style={[
              styles.statValue,
              {
                color: Colors.mountainBlue,
              },
            ]}
            testID="current-station"
          >
            {currentStation}
          </Text>
          <Text
            style={[
              styles.statLabel,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            合目
          </Text>
        </View>

        {/* ストリーク */}
        <View
          style={styles.statCard}
          testID="streak-card"
          accessible={true}
          accessibilityLabel={streakLabel}
          accessibilityRole="text"
        >
          <Text
            style={[
              styles.statIcon,
              {
                color: Colors.success,
              },
            ]}
          >
            🔥
          </Text>
          <Text
            style={[
              styles.statValue,
              {
                color: Colors.success,
              },
            ]}
            testID="current-streak"
          >
            {currentStreak}
          </Text>
          <Text
            style={[
              styles.statLabel,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            日連続
          </Text>
          <Text
            style={[
              styles.statSubLabel,
              {
                color: theme.textSecondary,
              },
            ]}
            testID="max-streak"
          >
            最高: {maxStreak}
          </Text>
        </View>

        {/* 歩数 */}
        <View
          style={styles.statCard}
          testID="steps-card"
          accessible={true}
          accessibilityLabel={stepsLabel}
          accessibilityRole="text"
        >
          <Text
            style={[
              styles.statIcon,
              {
                color: Colors.mountainBlue,
              },
            ]}
          >
            👣
          </Text>
          <Text
            style={[
              styles.statValue,
              {
                color: Colors.mountainBlue,
              },
            ]}
            testID="total-steps"
          >
            {totalSteps.toLocaleString()}
          </Text>
          <Text
            style={[
              styles.statLabel,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            歩
          </Text>
        </View>
      </View>

      {/* 進捗バー */}
      <View
        style={styles.progressBarContainer}
        testID="progress-bar-container"
        accessible={true}
        accessibilityLabel={progressLabel}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: normalizedProgress,
          text: `${normalizedProgress}%`,
        }}
      >
        <View
          style={[
            styles.progressBarBackground,
            {
              backgroundColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${normalizedProgress}%`,
                backgroundColor: Colors.mountainBlue,
              },
            ]}
            testID="progress-bar-fill"
          />
        </View>
        <Text
          style={[
            styles.progressText,
            {
              color: theme.text,
            },
          ]}
          testID="progress-percentage"
        >
          {normalizedProgress}%
        </Text>
      </View>

      {/* サブテキスト */}
      <Text
        style={[
          styles.subtext,
          {
            color: theme.textSecondary,
          },
        ]}
        testID="progress-subtext"
      >
        {currentStation === 10
          ? '🎉 おめでとうございます！目標達成です！'
          : `${currentStation}合目まであと ${10 - currentStation} 合目です`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Android Elevation
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  statSubLabel: {
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  subtext: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

export default ProgressSummary;

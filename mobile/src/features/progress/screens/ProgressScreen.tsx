/**
 * ProgressScreen
 * 進捗画面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useProgress } from '../hooks/useProgress';
import { MountainVisual, StationCard, ProgressBar } from '../components';
import { useAccessibility } from '@/shared/hooks';

/**
 * ProgressScreen Component
 */
export const ProgressScreen: React.FC = () => {
  const { userId } = useSelector((state: RootState) => state.auth);
  const { progressData, nextStationInfo, isLoading, error, refresh } = useProgress(userId || '');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isScreenReaderEnabled, announce } = useAccessibility();

  // 進捗データ読み込み完了時にアナウンス
  useEffect(() => {
    if (!isLoading && progressData) {
      announce(
        `進捗画面を読み込みました。現在${progressData.currentStation}合目、累計${progressData.totalSteps.toLocaleString()}歩です。`
      );
    }
  }, [isLoading, progressData, announce]);

  // エラー発生時にアナウンス
  useEffect(() => {
    if (error) {
      announce(`エラーが発生しました: ${error.message}`);
    }
  }, [error, announce]);

  /**
   * 引っ張って更新
   */
  const handleRefresh = async () => {
    announce('進捗データを更新しています');
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
    if (!error) {
      announce('進捗データを更新しました');
    }
  };

  /**
   * ローディング中
   */
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} accessibilityLabel="進捗画面">
        <View
          style={styles.loadingContainer}
          accessible={true}
          accessibilityLabel="読み込み中"
          accessibilityRole="progressbar"
        >
          <ActivityIndicator
            size="large"
            color="#3C507D"
            accessible={true}
            accessibilityLabel="進捗データを読み込んでいます"
          />
          <Text style={styles.loadingText}>進捗を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * エラー
   */
  if (error) {
    return (
      <SafeAreaView style={styles.container} accessibilityLabel="進捗画面">
        <View
          style={styles.errorContainer}
          accessible={true}
          accessibilityLabel={`エラー: ${error.message}`}
          accessibilityRole="alert"
        >
          <Text
            style={styles.errorTitle}
            accessible={true}
            accessibilityRole="header"
          >
            エラー
          </Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * データなし
   */
  if (!progressData) {
    return (
      <SafeAreaView style={styles.container} accessibilityLabel="進捗画面">
        <View
          style={styles.emptyContainer}
          accessible={true}
          accessibilityLabel="進捗データがありません。まず目標を設定してください。"
          accessibilityRole="text"
        >
          <Text style={styles.emptyText}>進捗データがありません</Text>
          <Text style={styles.emptyHint}>まず目標を設定してください</Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    totalSteps,
    currentStation,
    overallProgress,
    stations,
    currentStreak,
    maxStreak,
    goalTitle,
    goalDeadline,
  } = progressData;

  // 残り日数を計算
  const remainingDays = Math.max(
    0,
    Math.floor((goalDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <SafeAreaView style={styles.container} accessibilityLabel="進捗画面">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            accessibilityLabel={isRefreshing ? "更新中" : "下に引いて更新"}
          />
        }
        accessible={true}
        accessibilityLabel={`進捗画面: ${goalTitle}`}
        accessibilityHint="スクロールして進捗情報を表示できます"
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text
            style={styles.goalTitle}
            accessible={true}
            accessibilityLabel={`目標: ${goalTitle}`}
            accessibilityRole="header"
          >
            {goalTitle}
          </Text>
          <Text
            style={styles.deadline}
            accessible={true}
            accessibilityLabel={`残り${remainingDays}日`}
          >
            残り {remainingDays} 日
          </Text>
        </View>

        {/* 山のビジュアル */}
        <MountainVisual
          stations={stations}
          currentStation={currentStation}
          overallProgress={overallProgress}
        />

        {/* 統計カード */}
        <View style={styles.statsContainer}>
          {/* 累計歩数 */}
          <View
            style={styles.statCard}
            accessible={true}
            accessibilityLabel={`累計歩数: ${totalSteps.toLocaleString()}歩`}
            accessibilityRole="summary"
          >
            <Text style={styles.statLabel}>累計歩数</Text>
            <Text style={styles.statValue}>{totalSteps.toLocaleString()}</Text>
            <Text style={styles.statUnit}>歩</Text>
          </View>

          {/* 現在の合目 */}
          <View
            style={styles.statCard}
            accessible={true}
            accessibilityLabel={`現在: ${currentStation}合目`}
            accessibilityRole="summary"
          >
            <Text style={styles.statLabel}>現在</Text>
            <Text style={styles.statValue}>{currentStation}</Text>
            <Text style={styles.statUnit}>合目</Text>
          </View>

          {/* ストリーク */}
          <View
            style={styles.statCard}
            accessible={true}
            accessibilityLabel={`ストリーク: ${currentStreak}日連続`}
            accessibilityRole="summary"
          >
            <Text style={styles.statLabel}>ストリーク</Text>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statUnit}>日連続</Text>
          </View>
        </View>

        {/* 次の合目情報 */}
        {nextStationInfo && (
          <View style={styles.nextStationContainer}>
            <Text
              style={styles.sectionTitle}
              accessible={true}
              accessibilityLabel="次の合目"
              accessibilityRole="header"
            >
              次の合目
            </Text>
            <View
              style={styles.nextStationCard}
              accessible={true}
              accessibilityLabel={`次の合目: ${nextStationInfo.stationNumber}合目 ${nextStationInfo.title}、あと${nextStationInfo.remainingSteps.toLocaleString()}歩、進捗率${Math.round(nextStationInfo.progressRate * 100)}パーセント`}
              accessibilityRole="summary"
            >
              <Text style={styles.nextStationTitle}>
                {nextStationInfo.stationNumber}合目: {nextStationInfo.title}
              </Text>
              <Text style={styles.nextStationRemaining}>
                あと {nextStationInfo.remainingSteps.toLocaleString()} 歩
              </Text>
              <View style={styles.nextStationProgressContainer}>
                <ProgressBar
                  progress={nextStationInfo.progressRate}
                  height={10}
                  color="#3C507D"
                  backgroundColor="#E0E0E0"
                  showPercentage={false}
                />
              </View>
            </View>
          </View>
        )}

        {/* 全合目リスト */}
        <View style={styles.stationsContainer}>
          <Text
            style={styles.sectionTitle}
            accessible={true}
            accessibilityLabel="全合目"
            accessibilityRole="header"
          >
            全合目
          </Text>
          {stations.map((station) => (
            <StationCard
              key={station.stationNumber}
              station={station}
              isCurrent={station.stationNumber === currentStation}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  deadline: {
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  emptyHint: {
    color: '#999',
    fontSize: 14,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorMessage: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#D32F2F',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  goalTitle: {
    color: '#333',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  header: {
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
  nextStationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 2,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nextStationContainer: {
    marginBottom: 20,
  },
  nextStationProgressContainer: {
    marginTop: 4,
  },
  nextStationRemaining: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
  },
  nextStationTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  scrollContent: {
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 2,
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  statUnit: {
    color: '#999',
    fontSize: 12,
  },
  statValue: {
    color: '#3C507D',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  stationsContainer: {
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});

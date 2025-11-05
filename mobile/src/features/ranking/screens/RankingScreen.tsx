/**
 * RankingScreen
 * ランキング画面
 */

import React, { useState } from 'react';
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
import { useRanking } from '../hooks/useRanking';
import { LevelBandSelector, LeaderboardCard } from '../components';

/**
 * RankingScreen Component
 */
export const RankingScreen: React.FC = () => {
  const { userId } = useSelector((state: RootState) => state.auth);
  const { rankingStats, isLoading, error, refresh } = useRanking(userId || '');
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * 引っ張って更新
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  /**
   * ローディング中
   */
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} accessibilityLabel="ランキング画面">
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
            accessibilityLabel="ランキングを読み込んでいます"
          />
          <Text style={styles.loadingText}>ランキングを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * エラー
   */
  if (error) {
    return (
      <SafeAreaView style={styles.container} accessibilityLabel="ランキング画面">
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
  if (!rankingStats) {
    return (
      <SafeAreaView style={styles.container} accessibilityLabel="ランキング画面">
        <View
          style={styles.emptyContainer}
          accessible={true}
          accessibilityLabel="ランキングデータがありません"
          accessibilityRole="text"
        >
          <Text style={styles.emptyText}>ランキングデータがありません</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { currentWeek, currentLevelBand, totalSteps, bestRank, badgesEarned } = rankingStats;

  // 週の期間を表示形式に変換
  const weekPeriod = `${currentWeek.startDate.getMonth() + 1}/${currentWeek.startDate.getDate()} 〜 ${currentWeek.endDate.getMonth() + 1}/${currentWeek.endDate.getDate()}`;

  return (
    <SafeAreaView style={styles.container} accessibilityLabel="ランキング画面">
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
        accessibilityLabel="週次ランキング"
        accessibilityHint="スクロールしてランキング情報を表示できます"
      >
        {/* レベル帯情報 */}
        <LevelBandSelector
          currentLevelBand={currentLevelBand}
          totalSteps={totalSteps}
        />

        {/* 週の期間 */}
        <View
          style={styles.weekHeader}
          accessible={true}
          accessibilityLabel={`今週のランキング、期間: ${weekPeriod}、参加者: ${currentWeek.totalParticipants}名`}
          accessibilityRole="summary"
        >
          <Text
            style={styles.weekTitle}
            accessible={true}
            accessibilityRole="header"
          >
            今週のランキング
          </Text>
          <Text style={styles.weekPeriod}>{weekPeriod}</Text>
          <Text style={styles.participantsCount}>
            参加者: {currentWeek.totalParticipants}名
          </Text>
        </View>

        {/* 自分の統計カード */}
        <View
          style={styles.statsCard}
          accessible={true}
          accessibilityLabel={`自己ベスト: ${bestRank}位、獲得バッジ: トップ10が${badgesEarned.top10}回、チャンピオンが${badgesEarned.champion}回`}
          accessibilityRole="summary"
        >
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>自己ベスト</Text>
              <Text style={styles.statValue}>{bestRank}位</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>獲得バッジ</Text>
              <Text style={styles.statValue}>
                🏆 {badgesEarned.top10} 👑 {badgesEarned.champion}
              </Text>
            </View>
          </View>
        </View>

        {/* 20位外の場合、自分の順位を表示 */}
        {currentWeek.myRank && currentWeek.myRank > 20 && (
          <View
            style={styles.myRankCard}
            accessible={true}
            accessibilityLabel={`あなたの順位: ${currentWeek.myRank}位、週次獲得歩数: ${currentWeek.myWeeklySteps?.toLocaleString()}歩、達成率: ${currentWeek.myAchievementRate}パーセント`}
            accessibilityRole="summary"
          >
            <Text style={styles.myRankTitle}>あなたの順位</Text>
            <Text style={styles.myRankValue}>{currentWeek.myRank}位</Text>
            <Text style={styles.myRankSteps}>
              週次獲得歩数: {currentWeek.myWeeklySteps?.toLocaleString()} 歩
            </Text>
            <Text style={styles.myRankRate}>
              達成率: {currentWeek.myAchievementRate}%
            </Text>
          </View>
        )}

        {/* ランキングリスト */}
        <View style={styles.leaderboardContainer}>
          <Text
            style={styles.sectionTitle}
            accessible={true}
            accessibilityLabel="上位20名"
            accessibilityRole="header"
          >
            上位20名
          </Text>
          <Text style={styles.sectionSubtitle}>
            ※ 名前は匿名化されています
          </Text>

          {currentWeek.entries.map((entry) => (
            <LeaderboardCard key={entry.rank} entry={entry} />
          ))}
        </View>

        {/* 励ましメッセージ */}
        <View
          style={styles.messageCard}
          accessible={true}
          accessibilityLabel={
            currentWeek.myRank && currentWeek.myRank <= 3
              ? '素晴らしい成績です！この調子で頑張りましょう！'
              : currentWeek.myRank && currentWeek.myRank <= 10
              ? 'トップ10入りおめでとうございます！'
              : '健全な競争を心がけましょう。無理せず自分のペースで進めてください。'
          }
          accessibilityRole="text"
        >
          <Text style={styles.messageText}>
            {currentWeek.myRank && currentWeek.myRank <= 3
              ? '素晴らしい成績です！この調子で頑張りましょう！'
              : currentWeek.myRank && currentWeek.myRank <= 10
              ? 'トップ10入りおめでとうございます！'
              : '健全な競争を心がけましょう。無理せず自分のペースで進めてください。'}
          </Text>
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
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
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
  leaderboardContainer: {
    marginBottom: 16,
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
  messageCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    marginBottom: 20,
    padding: 16,
  },
  messageText: {
    color: '#2E7D32',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  myRankCard: {
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderColor: '#3C507D',
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
    padding: 16,
  },
  myRankRate: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  myRankSteps: {
    color: '#333',
    fontSize: 14,
    marginBottom: 4,
  },
  myRankTitle: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  myRankValue: {
    color: '#3C507D',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  participantsCount: {
    color: '#999',
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  sectionSubtitle: {
    color: '#999',
    fontSize: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statValue: {
    color: '#3C507D',
    fontSize: 20,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weekHeader: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weekPeriod: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  weekTitle: {
    color: '#333',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
});

/**
 * LeaderboardCard Component
 * ランキングカードコンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RankingEntry } from '../types';
import { RankBadge } from './RankBadge';

export interface LeaderboardCardProps {
  /**
   * ランキングエントリー
   */
  entry: RankingEntry;

  /**
   * カードスタイル
   */
  style?: any;
}

/**
 * LeaderboardCard Component
 */
export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ entry, style }) => {
  const { rank, anonymousName, weeklySteps, achievementRate, isCurrentUser, badge } = entry;

  const cardStyle = [
    styles.card,
    isCurrentUser && styles.currentUserCard,
    style,
  ];

  return (
    <View style={cardStyle}>
      {/* 順位バッジ */}
      <RankBadge rank={rank} badge={badge} size="medium" />

      {/* ユーザー情報 */}
      <View style={styles.userInfo}>
        <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
          {anonymousName}
          {isCurrentUser && ' （あなた）'}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>週次獲得歩数</Text>
            <Text style={styles.statValue}>{weeklySteps.toLocaleString()} 歩</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>達成率</Text>
            <Text style={[styles.statValue, styles.achievementValue]}>
              {achievementRate}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  achievementValue: {
    color: '#4CAF50',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#E0E0E0',
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentUserCard: {
    backgroundColor: '#F0F4F8',
    borderColor: '#3C507D',
    borderWidth: 2,
  },
  currentUserText: {
    color: '#3C507D',
    fontWeight: '700',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: '#666',
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
});

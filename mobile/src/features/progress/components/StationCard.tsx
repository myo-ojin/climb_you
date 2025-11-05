/**
 * StationCard Component
 * 合目カードコンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Station, StationStatus } from '../types';
import { ProgressBar } from './ProgressBar';

export interface StationCardProps {
  /**
   * 合目データ
   */
  station: Station;

  /**
   * 現在の合目かどうか
   */
  isCurrent?: boolean;

  /**
   * タップ時のコールバック
   */
  onPress?: () => void;
}

/**
 * StationCard Component
 */
export const StationCard: React.FC<StationCardProps> = ({
  station,
  isCurrent = false,
  onPress,
}) => {
  const { stationNumber, title, criteria, status, progressRate, achievedAt } = station;

  // ステータスに応じた色
  const getStatusColor = () => {
    switch (status) {
      case StationStatus.ACHIEVED:
        return '#4CAF50'; // Green
      case StationStatus.REACHED:
        return '#3C507D'; // Mountain Blue
      case StationStatus.NOT_REACHED:
        return '#999'; // Gray
      default:
        return '#999';
    }
  };

  // ステータステキスト
  const getStatusText = () => {
    switch (status) {
      case StationStatus.ACHIEVED:
        return '達成済み';
      case StationStatus.REACHED:
        return '到達済み';
      case StationStatus.NOT_REACHED:
        return '未到達';
      default:
        return '';
    }
  };

  const statusColor = getStatusColor();
  const statusText = getStatusText();

  const cardStyle = [
    styles.card,
    isCurrent && styles.currentCard,
    status === StationStatus.ACHIEVED && styles.achievedCard,
  ];

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText}>{stationNumber}合目</Text>
        </View>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusText}
        </Text>
      </View>

      {/* タイトル */}
      <Text style={styles.title}>{title}</Text>

      {/* 達成条件 */}
      <Text style={styles.criteria} numberOfLines={2}>
        {criteria}
      </Text>

      {/* 進捗バー（到達済みの場合） */}
      {status === StationStatus.REACHED && (
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progressRate}
            label="進捗"
            height={8}
            color={statusColor}
            showPercentage={true}
          />
        </View>
      )}

      {/* 達成日時 */}
      {achievedAt && (
        <Text style={styles.achievedDate}>
          達成日: {achievedAt.toLocaleDateString('ja-JP')}
        </Text>
      )}

      {/* 現在の合目マーク */}
      {isCurrent && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>現在</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  achievedCard: {
    backgroundColor: '#F1F8F4',
  },
  achievedDate: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFF',
    borderColor: '#E0E0E0',
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  criteria: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  currentBadge: {
    backgroundColor: '#E0C58F', // Moonlight Gold
    borderRadius: 12,
    elevation: 3,
    paddingHorizontal: 12,
    paddingVertical: 4,
    position: 'absolute',
    right: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    top: -8,
  },
  currentBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  currentCard: {
    borderColor: '#3C507D',
    borderWidth: 2,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
});

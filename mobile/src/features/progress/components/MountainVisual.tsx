/**
 * MountainVisual Component
 * 10合目の山のビジュアル表示コンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Station, StationStatus } from '../types';

export interface MountainVisualProps {
  /**
   * 全合目データ
   */
  stations: Station[];

  /**
   * 現在の合目
   */
  currentStation: number;

  /**
   * 全体進捗率
   */
  overallProgress: number;
}

/**
 * MountainVisual Component
 */
export const MountainVisual: React.FC<MountainVisualProps> = ({
  stations,
  currentStation,
  overallProgress,
}) => {
  return (
    <View style={styles.container}>
      {/* タイトル */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>登山進捗</Text>
        <Text style={styles.headerProgress}>{Math.floor(overallProgress)}%</Text>
      </View>

      {/* 山のビジュアル */}
      <View style={styles.mountainContainer}>
        {/* 10合目から1合目までを逆順で表示 */}
        {[...stations].reverse().map((station, index) => {
          const reversedIndex = stations.length - 1 - index;
          const isCurrent = station.stationNumber === currentStation;
          const isAchieved = station.status === StationStatus.ACHIEVED;
          const isReached = station.status === StationStatus.REACHED;

          // 合目の幅（下に行くほど広くなる）
          const widthPercentage = 50 + (reversedIndex * 5);

          return (
            <View
              key={station.stationNumber}
              style={[
                styles.stationLayer,
                { width: `${widthPercentage}%` },
              ]}
            >
              {/* 合目マーカー */}
              <View
                style={[
                  styles.stationMarker,
                  isAchieved && styles.achievedMarker,
                  isReached && !isAchieved && styles.reachedMarker,
                  isCurrent && styles.currentMarker,
                ]}
              >
                <Text
                  style={[
                    styles.stationNumber,
                    (isAchieved || isReached) && styles.activeStationNumber,
                  ]}
                >
                  {station.stationNumber}
                </Text>
              </View>

              {/* 合目ラベル */}
              <View style={styles.stationLabelContainer}>
                <Text
                  style={[
                    styles.stationLabel,
                    (isAchieved || isReached) && styles.activeStationLabel,
                  ]}
                  numberOfLines={1}
                >
                  {station.title}
                </Text>
                {isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>●</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* 山の麓 */}
      <View style={styles.mountainBase}>
        <Text style={styles.baseText}>スタート</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  achievedMarker: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  activeStationLabel: {
    color: '#333',
    fontWeight: '600',
  },
  activeStationNumber: {
    color: '#FFF',
  },
  baseText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    elevation: 4,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  currentBadge: {
    marginLeft: 6,
  },
  currentBadgeText: {
    color: '#E0C58F',
    fontSize: 16,
  },
  currentMarker: {
    borderColor: '#E0C58F',
    borderWidth: 3,
    elevation: 5,
    shadowColor: '#E0C58F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerProgress: {
    color: '#3C507D',
    fontSize: 24,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#333',
    fontSize: 20,
    fontWeight: '700',
  },
  mountainBase: {
    alignItems: 'center',
    borderTopColor: '#8B4513', // Brown
    borderTopWidth: 3,
    marginTop: 12,
    paddingTop: 12,
  },
  mountainContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  reachedMarker: {
    backgroundColor: '#3C507D',
    borderColor: '#2C3E5D',
  },
  stationLabel: {
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },
  stationLabelContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    marginLeft: 12,
  },
  stationLayer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  stationMarker: {
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    borderColor: '#CCC',
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stationNumber: {
    color: '#999',
    fontSize: 14,
    fontWeight: '700',
  },
});

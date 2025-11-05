/**
 * LevelBandSelector Component
 * レベル帯表示コンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LevelBand, LEVEL_BAND_RANGES } from '../types';

export interface LevelBandSelectorProps {
  /**
   * 現在のレベル帯
   */
  currentLevelBand: LevelBand;

  /**
   * 累計歩数
   */
  totalSteps: number;
}

/**
 * LevelBandSelector Component
 */
export const LevelBandSelector: React.FC<LevelBandSelectorProps> = ({
  currentLevelBand,
  totalSteps,
}) => {
  const levelBandInfo = LEVEL_BAND_RANGES[currentLevelBand];

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: levelBandInfo.color }]}>
        <Text style={styles.badgeText}>{levelBandInfo.name}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.description}>
          このランキングは同じレベル帯のユーザーのみが表示されます
        </Text>
        <Text style={styles.stepsInfo}>
          あなたの累計: {totalSteps.toLocaleString()} 歩
        </Text>
        <Text style={styles.rangeInfo}>
          {levelBandInfo.minSteps.toLocaleString()}〜
          {levelBandInfo.maxSteps ? levelBandInfo.maxSteps.toLocaleString() : '∞'} 歩
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  container: {
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
  description: {
    color: '#666',
    fontSize: 13,
    marginBottom: 8,
  },
  infoContainer: {
    gap: 4,
  },
  rangeInfo: {
    color: '#999',
    fontSize: 12,
  },
  stepsInfo: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
});

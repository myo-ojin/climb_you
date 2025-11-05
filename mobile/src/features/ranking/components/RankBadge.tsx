/**
 * RankBadge Component
 * 順位バッジコンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface RankBadgeProps {
  /**
   * 順位
   */
  rank: number;

  /**
   * サイズ
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * バッジタイプ
   */
  badge?: 'champion' | 'top3' | 'top10';
}

/**
 * RankBadge Component
 */
export const RankBadge: React.FC<RankBadgeProps> = ({
  rank,
  size = 'medium',
  badge,
}) => {
  // サイズに応じたスタイル
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          text: styles.smallText,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          text: styles.largeText,
        };
      default:
        return {
          container: styles.mediumContainer,
          text: styles.mediumText,
        };
    }
  };

  // 順位に応じた色
  const getRankColor = () => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#3C507D'; // Mountain Blue
  };

  const sizeStyle = getSizeStyle();
  const backgroundColor = getRankColor();

  return (
    <View style={[styles.container, sizeStyle.container, { backgroundColor }]}>
      <Text style={[styles.rankText, sizeStyle.text]}>
        {rank <= 999 ? rank : '999+'}
      </Text>
      {badge && (
        <View style={styles.badgeIndicator}>
          <Text style={styles.badgeText}>
            {badge === 'champion' ? '👑' : badge === 'top3' ? '🥇' : '🏆'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeIndicator: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -4,
    top: -4,
    width: 20,
  },
  badgeText: {
    fontSize: 12,
  },
  container: {
    alignItems: 'center',
    borderRadius: 20,
    elevation: 4,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  largeContainer: {
    height: 56,
    width: 56,
  },
  largeText: {
    fontSize: 24,
  },
  mediumContainer: {
    height: 40,
    width: 40,
  },
  mediumText: {
    fontSize: 18,
  },
  rankText: {
    color: '#FFF',
    fontWeight: '700',
  },
  smallContainer: {
    height: 32,
    width: 32,
  },
  smallText: {
    fontSize: 14,
  },
});

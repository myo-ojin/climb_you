/**
 * ProgressBar Component
 * 進捗バーコンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface ProgressBarProps {
  /**
   * 進捗率（0-100）
   */
  progress: number;

  /**
   * ラベル
   */
  label?: string;

  /**
   * 高さ
   */
  height?: number;

  /**
   * 色
   */
  color?: string;

  /**
   * 背景色
   */
  backgroundColor?: string;

  /**
   * パーセント表示
   */
  showPercentage?: boolean;
}

/**
 * ProgressBar Component
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  height = 12,
  color = '#3C507D', // Mountain Blue
  backgroundColor = '#E0E0E0',
  showPercentage = true,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {showPercentage && (
            <Text style={styles.percentage}>{Math.floor(clampedProgress)}%</Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  fill: {
    borderRadius: 6,
  },
  label: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  labelContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  percentage: {
    color: '#3C507D',
    fontSize: 14,
    fontWeight: '600',
  },
  track: {
    borderRadius: 6,
    overflow: 'hidden',
    width: '100%',
  },
});

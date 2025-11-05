/**
 * Progress Bar Component
 * オンボーディングの進行状況を表示するプログレスバー
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface ProgressBarProps {
  current: number;
  total: number;
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  percentage,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${percentage}%`,
            },
          ]}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.stepText}>
          ステップ {current} / {total}
        </Text>
        <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#EEEEEE',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3C507D',
    borderRadius: 3,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C507D',
  },
});

export default ProgressBar;

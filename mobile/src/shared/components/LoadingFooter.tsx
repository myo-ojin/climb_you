/**
 * LoadingFooter Component
 * FlatList用ローディングフッター
 *
 * 機能:
 * - ActivityIndicatorを表示
 * - カスタマイズ可能なメッセージ
 * - ローディング中のみ表示
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export interface LoadingFooterProps {
  /**
   * ローディング中か
   */
  isLoading: boolean;

  /**
   * 表示メッセージ（オプション）
   */
  message?: string;

  /**
   * インジケーターのサイズ
   */
  size?: 'small' | 'large';

  /**
   * インジケーターの色
   */
  color?: string;
}

/**
 * LoadingFooter Component
 */
export const LoadingFooter: React.FC<LoadingFooterProps> = ({
  isLoading,
  message = '読み込み中...',
  size = 'small',
  color = '#3C507D',
}) => {
  if (!isLoading) {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={message}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator
        size={size}
        color={color}
        accessible={true}
        accessibilityLabel={message}
      />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  message: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
});

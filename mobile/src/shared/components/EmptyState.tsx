/**
 * EmptyState Component
 * データがない場合の空状態表示
 *
 * 機能:
 * - アイコン表示
 * - メッセージ表示
 * - カスタムアクションボタン
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface EmptyStateProps {
  /**
   * アイコン（絵文字またはテキスト）
   */
  icon?: string;

  /**
   * タイトル
   */
  title: string;

  /**
   * 説明文（オプション）
   */
  description?: string;

  /**
   * アクションボタンのラベル（オプション）
   */
  actionLabel?: string;

  /**
   * アクションボタンのハンドラー（オプション）
   */
  onAction?: () => void;
}

/**
 * EmptyState Component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const accessibilityLabel = description
    ? `${title}。${description}`
    : title;

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
    >
      <Text style={styles.icon} accessibilityLabel="">{icon}</Text>
      <Text
        style={styles.title}
        accessible={true}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {description && (
        <Text
          style={styles.description}
          accessible={true}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.button}
          onPress={onAction}
          accessible={true}
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          accessibilityHint="タップしてアクションを実行します"
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#3C507D',
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  description: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

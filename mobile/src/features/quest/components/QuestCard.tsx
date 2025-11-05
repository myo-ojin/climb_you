/**
 * QuestCard Component
 * 個別のクエストをカード形式で表示するコンポーネント
 *
 * 表示情報:
 * - クエストタイプ（SMALL / MEDIUM / VALIDATION）
 * - クエストタイトル
 * - 説明文
 * - 推定時間
 * - 難易度
 * - ステータス（PENDING / COMPLETED / SKIPPED / OBSTRUCTED）
 */

import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { Quest, QuestType, QuestDifficulty } from '../types';
import { Colors } from '@/shared/theme';
import { useAccessibleTheme, useBorderStyle } from '@/shared/hooks';
import { ScaledText, ScaledBody, ScaledCaption } from '@/shared/components';
import { ensureTouchTargetSize } from '@/shared/utils';

interface QuestCardProps {
  quest: Quest;
  onPress?: (questId: string) => void;
}

/**
 * QuestCard コンポーネント
 * クエスト情報をカード形式で表示
 */
export const QuestCard: React.FC<QuestCardProps> = ({ quest, onPress }) => {
  const theme = useAccessibleTheme();
  const borderStyle = useBorderStyle();

  // クエストタイプに対応する背景色
  const getTypeColor = useMemo((): string => {
    switch (quest.type) {
      case 'small':
        return Colors.questType.small;
      case 'medium':
        return Colors.questType.medium;
      case 'validation':
        return Colors.questType.validation;
      default:
        return Colors.gray[400];
    }
  }, [quest.type]);

  // 難易度に対応する表示色
  const getDifficultyColor = useMemo((): string => {
    switch (quest.difficulty) {
      case 'easy':
        return Colors.difficulty.easy;
      case 'medium':
        return Colors.difficulty.medium;
      case 'challenging':
        return Colors.difficulty.challenging;
      default:
        return Colors.gray[500];
    }
  }, [quest.difficulty]);

  // 難易度の日本語表示
  const getDifficultyLabel = useMemo((): string => {
    switch (quest.difficulty) {
      case 'easy':
        return '簡単';
      case 'medium':
        return '中級';
      case 'challenging':
        return 'チャレンジング';
      default:
        return quest.difficulty;
    }
  }, [quest.difficulty]);

  // クエストタイプの日本語表示
  const getTypeLabel = useMemo((): string => {
    switch (quest.type) {
      case 'small':
        return 'スモール';
      case 'medium':
        return 'ミディアム';
      case 'validation':
        return '検証';
      default:
        return quest.type;
    }
  }, [quest.type]);

  // ステータスアイコンの取得
  const getStatusIcon = useMemo((): string => {
    switch (quest.status) {
      case 'completed':
        return '✅';
      case 'skipped':
        return '⏭️';
      case 'obstructed':
        return '🚧';
      case 'pending':
      default:
        return '◯';
    }
  }, [quest.status]);

  // ステータス色の取得
  const getStatusColor = useMemo((): string => {
    switch (quest.status) {
      case 'completed':
        return Colors.success;
      case 'skipped':
        return Colors.warning;
      case 'obstructed':
        return Colors.error;
      case 'pending':
      default:
        return Colors.info;
    }
  }, [quest.status]);

  // アクセシビリティラベルの生成
  const a11yLabel = useMemo((): string => {
    return `${quest.title}、${getTypeLabel}、推定時間${quest.estimatedTime}分、難易度${getDifficultyLabel}`;
  }, [quest.title, getTypeLabel, quest.estimatedTime, getDifficultyLabel]);

  const handlePress = () => {
    if (onPress) {
      onPress(quest.id);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityLabel={a11yLabel}
      accessibilityRole="button"
      testID={`quest-card-${quest.id}`}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.elevation.level1,
            borderBottomColor: theme.border,
          },
          borderStyle,
        ]}
      >
        {/* ヘッダー: タイトルとバッジ */}
        <View style={styles.header}>
          <ScaledText
            baseFontSize={16}
            style={[
              styles.title,
              {
                color: theme.text,
              },
            ]}
            numberOfLines={2}
            testID={`quest-title-${quest.id}`}
          >
            {quest.title}
          </ScaledText>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: getTypeColor,
              },
            ]}
          >
            <ScaledCaption
              baseFontSize={12}
              style={styles.typeBadgeLabel}
              testID={`quest-type-${quest.id}`}
            >
              {getTypeLabel}
            </ScaledCaption>
          </View>
        </View>

        {/* 説明文 */}
        <ScaledBody
          baseFontSize={14}
          style={[
            styles.description,
            {
              color: theme.textSecondary,
            },
          ]}
          numberOfLines={3}
          testID={`quest-description-${quest.id}`}
        >
          {quest.description}
        </ScaledBody>

        {/* メタ情報: 推定時間、難易度、ステータス */}
        <View style={styles.metaContainer}>
          <View style={styles.metaGroup}>
            <ScaledCaption
              baseFontSize={13}
              style={[
                styles.metaLabel,
                {
                  color: theme.textSecondary,
                },
              ]}
              testID={`quest-time-${quest.id}`}
            >
              ⏱ {quest.estimatedTime}分
            </ScaledCaption>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaGroup}>
            <View style={styles.difficultyContainer}>
              <View
                style={[
                  styles.difficultyDot,
                  {
                    backgroundColor: getDifficultyColor,
                  },
                ]}
              />
              <ScaledCaption
                baseFontSize={13}
                style={[
                  styles.metaLabel,
                  {
                    color: theme.textSecondary,
                  },
                ]}
                testID={`quest-difficulty-${quest.id}`}
              >
                {getDifficultyLabel}
              </ScaledCaption>
            </View>
          </View>

          <View style={styles.metaDivider} />

          {/* ステータスインジケーター */}
          <View style={styles.metaGroup}>
            <ScaledText
              baseFontSize={20}
              style={[
                styles.statusIcon,
                {
                  color: getStatusColor,
                },
              ]}
              testID={`quest-status-${quest.id}`}
            >
              {getStatusIcon}
            </ScaledText>
          </View>
        </View>

        {/* 完了基準（小さなテキスト） */}
        <View style={styles.criteriaContainer}>
          <ScaledCaption
            baseFontSize={12}
            style={[
              styles.criteriaLabel,
              {
                color: theme.textSecondary,
              },
            ]}
            numberOfLines={2}
            testID={`quest-criteria-${quest.id}`}
          >
            完了基準: {quest.completionCriteria}
          </ScaledCaption>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginHorizontal: 0,
    marginVertical: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Android Elevation
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  typeBadgeLabel: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  metaGroup: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.gray[300],
    marginHorizontal: 8,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
  criteriaContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  criteriaLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});

export default QuestCard;

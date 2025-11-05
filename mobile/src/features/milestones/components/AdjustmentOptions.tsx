/**
 * AdjustmentOptions Component
 * 未達成時の選択肢コンポーネント
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NotAchievedOption, NOT_ACHIEVED_OPTIONS } from '../types';

export interface AdjustmentOptionsProps {
  /**
   * 現在の進捗率
   */
  progressRate: number;

  /**
   * マイルストーンのタイトル
   */
  milestoneTitle: string;

  /**
   * 選択肢が選択された時のコールバック
   */
  onOptionSelect: (option: NotAchievedOption) => void;

  /**
   * 現在選択されている選択肢
   */
  selectedOption?: NotAchievedOption;
}

/**
 * AdjustmentOptions Component
 */
export const AdjustmentOptions: React.FC<AdjustmentOptionsProps> = ({
  progressRate,
  milestoneTitle,
  onOptionSelect,
  selectedOption,
}) => {
  /**
   * 選択肢の推奨度を取得
   */
  const getRecommendation = (option: NotAchievedOption): string | null => {
    if (progressRate >= 70) {
      if (option === NotAchievedOption.CONTINUE) {
        return '推奨';
      }
    } else if (progressRate >= 40) {
      if (option === NotAchievedOption.ADJUST_GOAL) {
        return '推奨';
      }
    } else {
      if (option === NotAchievedOption.REDESIGN_MILESTONES) {
        return '推奨';
      }
    }
    return null;
  };

  /**
   * 進捗率に基づいたアドバイスメッセージを取得
   */
  const getAdviceMessage = (): string => {
    if (progressRate >= 70) {
      return 'もう少しで達成できそうです。現在の目標で続けることをお勧めします。';
    } else if (progressRate >= 40) {
      return '進捗が思うように進んでいないようです。目標を調整することで、モチベーションを維持しやすくなります。';
    } else {
      return '目標設定が難しすぎた可能性があります。マイルストーンを再設計して、より現実的なプランを立てましょう。';
    }
  };

  return (
    <View style={styles.container}>
      {/* 進捗状況の説明 */}
      <View style={styles.progressSummaryContainer}>
        <Text style={styles.progressSummaryTitle}>
          {milestoneTitle}の進捗率: {progressRate}%
        </Text>
        <Text style={styles.progressSummaryText}>{getAdviceMessage()}</Text>
      </View>

      {/* 選択肢一覧 */}
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsTitle}>次のステップを選択してください</Text>

        {NOT_ACHIEVED_OPTIONS.map((optionInfo) => {
          const isSelected = selectedOption === optionInfo.option;
          const recommendation = getRecommendation(optionInfo.option);

          return (
            <TouchableOpacity
              key={optionInfo.option}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => onOptionSelect(optionInfo.option)}
            >
              {/* 推奨バッジ */}
              {recommendation && (
                <View style={styles.recommendationBadge}>
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              )}

              <View style={styles.optionHeader}>
                <Text style={styles.optionIcon}>{optionInfo.icon}</Text>
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelSelected,
                  ]}
                >
                  {optionInfo.label}
                </Text>
              </View>

              <Text
                style={[
                  styles.optionDescription,
                  isSelected && styles.optionDescriptionSelected,
                ]}
              >
                {optionInfo.description}
              </Text>

              {/* 詳細説明 */}
              {optionInfo.option === NotAchievedOption.CONTINUE && (
                <View style={styles.detailsContainer}>
                  <Text style={styles.detailsTitle}>この選択肢の場合:</Text>
                  <Text style={styles.detailsText}>
                    • 現在の目標とマイルストーンを維持します{'\n'}
                    • 次のクエストも同じ基準で生成されます{'\n'}
                    • 進捗が改善しない場合は、後で調整できます
                  </Text>
                </View>
              )}

              {optionInfo.option === NotAchievedOption.ADJUST_GOAL && (
                <View style={styles.detailsContainer}>
                  <Text style={styles.detailsTitle}>この選択肢の場合:</Text>
                  <Text style={styles.detailsText}>
                    • AIが進捗状況を分析します{'\n'}
                    • より現実的な目標を提案します{'\n'}
                    • KPIや期限を調整できます
                  </Text>
                </View>
              )}

              {optionInfo.option === NotAchievedOption.REDESIGN_MILESTONES && (
                <View style={styles.detailsContainer}>
                  <Text style={styles.detailsTitle}>この選択肢の場合:</Text>
                  <Text style={styles.detailsText}>
                    • これまでの達成パターンを分析します{'\n'}
                    • 10合目の新しいマイルストーンを提案します{'\n'}
                    • より達成しやすいステップに調整します
                  </Text>
                </View>
              )}

              {/* 選択インジケーター */}
              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>✓ 選択中</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ヒント */}
      <View style={styles.hintContainer}>
        <Text style={styles.hintIcon}>💡</Text>
        <Text style={styles.hintText}>
          目標達成は一直線ではありません。調整することは失敗ではなく、より賢い選択です。
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  detailsContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
    padding: 12,
  },
  detailsText: {
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
  },
  detailsTitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  hintContainer: {
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  hintIcon: {
    fontSize: 20,
  },
  hintText: {
    color: '#2E7D32',
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  optionCard: {
    backgroundColor: '#FFF',
    borderColor: '#E0E0E0',
    borderRadius: 12,
    borderWidth: 2,
    elevation: 2,
    gap: 12,
    padding: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionCardSelected: {
    backgroundColor: '#F0F4F8',
    borderColor: '#3C507D',
  },
  optionDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  optionDescriptionSelected: {
    color: '#3C507D',
  },
  optionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  optionIcon: {
    fontSize: 32,
  },
  optionLabel: {
    color: '#333',
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  optionLabelSelected: {
    color: '#3C507D',
  },
  optionsContainer: {
    gap: 16,
  },
  optionsTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  progressSummaryContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    gap: 8,
    padding: 16,
  },
  progressSummaryText: {
    color: '#E65100',
    fontSize: 14,
    lineHeight: 20,
  },
  progressSummaryTitle: {
    color: '#E65100',
    fontSize: 16,
    fontWeight: '700',
  },
  recommendationBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  recommendationText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedIndicator: {
    alignItems: 'center',
    backgroundColor: '#3C507D',
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 8,
  },
  selectedIndicatorText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

/**
 * ProgressRateInput Component
 * 進捗率入力UIコンポーネント
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Slider from '@react-native-community/slider';

export interface ProgressRateInputProps {
  /**
   * 初期進捗率（0-100）
   */
  initialValue?: number;

  /**
   * 進捗率が変更された時のコールバック
   */
  onProgressRateChange: (rate: number) => void;

  /**
   * マイルストーンのタイトル
   */
  milestoneTitle: string;

  /**
   * 達成基準
   */
  criteria: string;
}

/**
 * ProgressRateInput Component
 */
export const ProgressRateInput: React.FC<ProgressRateInputProps> = ({
  initialValue = 50,
  onProgressRateChange,
  milestoneTitle,
  criteria,
}) => {
  const [progressRate, setProgressRate] = useState<number>(initialValue);
  const [inputValue, setInputValue] = useState<string>(initialValue.toString());

  useEffect(() => {
    onProgressRateChange(progressRate);
  }, [progressRate, onProgressRateChange]);

  /**
   * スライダーの値が変更された時
   */
  const handleSliderChange = (value: number) => {
    const roundedValue = Math.round(value);
    setProgressRate(roundedValue);
    setInputValue(roundedValue.toString());
  };

  /**
   * テキスト入力の値が変更された時
   */
  const handleTextInputChange = (text: string) => {
    setInputValue(text);

    // 数値に変換
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setProgressRate(numValue);
    }
  };

  /**
   * テキスト入力のフォーカスが外れた時
   */
  const handleTextInputBlur = () => {
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      // 無効な値の場合は、現在の進捗率にリセット
      setInputValue(progressRate.toString());
    }
  };

  /**
   * プリセット値を選択
   */
  const handlePresetSelect = (value: number) => {
    setProgressRate(value);
    setInputValue(value.toString());
  };

  /**
   * 進捗状態メッセージを取得
   */
  const getProgressMessage = (): { text: string; color: string } => {
    if (progressRate >= 80) {
      return { text: 'もう少しで達成です！頑張りましょう！', color: '#4CAF50' };
    } else if (progressRate >= 50) {
      return { text: '順調に進んでいます', color: '#2196F3' };
    } else if (progressRate >= 20) {
      return { text: 'まだ道のりがありますが、着実に前進しています', color: '#FF9800' };
    } else {
      return {
        text: 'ゆっくりでも大丈夫です。自分のペースで進みましょう',
        color: '#F44336',
      };
    }
  };

  const progressMessage = getProgressMessage();

  return (
    <View style={styles.container}>
      {/* マイルストーン情報 */}
      <View style={styles.milestoneInfoContainer}>
        <Text style={styles.milestoneTitle}>{milestoneTitle}</Text>
        <Text style={styles.criteria}>達成基準: {criteria}</Text>
      </View>

      {/* 進捗率表示 */}
      <View style={styles.rateDisplayContainer}>
        <Text style={styles.rateLabel}>現在の進捗率</Text>
        <View style={styles.rateValueContainer}>
          <TextInput
            style={styles.rateInput}
            value={inputValue}
            onChangeText={handleTextInputChange}
            onBlur={handleTextInputBlur}
            keyboardType="number-pad"
            maxLength={3}
          />
          <Text style={styles.rateUnit}>%</Text>
        </View>
      </View>

      {/* スライダー */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={progressRate}
          onValueChange={handleSliderChange}
          minimumTrackTintColor="#3C507D"
          maximumTrackTintColor="#E0E0E0"
          thumbTintColor="#3C507D"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>0%</Text>
          <Text style={styles.sliderLabel}>50%</Text>
          <Text style={styles.sliderLabel}>100%</Text>
        </View>
      </View>

      {/* プリセット値ボタン */}
      <View style={styles.presetsContainer}>
        <Text style={styles.presetsLabel}>クイック選択</Text>
        <View style={styles.presetButtons}>
          {[0, 25, 50, 75, 90, 100].map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.presetButton,
                progressRate === value && styles.presetButtonActive,
              ]}
              onPress={() => handlePresetSelect(value)}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  progressRate === value && styles.presetButtonTextActive,
                ]}
              >
                {value}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 進捗バー */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressRate}%`, backgroundColor: progressMessage.color },
            ]}
          />
        </View>
      </View>

      {/* 進捗メッセージ */}
      <View
        style={[
          styles.messageContainer,
          { backgroundColor: `${progressMessage.color}15` },
        ]}
      >
        <Text style={[styles.messageText, { color: progressMessage.color }]}>
          {progressMessage.text}
        </Text>
      </View>

      {/* ヒント */}
      <View style={styles.hintContainer}>
        <Text style={styles.hintIcon}>💡</Text>
        <Text style={styles.hintText}>
          正直な評価をお願いします。進捗率に基づいて、最適な次のステップをご提案します。
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  criteria: {
    color: '#666',
    fontSize: 13,
  },
  hintContainer: {
    alignItems: 'flex-start',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  hintIcon: {
    fontSize: 20,
  },
  hintText: {
    color: '#666',
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  messageContainer: {
    borderRadius: 12,
    padding: 16,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  milestoneInfoContainer: {
    backgroundColor: '#F0F4F8',
    borderRadius: 12,
    gap: 8,
    padding: 16,
  },
  milestoneTitle: {
    color: '#3C507D',
    fontSize: 16,
    fontWeight: '600',
  },
  presetButton: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  presetButtonActive: {
    backgroundColor: '#3C507D',
    borderColor: '#3C507D',
  },
  presetButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  presetButtonTextActive: {
    color: '#FFF',
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetsContainer: {
    gap: 12,
  },
  presetsLabel: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    paddingVertical: 8,
  },
  progressBarFill: {
    borderRadius: 8,
    height: '100%',
  },
  progressBarTrack: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    height: 16,
    overflow: 'hidden',
  },
  rateDisplayContainer: {
    alignItems: 'center',
    gap: 12,
  },
  rateInput: {
    color: '#3C507D',
    fontSize: 48,
    fontWeight: '700',
    minWidth: 120,
    padding: 0,
    textAlign: 'center',
  },
  rateLabel: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  rateUnit: {
    color: '#3C507D',
    fontSize: 32,
    fontWeight: '600',
  },
  rateValueContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  slider: {
    height: 40,
    width: '100%',
  },
  sliderContainer: {
    gap: 8,
  },
  sliderLabel: {
    color: '#999',
    fontSize: 12,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
});

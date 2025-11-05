/**
 * Commit Time Step
 * 1日のコミットタイム選択ステップ
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
} from 'react-native';
import { COMMIT_TIME_OPTIONS, parseCommitTimeToMinutes } from '../utils';

interface CommitTimeStepProps {
  selected?: string;
  onSelect: (commitTime: string) => void;
  onBack: () => void;
  loading?: boolean;
}

// UI 用の拡張オプション形式
const COMMIT_TIME_UI_OPTIONS = [
  { label: '15分', value: '15分', displayLabel: '毎日15分の時間確保' },
  { label: '30分', value: '30分', displayLabel: '毎日30分の時間確保' },
  { label: '1時間', value: '1時間', displayLabel: '毎日1時間の時間確保' },
  { label: '2時間', value: '2時間', displayLabel: '毎日2時間の時間確保' },
];

const CommitTimeStep: React.FC<CommitTimeStepProps> = ({
  selected,
  onSelect,
  onBack,
  loading = false,
}) => {
  const [customTime, setCustomTime] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(
    selected || null
  );

  const handleSelectOption = (value: string) => {
    setSelectedOption(value);
    setCustomTime('');
  };

  const handleSelectCustom = () => {
    if (!customTime.trim()) {
      Alert.alert('入力エラー', '時間を入力してください');
      return;
    }

    // カスタム入力値の検証
    try {
      const minutes = parseCommitTimeToMinutes(customTime);
      if (minutes < 10 || minutes > 480) {
        // 10分〜480分（8時間）の範囲チェック
        Alert.alert(
          '入力エラー',
          '10分〜8時間の間で入力してください'
        );
        return;
      }
      setSelectedOption('custom');
    } catch (error) {
      Alert.alert(
        '入力エラー',
        '正しい形式で入力してください\n例：30分、1時間、1時間30分'
      );
    }
  };

  const handleNext = () => {
    if (!selectedOption) {
      Alert.alert('選択エラー', 'コミットタイムを選択してください');
      return;
    }

    if (selectedOption === 'custom' && !customTime.trim()) {
      Alert.alert('入力エラー', '時間を入力してください');
      return;
    }

    const commitTime =
      selectedOption === 'custom' ? customTime : selectedOption;

    if (commitTime) {
      onSelect(commitTime);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            1日のコミットタイムを選択してください
          </Text>
          <Text style={styles.subtitle}>
            現実的に毎日続けられる時間を選びましょう
          </Text>
        </View>

        <View style={styles.optionsSection}>
          {COMMIT_TIME_UI_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                selectedOption === option.value && styles.optionSelected,
              ]}
              onPress={() => handleSelectOption(option.value)}
              disabled={loading}
              accessible
              accessibilityLabel={option.label}
              accessibilityHint="コミットタイムを選択"
            >
              <View
                style={[
                  styles.optionRadio,
                  selectedOption === option.value &&
                    styles.optionRadioSelected,
                ]}
              >
                {selectedOption === option.value && (
                  <View style={styles.optionRadioInner} />
                )}
              </View>
              <View style={styles.optionLabelContainer}>
                <Text
                  style={[
                    styles.optionLabel,
                    selectedOption === option.value &&
                      styles.optionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>
                  {option.displayLabel}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>または</Text>
        </View>

        <View style={styles.customSection}>
          <Text style={styles.label}>その他の時間を入力</Text>
          <Text style={styles.hint}>例：「45分」「週休で1時間」など</Text>

          <TextInput
            style={[
              styles.customInput,
              selectedOption === 'custom' && styles.customInputActive,
            ]}
            placeholder="時間を入力してください"
            placeholderTextColor="#999"
            value={customTime}
            onChangeText={setCustomTime}
            editable={true}
            accessible
            accessibilityLabel="カスタム時間入力フィールド"
          />

          <TouchableOpacity
            style={[
              styles.customSelectButton,
              customTime.trim()
                ? styles.customSelectButtonActive
                : styles.customSelectButtonDisabled,
            ]}
            onPress={handleSelectCustom}
            disabled={!customTime.trim()}
            accessible
            accessibilityLabel="この時間を選択"
          >
            <Text
              style={[
                styles.customSelectButtonText,
                !customTime.trim() && styles.customSelectButtonTextDisabled,
              ]}
            >
              この時間を選択
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ ご注意</Text>
          <Text style={styles.warningText}>
            選択した時間が短すぎるか長すぎると、適切なクエストが生成されない場合があります。
            実現可能な時間を選ぶことをお勧めします。
          </Text>
        </View>

        <View style={styles.exampleBox}>
          <Text style={styles.exampleTitle}>📋 参考例</Text>
          <Text style={styles.exampleText}>
            • 毎朝のルーチン時間：30分〜1時間
          </Text>
          <Text style={styles.exampleText}>
            • 仕事の休み時間：15分
          </Text>
          <Text style={styles.exampleText}>
            • 週末の専用時間：2時間以上
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={loading}
          accessible
          accessibilityLabel="戻る"
        >
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            (!selectedOption || loading) && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedOption || loading}
          accessible
          accessibilityLabel="次へ"
        >
          <Text style={styles.nextButtonText}>次へ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#112250',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  optionsSection: {
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#EEEEEE',
    backgroundColor: '#FFF',
  },
  optionSelected: {
    borderColor: '#3C507D',
    backgroundColor: '#F0F4F8',
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: '#3C507D',
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3C507D',
  },
  optionLabelContainer: {
    flex: 1,
    marginLeft: 0,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: '#3C507D',
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  customSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    lineHeight: 16,
  },
  customInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  customInputActive: {
    borderColor: '#3C507D',
    backgroundColor: '#F0F4F8',
  },
  customSelectButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3C507D',
  },
  customSelectButtonActive: {
    backgroundColor: '#3C507D',
  },
  customSelectButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  customSelectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  customSelectButtonTextDisabled: {
    color: '#999',
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 13,
    color: '#BF360C',
    lineHeight: 18,
  },
  exampleBox: {
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#9C27B0',
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6A1B9A',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 12,
    color: '#4A148C',
    lineHeight: 16,
    marginBottom: 4,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 0,
    paddingBottom: 20,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFF',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3C507D',
  },
  nextButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
});

export default CommitTimeStep;

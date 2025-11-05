/**
 * Duration Step
 * 目標達成期間選択ステップ
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';

interface DurationStepProps {
  selected?: string;
  onSelect: (duration: string) => void;
  onBack: () => void;
}

const DURATION_OPTIONS = [
  { label: '1ヶ月以内', value: '1month' },
  { label: '3ヶ月以内', value: '3months' },
  { label: '6ヶ月以内', value: '6months' },
  { label: '1年以内', value: '1year' },
];

const DurationStep: React.FC<DurationStepProps> = ({
  selected,
  onSelect,
  onBack,
}) => {
  const [customDuration, setCustomDuration] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(
    selected || null
  );

  const handleSelectOption = (value: string) => {
    setSelectedOption(value);
    setCustomDuration('');
  };

  const handleSelectCustom = () => {
    if (!customDuration.trim()) {
      alert('期間を入力してください');
      return;
    }
    setSelectedOption('custom');
  };

  const handleNext = () => {
    if (selectedOption === 'custom' && !customDuration.trim()) {
      alert('期間を入力してください');
      return;
    }

    const duration =
      selectedOption === 'custom' ? customDuration : selectedOption;
    if (duration) {
      onSelect(duration);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>目標達成期間を選択してください</Text>
          <Text style={styles.subtitle}>
            目標を達成するまでの期間を見積もりましょう
          </Text>
        </View>

        <View style={styles.optionsSection}>
          {DURATION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                selectedOption === option.value && styles.optionSelected,
              ]}
              onPress={() => handleSelectOption(option.value)}
              accessible
              accessibilityLabel={option.label}
              accessibilityHint="期間を選択"
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
              <Text
                style={[
                  styles.optionLabel,
                  selectedOption === option.value &&
                    styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>または</Text>
        </View>

        <View style={styles.customSection}>
          <Text style={styles.label}>その他の期間を入力</Text>
          <Text style={styles.hint}>
            例：「2ヶ月」「6週間」「春までに」など
          </Text>

          <TextInput
            style={[
              styles.customInput,
              selectedOption === 'custom' && styles.customInputActive,
            ]}
            placeholder="期間を入力してください"
            placeholderTextColor="#999"
            value={customDuration}
            onChangeText={setCustomDuration}
            editable={true}
            accessible
            accessibilityLabel="カスタム期間入力フィールド"
          />

          <TouchableOpacity
            style={[
              styles.customSelectButton,
              customDuration.trim()
                ? styles.customSelectButtonActive
                : styles.customSelectButtonDisabled,
            ]}
            onPress={handleSelectCustom}
            disabled={!customDuration.trim()}
            accessible
            accessibilityLabel="この期間を選択"
          >
            <Text
              style={[
                styles.customSelectButtonText,
                !customDuration.trim() &&
                  styles.customSelectButtonTextDisabled,
              ]}
            >
              この期間を選択
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 ヒント</Text>
          <Text style={styles.infoText}>
            リアルな期間を設定することで、より適切なクエストが生成されます。無理なスケジュールは避けましょう。
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessible
          accessibilityLabel="戻る"
        >
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedOption && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedOption}
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
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    flex: 1,
  },
  optionLabelSelected: {
    color: '#3C507D',
    fontWeight: '600',
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
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#0D47A1',
    lineHeight: 18,
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

export default DurationStep;

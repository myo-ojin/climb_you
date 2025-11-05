/**
 * Goal Step
 * 目標入力とSMART + WOOP分析ステップ
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { OnboardingStep, GoalAnalysisResult, GoalData } from '../types';
import SmartAnalysisDisplay from '../components/SmartAnalysisDisplay';

interface GoalStepProps {
  step: OnboardingStep;
  analysis?: GoalAnalysisResult;
  goal?: GoalData;
  onSubmit: (goalText: string, context?: string) => void;
  onBack: () => void;
  loading: boolean;
}

const GoalStep: React.FC<GoalStepProps> = ({
  step,
  analysis,
  goal,
  onSubmit,
  onBack,
  loading,
}) => {
  const [goalText, setGoalText] = useState(goal?.title || '');
  const [context, setContext] = useState('');

  const isGoalStep = step === 'goal';
  const isObstacleStep = step === 'obstacles';

  const handleSubmit = () => {
    if (!goalText.trim()) {
      alert('Please enter your goal');
      return;
    }

    onSubmit(goalText, context || undefined);
  };

  const renderGoalInput = () => (
    <View style={styles.inputSection}>
      <Text style={styles.label}>
        あなたの長期目標を入力してください
        <Text style={styles.required}>*</Text>
      </Text>
      <Text style={styles.hint}>
        できるだけ詳しく、あなたが達成したいことを説明してください
      </Text>

      <TextInput
        style={styles.textInput}
        placeholder="例：TOEIC 800点を取得する"
        placeholderTextColor="#999"
        value={goalText}
        onChangeText={setGoalText}
        multiline
        numberOfLines={4}
        editable={!loading}
        accessible
        accessibilityLabel="目標入力フィールド"
      />

      <Text style={styles.label}>背景や動機（オプション）</Text>
      <TextInput
        style={styles.textInput}
        placeholder="例：海外で働きたいから"
        placeholderTextColor="#999"
        value={context}
        onChangeText={setContext}
        multiline
        numberOfLines={3}
        editable={!loading}
        accessible
        accessibilityLabel="背景情報入力フィールド"
      />
    </View>
  );

  const renderAnalysisResult = () => {
    if (!analysis) return null;

    return (
      <View style={styles.analysisSection}>
        <Text style={styles.analysisTitle}>目標の分析結果</Text>

        {analysis.isComplete ? (
          <View style={styles.completeMessage}>
            <Text style={styles.completeIcon}>✓</Text>
            <Text style={styles.completeText}>
              目標が明確です！このまま進めましょう
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.incompleteMessage}>
              以下の要素が不足しています：
            </Text>
            {analysis.missingElements.map((element, index) => (
              <Text key={index} style={styles.missingElement}>
                • {element}
              </Text>
            ))}

            {analysis.suggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                <Text style={styles.suggestionsTitle}>改善のためのご提案：</Text>
                {analysis.suggestions.map((suggestion, index) => (
                  <Text key={index} style={styles.suggestion}>
                    {index + 1}. {suggestion}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}

        <SmartAnalysisDisplay smartAnalysis={analysis.smartAnalysis} />
      </View>
    );
  };

  const renderObstacleInput = () => (
    <View style={styles.obstacleSection}>
      <Text style={styles.label}>
        達成を妨げる可能性のある障害は何ですか？
        <Text style={styles.required}>*</Text>
      </Text>
      <Text style={styles.hint}>
        複数ある場合は、カンマで区切ってください
      </Text>

      <TextInput
        style={styles.textInput}
        placeholder="例：仕事が忙しい、モチベーション低下のリスク、基礎知識不足"
        placeholderTextColor="#999"
        value={goalText}
        onChangeText={setGoalText}
        multiline
        numberOfLines={4}
        editable={!loading}
        accessible
        accessibilityLabel="障害入力フィールド"
      />

      <Text style={styles.label}>それらの障害に対処する計画を教えてください</Text>
      <TextInput
        style={styles.textInput}
        placeholder="例：毎朝30分早起きして勉強時間を確保する"
        placeholderTextColor="#999"
        value={context}
        onChangeText={setContext}
        multiline
        numberOfLines={4}
        editable={!loading}
        accessible
        accessibilityLabel="対処計画入力フィールド"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isGoalStep ? '長期目標の設定' : '障害と対処計画'}
          </Text>
          <Text style={styles.subtitle}>
            {isGoalStep
              ? '山頂を目指すための目標を設定しましょう'
              : '達成を阻みそうな課題に対策を立てましょう'}
          </Text>
        </View>

        {isGoalStep ? renderGoalInput() : renderObstacleInput()}

        {analysis && renderAnalysisResult()}

        {analysis && !analysis.isComplete && isGoalStep && (
          <View style={styles.updatePrompt}>
            <Text style={styles.updateTitle}>目標を修正してもう一度試してください</Text>
            <Text style={styles.updateHint}>
              SMART基準を満たす目標に修正いただくと、より適切なクエストが生成されます
            </Text>
          </View>
        )}
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
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!goalText.trim() || loading}
          accessible
          accessibilityLabel={isGoalStep ? '分析する' : '次へ'}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isGoalStep
                ? analysis?.isComplete
                  ? '次へ'
                  : '分析する'
                : '確認する'}
            </Text>
          )}
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
  inputSection: {
    marginBottom: 20,
  },
  obstacleSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#D32F2F',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    lineHeight: 16,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  analysisSection: {
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#112250',
    marginBottom: 12,
  },
  completeMessage: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeIcon: {
    fontSize: 20,
    color: '#4CAF50',
    marginRight: 12,
    fontWeight: '700',
  },
  completeText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  incompleteMessage: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '500',
    marginBottom: 8,
  },
  missingElement: {
    fontSize: 13,
    color: '#D32F2F',
    marginBottom: 6,
    lineHeight: 18,
  },
  suggestionsBox: {
    backgroundColor: '#FFF',
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 8,
  },
  suggestion: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    lineHeight: 18,
  },
  updatePrompt: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  updateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 4,
  },
  updateHint: {
    fontSize: 12,
    color: '#BF360C',
    lineHeight: 16,
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
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3C507D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
});

export default GoalStep;

/**
 * Profile Step
 * ユーザープロファイル7項目収集ステップ
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { UserProfileData } from '../types';
import {
  PROFILE_QUESTIONS,
  normalizeProfileData,
  validateProfileData,
} from '../utils';

interface ProfileStepProps {
  profile?: UserProfileData;
  onComplete: (profile: UserProfileData) => void;
  onBack: () => void;
  onGenerateMilestones: () => void;
  loading: boolean;
}

interface ProfileAnswers {
  lifestyle?: string;
  focusTime?: string;
  workEnvironment?: string;
  taskPace?: string;
  pastFailureReason?: string;
  skillLevel?: string;
  difficultyPreference?: string;
  customAnswers: Record<string, string>;
}

const ProfileStep: React.FC<ProfileStepProps> = ({
  profile,
  onComplete,
  onBack,
  onGenerateMilestones,
  loading,
}) => {
  const [answers, setAnswers] = useState<ProfileAnswers>({
    lifestyle: profile?.lifestyle,
    focusTime: profile?.focusTime,
    workEnvironment: profile?.workEnvironment,
    taskPace: profile?.taskPace,
    pastFailureReason: profile?.pastFailureReason,
    skillLevel: profile?.skillLevel,
    difficultyPreference: profile?.difficultyPreference,
    customAnswers: {},
  });

  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleCustomAnswer = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      customAnswers: {
        ...prev.customAnswers,
        [questionId]: text,
      },
      [questionId]: text,
    }));
  };

  const isAllAnswered = PROFILE_QUESTIONS.every((q) => answers[q.id as keyof ProfileAnswers]);

  const handleComplete = useCallback(() => {
    if (!isAllAnswered) {
      Alert.alert(
        '未回答の質問があります',
        'すべての質問に答えてからお進みください'
      );
      return;
    }

    // プロファイルデータを構築
    const profileData: UserProfileData = {
      lifestyle: answers.lifestyle || '',
      focusTime: answers.focusTime || '',
      workEnvironment: answers.workEnvironment || '',
      taskPace: answers.taskPace || '',
      pastFailureReason: answers.pastFailureReason || '',
      skillLevel: answers.skillLevel || '',
      difficultyPreference: answers.difficultyPreference || '',
    };

    // プロファイルデータを検証
    const normalized = normalizeProfileData(profileData);
    const validation = validateProfileData(normalized);

    if (!validation.valid) {
      Alert.alert(
        'プロファイルエラー',
        validation.errors.join('\n')
      );
      return;
    }

    // 検証済みプロファイルを返す
    onComplete(normalized as UserProfileData);
  }, [isAllAnswered, answers, onComplete]);

  const renderQuestionOption = (questionId: string, option: string, index: number) => {
    const isSelected = answers[questionId as keyof ProfileAnswers] === option;

    return (
      <TouchableOpacity
        key={`${questionId}-${index}`}
        style={[
          styles.questionOption,
          isSelected && styles.questionOptionSelected,
        ]}
        onPress={() => handleSelectAnswer(questionId, option)}
        accessible
        accessibilityLabel={option}
        accessibilityHint="選択肢を選ぶ"
      >
        <View
          style={[
            styles.optionRadio,
            isSelected && styles.optionRadioSelected,
          ]}
        >
          {isSelected && <View style={styles.optionRadioInner} />}
        </View>
        <Text
          style={[
            styles.optionText,
            isSelected && styles.optionTextSelected,
          ]}
        >
          {option}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>プロファイル設定</Text>
          <Text style={styles.subtitle}>
            あなたに合ったクエストを生成するための情報を教えてください
          </Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    (PROFILE_QUESTIONS.filter((q) => answers[q.id as keyof ProfileAnswers]).length /
                      PROFILE_QUESTIONS.length) *
                    100
                  }%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {PROFILE_QUESTIONS.filter((q) => answers[q.id as keyof ProfileAnswers]).length} / {PROFILE_QUESTIONS.length} 完了
          </Text>
        </View>

        <View style={styles.questionsSection}>
          {PROFILE_QUESTIONS.map((question, index) => {
            const isExpanded = expandedQuestion === question.id;
            const isAnswered = !!answers[question.id as keyof ProfileAnswers];

            return (
              <View
                key={question.id}
                style={[
                  styles.questionCard,
                  isExpanded && styles.questionCardExpanded,
                  isAnswered && styles.questionCardAnswered,
                ]}
              >
                <TouchableOpacity
                  style={styles.questionHeader}
                  onPress={() =>
                    setExpandedQuestion(isExpanded ? null : question.id)
                  }
                  accessible
                  accessibilityLabel={question.question}
                  accessibilityHint={isAnswered ? '回答済み' : '未回答'}
                >
                  <View style={styles.questionNumberAndTitle}>
                    <Text style={styles.questionNumber}>Q{index + 1}</Text>
                    <Text style={styles.questionText}>{question.question}</Text>
                  </View>
                  <Text style={styles.expandIcon}>
                    {isExpanded ? '▼' : '▶'}
                  </Text>
                  {isAnswered && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.questionContent}>
                    {question.options.map((option, optIndex) =>
                      renderQuestionOption(question.id, option, optIndex)
                    )}

                    {question.options.some((opt) => opt === 'その他' || opt.includes('その他')) && (
                      <TextInput
                        style={[
                          styles.customInput,
                          answers.customAnswers[question.id] &&
                            styles.customInputFilled,
                        ]}
                        placeholder="その他の場合は詳しく入力してください"
                        placeholderTextColor="#999"
                        value={answers.customAnswers[question.id] || ''}
                        onChangeText={(text) =>
                          handleCustomAnswer(question.id, text)
                        }
                        accessible
                        accessibilityLabel="カスタム回答"
                      />
                    )}
                  </View>
                )}
              </View>
            );
          })}
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
            (!isAllAnswered || loading) && styles.nextButtonDisabled,
          ]}
          onPress={() => {
            handleComplete();
            // プロファイル完了後、マイルストーン生成を開始
            if (isAllAnswered) {
              setTimeout(() => {
                onGenerateMilestones();
              }, 300);
            }
          }}
          disabled={!isAllAnswered || loading}
          accessible
          accessibilityLabel="マイルストーンを生成"
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.nextButtonText}>
              マイルストーン生成
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
    marginBottom: 20,
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
  progressSection: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3C507D',
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  questionsSection: {
    marginBottom: 20,
  },
  questionCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  questionCardExpanded: {
    borderColor: '#3C507D',
  },
  questionCardAnswered: {
    backgroundColor: '#F0F4F8',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  questionNumberAndTitle: {
    flex: 1,
    marginRight: 12,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    lineHeight: 18,
  },
  expandIcon: {
    fontSize: 12,
    color: '#999',
    marginRight: 12,
  },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
  },
  questionContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
  },
  questionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderRadius: 6,
  },
  questionOptionSelected: {
    backgroundColor: '#E8F4F8',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: '#3C507D',
  },
  optionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3C507D',
  },
  optionText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  optionTextSelected: {
    color: '#3C507D',
    fontWeight: '600',
  },
  customInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#333',
    marginTop: 8,
  },
  customInputFilled: {
    borderColor: '#3C507D',
    backgroundColor: '#F0F4F8',
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

export default ProfileStep;

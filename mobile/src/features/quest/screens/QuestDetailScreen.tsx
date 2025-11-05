/**
 * QuestDetailScreen
 * クエスト詳細画面 - クエストの詳細情報を表示
 *
 * 表示内容:
 * - クエストタイプ、難易度、推定時間
 * - タイトル、説明、完了基準
 * - エビデンスタイプ
 * - 3つのアクション: 完了 / 見送り / 阻害
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Quest } from '@/core/domain/entities/Quest';
import { useQuestUseCase } from '../hooks/useQuestUseCase';
import { Colors, LightTheme, DarkTheme } from '@/shared/theme';
import { useAccessibility } from '@/shared/hooks';

type QuestDetailScreenProps = NativeStackScreenProps<
  any, // QuestStackParamList
  'QuestDetail'
>;

/**
 * QuestDetailScreen コンポーネント
 * クエストの詳細情報と完了/見送り/阻害のアクション
 */
export const QuestDetailScreen: React.FC<QuestDetailScreenProps> = ({ navigation, route }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const questUseCase = useQuestUseCase();
  const { isScreenReaderEnabled, announce } = useAccessibility();

  // route.params から questId を取得
  const { questId } = route.params as { questId: string };

  // クエスト情報取得（ローカルキャッシュから）
  const [quest, setQuest] = React.useState<Quest | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // クエスト情報を取得
  React.useEffect(() => {
    const fetchQuest = async () => {
      try {
        setIsLoading(true);
        const fetchedQuest = await questUseCase.getQuestById(questId);

        if (!fetchedQuest) {
          setError('クエストが見つかりません');
          announce('エラー: クエストが見つかりません');
          return;
        }

        if (!questUseCase.isQuestValid(fetchedQuest)) {
          setError('このクエストは期限が切れています');
          announce('エラー: このクエストは期限が切れています');
          return;
        }

        setQuest(fetchedQuest);
        setError(null);
        announce(`クエスト詳細を読み込みました: ${fetchedQuest.title}`);
      } catch (err) {
        console.error('[QuestDetailScreen] Error fetching quest:', err);
        setError('クエスト情報の取得に失敗しました');
        announce('エラー: クエスト情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuest();
  }, [questId, questUseCase, announce]);

  // タイプカラーの取得
  const getTypeColor = useMemo((): string => {
    if (!quest) return Colors.gray[400];
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
  }, [quest]);

  // タイプラベルの取得
  const getTypeLabel = useMemo((): string => {
    if (!quest) return '';
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
  }, [quest]);

  // 難易度カラーの取得
  const getDifficultyColor = useMemo((): string => {
    if (!quest) return Colors.gray[500];
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
  }, [quest]);

  // 難易度ラベルの取得
  const getDifficultyLabel = useMemo((): string => {
    if (!quest) return '';
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
  }, [quest]);

  // エビデンスタイプラベルの取得
  const getEvidenceTypeLabel = useMemo((): string => {
    if (!quest) return '';
    switch (quest.evidenceType) {
      case 'text':
        return 'テキスト入力';
      case 'image':
        return '画像提出';
      case 'file':
        return 'ファイル提出';
      case 'none':
        return 'エビデンス不要';
      default:
        return quest.evidenceType;
    }
  }, [quest]);

  // 完了アクション
  const handleComplete = useCallback(() => {
    announce('クエスト完了画面を開いています');
    navigation.navigate('QuestCompletion', { questId });
  }, [navigation, questId, announce]);

  // 見送りアクション
  const handleSkip = useCallback(() => {
    announce('クエスト見送り画面を開いています');
    navigation.navigate('QuestSkip', { questId });
  }, [navigation, questId, announce]);

  // 阻害アクション
  const handleObstruction = useCallback(() => {
    announce('クエスト阻害画面を開いています');
    navigation.navigate('QuestObstruction', { questId });
  }, [navigation, questId, announce]);

  // 戻るボタン
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: theme.background,
          },
        ]}
        accessibilityLabel="クエスト詳細画面"
      >
        <View
          style={[
            styles.loadingContainer,
            {
              backgroundColor: theme.background,
            },
          ]}
          accessible={true}
          accessibilityLabel="読み込み中"
          accessibilityRole="progressbar"
        >
          <ActivityIndicator
            size="large"
            color={Colors.mountainBlue}
            testID="quest-detail-loading"
            accessible={true}
            accessibilityLabel="クエスト詳細を読み込んでいます"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !quest) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: theme.background,
          },
        ]}
        accessibilityLabel="クエスト詳細画面"
      >
        <View
          style={[
            styles.errorContainer,
            {
              backgroundColor: theme.background,
            },
          ]}
          accessible={true}
          accessibilityLabel={`エラー: ${error}`}
          accessibilityRole="alert"
        >
          <Text
            style={[
              styles.errorTitle,
              {
                color: Colors.error,
              },
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            エラーが発生しました
          </Text>
          <Text
            style={[
              styles.errorText,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            {error}
          </Text>
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: Colors.mountainBlue,
              },
            ]}
            onPress={handleGoBack}
            testID="error-back-button"
            accessible={true}
            accessibilityLabel="前の画面に戻る"
            accessibilityRole="button"
            accessibilityHint="タップして前の画面に戻ります"
          >
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
        },
      ]}
      accessibilityLabel="クエスト詳細画面"
    >
      <ScrollView
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
          },
        ]}
        contentContainerStyle={styles.contentContainer}
        testID="quest-detail-scroll"
        accessible={true}
        accessibilityLabel={`クエスト詳細: ${quest.title}`}
        accessibilityHint="スクロールしてクエスト情報とアクションボタンを表示できます"
      >
        {/* ヘッダー: 戻るボタンとタイトル */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={styles.backButtonCompact}
            testID="quest-detail-back-button"
            accessible={true}
            accessibilityLabel="前の画面に戻る"
            accessibilityRole="button"
            accessibilityHint="タップして前の画面に戻ります"
          >
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
        </View>

        {/* クエスト情報カード */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.elevation.level1,
            },
          ]}
        >
          {/* タイトルとバッジ */}
          <View style={styles.titleSection}>
            <Text
              style={[
                styles.title,
                {
                  color: theme.text,
                },
              ]}
              testID="quest-detail-title"
              accessible={true}
              accessibilityLabel={`クエストタイトル: ${quest.title}`}
              accessibilityRole="header"
            >
              {quest.title}
            </Text>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: getTypeColor,
                },
              ]}
              accessible={true}
              accessibilityLabel={`クエストタイプ: ${getTypeLabel}`}
            >
              <Text
                style={styles.typeBadgeLabel}
                testID="quest-detail-type"
              >
                {getTypeLabel}
              </Text>
            </View>
          </View>

          {/* 説明文 */}
          <Text
            style={[
              styles.description,
              {
                color: theme.textSecondary,
              },
            ]}
            testID="quest-detail-description"
            accessible={true}
            accessibilityLabel={`説明: ${quest.description}`}
          >
            {quest.description}
          </Text>

          {/* メタ情報: 推定時間、難易度、エビデンス */}
          <View style={styles.metaSection}>
            <View style={styles.metaItem}>
              <Text
                style={[
                  styles.metaLabel,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                推定時間
              </Text>
              <Text
                style={[
                  styles.metaValue,
                  {
                    color: theme.text,
                  },
                ]}
                testID="quest-detail-time"
              >
                {quest.estimatedTime}分
              </Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <Text
                style={[
                  styles.metaLabel,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                難易度
              </Text>
              <View style={styles.difficultyValue}>
                <View
                  style={[
                    styles.difficultyDot,
                    {
                      backgroundColor: getDifficultyColor,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.metaValue,
                    {
                      color: theme.text,
                    },
                  ]}
                  testID="quest-detail-difficulty"
                >
                  {getDifficultyLabel}
                </Text>
              </View>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <Text
                style={[
                  styles.metaLabel,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                エビデンス
              </Text>
              <Text
                style={[
                  styles.metaValue,
                  {
                    color: theme.text,
                  },
                ]}
                testID="quest-detail-evidence"
              >
                {getEvidenceTypeLabel}
              </Text>
            </View>
          </View>

          {/* 完了基準 */}
          <View
            style={[
              styles.criteriaSection,
              {
                borderTopColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.criteriaTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              完了基準
            </Text>
            <Text
              style={[
                styles.criteriaText,
                {
                  color: theme.textSecondary,
                },
              ]}
              testID="quest-detail-criteria"
            >
              {quest.completionCriteria}
            </Text>
          </View>
        </View>

        {/* アクションボタン */}
        <View style={styles.actionSection}>
          {/* 完了ボタン */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.completeButton,
              {
                backgroundColor: Colors.success,
              },
            ]}
            onPress={handleComplete}
            activeOpacity={0.8}
            testID="quest-detail-complete-button"
            accessible
            accessibilityLabel="クエストを完了する"
            accessibilityRole="button"
            accessibilityHint="タップしてクエスト完了画面に進み、証跡を提出します"
          >
            <Text style={styles.actionButtonText}>✅ クエストを完了</Text>
          </TouchableOpacity>

          {/* 見送りボタン */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.skipButton,
              {
                backgroundColor: Colors.warning,
              },
            ]}
            onPress={handleSkip}
            activeOpacity={0.8}
            testID="quest-detail-skip-button"
            accessible
            accessibilityLabel="クエストを見送る"
            accessibilityRole="button"
            accessibilityHint="タップしてクエストを見送り、理由を選択します"
          >
            <Text style={styles.actionButtonText}>⏭️ クエストを見送り</Text>
          </TouchableOpacity>

          {/* 阻害ボタン */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.obstructionButton,
              {
                backgroundColor: Colors.error,
              },
            ]}
            onPress={handleObstruction}
            activeOpacity={0.8}
            testID="quest-detail-obstruction-button"
            accessible
            accessibilityLabel="クエストが阻害された"
            accessibilityRole="button"
            accessibilityHint="タップしてクエストが阻害された理由を入力します"
          >
            <Text style={styles.actionButtonText}>🚧 クエストが阻害された</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 16,
  },
  backButtonCompact: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: Colors.gray[200],
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    lineHeight: 28,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  typeBadgeLabel: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  metaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: Colors.gray[200],
    borderBottomColor: Colors.gray[200],
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  metaDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.gray[300],
    marginHorizontal: 8,
  },
  difficultyValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  difficultyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  criteriaSection: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  criteriaTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  criteriaText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionSection: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButton: {},
  skipButton: {},
  obstructionButton: {},
  actionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuestDetailScreen;

/**
 * Goal Detail Screen
 * 目標の詳細表示と編集機能
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { GoalDetails, GoalStatus } from '../types';
import GoalService from '../services/GoalService';
import { MCPClient } from '@/core/network/mcp';
import { NetworkErrorHandler, RetryStrategy } from '@/core/network/utils';

interface GoalDetailScreenProps {
  goalId: string;
  onGoalUpdated?: (goal: GoalDetails) => void;
  onGoalDeleted?: () => void;
  onNavigateEdit?: (goalId: string) => void;
  onBack?: () => void;
}

const GoalDetailScreen: React.FC<GoalDetailScreenProps> = ({
  goalId,
  onGoalUpdated,
  onGoalDeleted,
  onNavigateEdit,
  onBack,
}) => {
  const [goal, setGoal] = useState<GoalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);

  const mcpClient = new MCPClient({
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com/mcp',
    timeout: 30000,
    retryAttempts: 3,
  });

  const errorHandler = new NetworkErrorHandler({
    maxRetries: 3,
    initialRetryDelay: 100,
    maxRetryDelay: 1000,
    backoffMultiplier: 2,
  });

  const retryStrategy = new RetryStrategy({
    maxAttempts: 3,
    initialDelay: 50,
    maxDelay: 500,
  });

  const goalService = new GoalService(mcpClient, errorHandler, retryStrategy);

  useEffect(() => {
    loadGoal();
  }, [goalId]);

  const loadGoal = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedGoal = await goalService.getGoal(goalId);
      setGoal(loadedGoal);
    } catch (err: any) {
      setError(err.message || 'Failed to load goal');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoal = () => {
    if (!goal) return;

    Alert.alert(
      '目標を完了しますか？',
      `「${goal.title}」を完了としてマークします。`,
      [
        {
          text: 'キャンセル',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: '完了',
          onPress: async () => {
            try {
              setLoading(true);
              const updatedGoal = await goalService.completeGoal(goalId);
              setGoal(updatedGoal);
              onGoalUpdated?.(updatedGoal);
              Alert.alert('成功', '目標が完了しました！');
            } catch (err: any) {
              Alert.alert('エラー', err.message || '目標の完了に失敗しました');
            } finally {
              setLoading(false);
            }
          },
          style: 'default',
        },
      ]
    );
  };

  const handlePauseGoal = async () => {
    if (!goal) return;

    try {
      setLoading(true);
      const updatedGoal = await goalService.pauseGoal(goalId);
      setGoal(updatedGoal);
      onGoalUpdated?.(updatedGoal);
    } catch (err: any) {
      Alert.alert('エラー', err.message || '目標の一時停止に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeGoal = async () => {
    if (!goal) return;

    try {
      setLoading(true);
      const updatedGoal = await goalService.resumeGoal(goalId);
      setGoal(updatedGoal);
      onGoalUpdated?.(updatedGoal);
    } catch (err: any) {
      Alert.alert('エラー', err.message || '目標の再開に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = () => {
    if (!goal) return;

    Alert.alert(
      '目標を削除しますか？',
      `「${goal.title}」を削除します。この操作は取り消せません。`,
      [
        {
          text: 'キャンセル',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: '削除',
          onPress: async () => {
            try {
              setLoading(true);
              await goalService.deleteGoal(goalId);
              onGoalDeleted?.();
            } catch (err: any) {
              Alert.alert('エラー', err.message || '目標の削除に失敗しました');
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const getStatusBadgeColor = (status: GoalStatus) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      case 'paused':
        return '#FF9800';
      case 'archived':
        return '#999999';
      default:
        return '#666666';
    }
  };

  const getStatusLabel = (status: GoalStatus) => {
    const labels: Record<GoalStatus, string> = {
      active: '進行中',
      completed: '完了',
      paused: '一時停止',
      archived: 'アーカイブ',
    };
    return labels[status];
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
    };
    return labels[priority] || priority;
  };

  if (loading && !goal) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3C507D" />
        <Text style={styles.loadingText}>目標を読み込み中...</Text>
      </View>
    );
  }

  if (error && !goal) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadGoal}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>目標が見つかりません</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{goal.title}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusBadgeColor(goal.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusLabel(goal.status)}
              </Text>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 詳細</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>KPI</Text>
            <Text style={styles.value}>{goal.kpi}</Text>
          </View>

          {goal.description && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>説明</Text>
              <Text style={styles.value}>{goal.description}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.label}>優先度</Text>
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>
                {getPriorityLabel(goal.priority)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>期間</Text>
            <Text style={styles.value}>{goal.duration}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>期限</Text>
            <Text style={styles.value}>
              {new Date(goal.deadline).toLocaleDateString('ja-JP')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 タイムライン</Text>

          <View style={styles.timelineRow}>
            <Text style={styles.timelineLabel}>作成日</Text>
            <Text style={styles.timelineValue}>
              {new Date(goal.createdAt).toLocaleDateString('ja-JP')}
            </Text>
          </View>

          <View style={styles.timelineRow}>
            <Text style={styles.timelineLabel}>最終更新</Text>
            <Text style={styles.timelineValue}>
              {new Date(goal.updatedAt).toLocaleDateString('ja-JP')}
            </Text>
          </View>

          {goal.completedAt && (
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>完了日</Text>
              <Text style={styles.timelineValue}>
                {new Date(goal.completedAt).toLocaleDateString('ja-JP')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>⚙️ アクション</Text>

          {goal.status === 'active' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onNavigateEdit?.(goalId)}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>✏️ 編集</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePauseGoal}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>⏸️ 一時停止</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCompleteGoal}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>✅ 完了</Text>
              </TouchableOpacity>
            </>
          )}

          {goal.status === 'paused' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleResumeGoal}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>▶️ 再開</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onNavigateEdit?.(goalId)}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>✏️ 編集</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteGoal}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>🗑️ 削除</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>戻る</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    marginBottom: 24,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#112250',
    flex: 1,
    lineHeight: 30,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 70,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#D32F2F',
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
  },
  errorBannerText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#112250',
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    lineHeight: 20,
  },
  priorityBadge: {
    backgroundColor: '#E8F4F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3C507D',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  timelineValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  actionsSection: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#3C507D',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    marginTop: 4,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFF',
  },
  backButton: {
    paddingVertical: 12,
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
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#3C507D',
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default GoalDetailScreen;

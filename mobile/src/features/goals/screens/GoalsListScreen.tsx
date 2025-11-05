/**
 * Goals List Screen
 * 目標一覧表示画面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { GoalListItem, GoalStatus, GoalStatistics } from '../types';
import GoalService from '../services/GoalService';
import { MCPClient } from '@/core/network/mcp';
import { NetworkErrorHandler, RetryStrategy } from '@/core/network/utils';

interface GoalsListScreenProps {
  onGoalSelected?: (goalId: string) => void;
  onCreateNewGoal?: () => void;
  onBack?: () => void;
}

const GOAL_STATUSES: { status: GoalStatus; label: string }[] = [
  { status: 'active', label: '進行中' },
  { status: 'paused', label: '一時停止' },
  { status: 'completed', label: '完了' },
  { status: 'archived', label: 'アーカイブ' },
];

const GoalsListScreen: React.FC<GoalsListScreenProps> = ({
  onGoalSelected,
  onCreateNewGoal,
  onBack,
}) => {
  const [goals, setGoals] = useState<GoalListItem[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<GoalListItem[]>([]);
  const [stats, setStats] = useState<GoalStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<GoalStatus>('active');

  const mcpClient = new MCPClient({
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com/mcp',
    timeout: 30000,
    retryAttempts: 3,
  });

  const errorHandler = new NetworkErrorHandler({
    maxRetries: 3,
    initialRetryDelay: 100,
    maxRetryDelay: 1000,
  });

  const retryStrategy = new RetryStrategy({
    maxAttempts: 3,
    initialDelay: 50,
    maxDelay: 500,
  });

  const goalService = new GoalService(mcpClient, errorHandler, retryStrategy);

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    filterGoals(selectedFilter);
  }, [goals]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      const [loadedGoals, statistics] = await Promise.all([
        goalService.listGoals(),
        goalService.getGoalStatistics(),
      ]);

      setGoals(loadedGoals);
      setStats(statistics);
      filterGoals(selectedFilter);
    } catch (err: any) {
      setError(err.message || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      goalService.clearCache();
      await loadGoals();
    } catch (err: any) {
      setError(err.message || 'Failed to refresh goals');
    } finally {
      setRefreshing(false);
    }
  };

  const filterGoals = (status: GoalStatus) => {
    setSelectedFilter(status);
    const filtered = goals.filter((goal) => goal.status === status);
    setFilteredGoals(filtered);
  };

  const getStatusColor = (status: GoalStatus) => {
    const colors: Record<GoalStatus, string> = {
      active: '#4CAF50',
      completed: '#2196F3',
      paused: '#FF9800',
      archived: '#999999',
    };
    return colors[status];
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

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: '#F44336',
      medium: '#FF9800',
      low: '#4CAF50',
    };
    return colors[priority] || '#999999';
  };

  const renderGoalItem = ({ item }: { item: GoalListItem }) => (
    <TouchableOpacity
      style={styles.goalCard}
      onPress={() => onGoalSelected?.(item.id)}
    >
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View
          style={[
            styles.priorityIndicator,
            { backgroundColor: getPriorityColor(item.priority) },
          ]}
        />
      </View>

      <View style={styles.goalMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>期限</Text>
          <Text style={styles.metaValue}>
            {new Date(item.deadline).toLocaleDateString('ja-JP', {
              month: '2-digit',
              day: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>進捗</Text>
          <Text style={styles.metaValue}>{item.progress}%</Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>状態</Text>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusLabel}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${item.progress}%` }]}
        />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🎯</Text>
      <Text style={styles.emptyTitle}>目標がありません</Text>
      <Text style={styles.emptySubtitle}>
        新しい目標を作成して、山登りを始めましょう
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={onCreateNewGoal}
      >
        <Text style={styles.createButtonText}>+新しい目標を作成</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && goals.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3C507D" />
        <Text style={styles.loadingText}>目標を読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3C507D']}
          />
        }
      >
        {/* Statistics */}
        {stats && (
          <View style={styles.statisticsSection}>
            <Text style={styles.sectionTitle}>📊 統計情報</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalGoals}</Text>
                <Text style={styles.statLabel}>全目標</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.activeGoals}</Text>
                <Text style={styles.statLabel}>進行中</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.completedGoals}</Text>
                <Text style={styles.statLabel}>完了</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.completionRate}%</Text>
                <Text style={styles.statLabel}>完了率</Text>
              </View>
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>フィルター</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterList}
          >
            {GOAL_STATUSES.map((item) => (
              <TouchableOpacity
                key={item.status}
                style={[
                  styles.filterButton,
                  selectedFilter === item.status &&
                    styles.filterButtonActive,
                ]}
                onPress={() => filterGoals(item.status)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === item.status &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Goals List or Empty State */}
        {filteredGoals.length > 0 ? (
          <View style={styles.goalsSection}>
            <Text style={styles.sectionTitle}>
              {getStatusLabel(selectedFilter)}
              <Text style={styles.goalCount}> ({filteredGoals.length})</Text>
            </Text>
            <FlatList
              scrollEnabled={false}
              data={filteredGoals}
              renderItem={renderGoalItem}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => (
                <View style={{ height: 8 }} />
              )}
            />
          </View>
        ) : (
          <View style={styles.noResultsState}>
            <Text style={styles.noResultsIcon}>📭</Text>
            <Text style={styles.noResultsTitle}>
              {getStatusLabel(selectedFilter)}の目標はありません
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={onCreateNewGoal}
            >
              <Text style={styles.createButtonText}>+新しい目標を作成</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.createMainButton}
          onPress={onCreateNewGoal}
        >
          <Text style={styles.createMainButtonText}>+ 新しい目標を作成</Text>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statisticsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#112250',
    marginBottom: 12,
  },
  goalCount: {
    fontSize: 14,
    fontWeight: '400',
    color: '#999',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: -4,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3C507D',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#D32F2F',
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterList: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3C507D',
    borderColor: '#3C507D',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  goalsSection: {
    marginBottom: 20,
  },
  goalCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 6,
  },
  goalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#EEEEEE',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3C507D',
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#112250',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  noResultsState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3C507D',
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C507D',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFF',
  },
  createMainButton: {
    backgroundColor: '#3C507D',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createMainButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
});

export default GoalsListScreen;

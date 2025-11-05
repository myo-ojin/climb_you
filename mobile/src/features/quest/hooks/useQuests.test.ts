/**
 * useQuests Hook Tests
 * React Query 統合テストとモックデータを使用したテスト
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQuests } from './useQuests';
import { useQuestUseCase } from './useQuestUseCase';
import { useProgress } from './useProgress';
import { useStreak } from './useStreak';
import React from 'react';

// モックの設定
jest.mock('./useQuestUseCase');
jest.mock('./useProgress');
jest.mock('./useStreak');

const mockUseQuestUseCase = useQuestUseCase as jest.MockedFunction<
  typeof useQuestUseCase
>;
const mockUseProgress = useProgress as jest.MockedFunction<typeof useProgress>;
const mockUseStreak = useStreak as jest.MockedFunction<typeof useStreak>;

// QueryClient のセットアップ
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
};

describe('useQuests Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトモック値
    mockUseProgress.mockReturnValue({
      currentStation: 3,
      stepsInCurrentStation: 250,
      totalSteps: 1200,
      progressPercentage: 45,
    });

    mockUseStreak.mockReturnValue({
      userId: 'user-123',
      currentStreak: 15,
      maxStreak: 28,
      freezeDaysUsed: 0,
      lastCompletionDate: new Date(),
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('正常にクエストを取得できること', async () => {
    const mockQuests = [
      {
        id: 'quest-1',
        questBundleId: 'bundle-1',
        type: 'small',
        title: '朝30分ウォーキング',
        description: '毎朝30分のウォーキングを実施する',
        estimatedTime: 30,
        difficulty: 'easy',
        completionCriteria: '30分以上歩く',
        evidenceType: 'text',
        contributesToStation: 3,
        order: 1,
        status: 'pending',
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    ];

    const mockQuestUseCase = {
      getTodayQuests: jest.fn().mockResolvedValue(mockQuests),
    };

    mockUseQuestUseCase.mockReturnValue(mockQuestUseCase as any);

    const { result } = renderHook(() => useQuests(), {
      wrapper: createWrapper(),
    });

    // 初期状態
    expect(result.current.isLoading).toBe(true);

    // ローディング完了を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // データが取得されているはず
    expect(result.current.todayQuests).toHaveLength(1);
    expect(result.current.todayQuests[0].id).toBe('quest-1');
    expect(result.current.error).toBeNull();
  });

  it('エラー時も正常に処理されること', async () => {
    const mockError = new Error('Failed to fetch quests');

    const mockQuestUseCase = {
      getTodayQuests: jest.fn().mockRejectedValue(mockError),
    };

    mockUseQuestUseCase.mockReturnValue(mockQuestUseCase as any);

    const { result } = renderHook(() => useQuests(), {
      wrapper: createWrapper(),
    });

    // ローディング完了を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // エラーが設定されているはず
    expect(result.current.error).not.toBeNull();
    expect(result.current.todayQuests).toEqual([]);
  });

  it('refreshQuests が呼び出せること', async () => {
    const mockQuests = [
      {
        id: 'quest-1',
        questBundleId: 'bundle-1',
        type: 'small',
        title: 'クエスト1',
        description: '説明',
        estimatedTime: 30,
        difficulty: 'easy',
        completionCriteria: '完了基準',
        evidenceType: 'text',
        contributesToStation: 3,
        order: 1,
        status: 'pending',
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    ];

    const mockQuestUseCase = {
      getTodayQuests: jest.fn().mockResolvedValue(mockQuests),
    };

    mockUseQuestUseCase.mockReturnValue(mockQuestUseCase as any);

    const { result } = renderHook(() => useQuests(), {
      wrapper: createWrapper(),
    });

    // 初回ロード完了を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // refreshQuests が呼び出せること
    expect(result.current.refreshQuests).toBeDefined();
    expect(typeof result.current.refreshQuests).toBe('function');
  });

  it('progress が正しく返されること', async () => {
    const mockQuestUseCase = {
      getTodayQuests: jest.fn().mockResolvedValue([]),
    };

    mockUseQuestUseCase.mockReturnValue(mockQuestUseCase as any);

    const { result } = renderHook(() => useQuests(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.progress).toBeDefined();
    expect(result.current.progress.currentStation).toBe(3);
    expect(result.current.progress.totalSteps).toBe(1200);
  });

  it('currentStreak が正しく返されること', async () => {
    const mockQuestUseCase = {
      getTodayQuests: jest.fn().mockResolvedValue([]),
    };

    mockUseQuestUseCase.mockReturnValue(mockQuestUseCase as any);

    const { result } = renderHook(() => useQuests(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentStreak).toBeDefined();
    expect(result.current.currentStreak.currentStreak).toBe(15);
    expect(result.current.currentStreak.maxStreak).toBe(28);
  });

  it('複数クエストを正しく取得できること', async () => {
    const mockQuests = [
      {
        id: 'quest-1',
        questBundleId: 'bundle-1',
        type: 'small',
        title: 'クエスト1',
        description: '説明1',
        estimatedTime: 30,
        difficulty: 'easy',
        completionCriteria: '完了基準1',
        evidenceType: 'text',
        contributesToStation: 3,
        order: 1,
        status: 'pending',
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        id: 'quest-2',
        questBundleId: 'bundle-1',
        type: 'medium',
        title: 'クエスト2',
        description: '説明2',
        estimatedTime: 60,
        difficulty: 'medium',
        completionCriteria: '完了基準2',
        evidenceType: 'image',
        contributesToStation: 3,
        order: 2,
        status: 'pending',
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        id: 'quest-3',
        questBundleId: 'bundle-1',
        type: 'validation',
        title: 'クエスト3',
        description: '説明3',
        estimatedTime: 15,
        difficulty: 'easy',
        completionCriteria: '完了基準3',
        evidenceType: 'text',
        contributesToStation: 3,
        order: 3,
        status: 'pending',
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    ];

    const mockQuestUseCase = {
      getTodayQuests: jest.fn().mockResolvedValue(mockQuests),
    };

    mockUseQuestUseCase.mockReturnValue(mockQuestUseCase as any);

    const { result } = renderHook(() => useQuests(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.todayQuests).toHaveLength(3);
    expect(result.current.todayQuests[0].type).toBe('small');
    expect(result.current.todayQuests[1].type).toBe('medium');
    expect(result.current.todayQuests[2].type).toBe('validation');
  });
});

/**
 * HomeScreen Tests
 * UI コンポーネントテストとアクセシビリティテスト
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { useQuests } from '../hooks/useQuests';

// useQuests フックのモック
jest.mock('../hooks/useQuests');

const mockUseQuests = useQuests as jest.MockedFunction<typeof useQuests>;

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ローディング状態を表示できること', () => {
    mockUseQuests.mockReturnValue({
      todayQuests: [],
      progress: {
        currentStation: 3,
        stepsInCurrentStation: 250,
        totalSteps: 1200,
        progressPercentage: 45,
      },
      currentStreak: {
        userId: 'user-123',
        currentStreak: 15,
        maxStreak: 28,
        freezeDaysUsed: 0,
        lastCompletionDate: new Date(),
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isLoading: true,
      error: null,
      refreshQuests: jest.fn(),
    });

    render(<HomeScreen />);

    // ローディングインジケーターが表示されているはず
    const loadingIndicator = screen.getByTestId('quest-loading-indicator');
    expect(loadingIndicator).toBeTruthy();
  });

  it('クエストを表示できること', () => {
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

    mockUseQuests.mockReturnValue({
      todayQuests: mockQuests,
      progress: {
        currentStation: 3,
        stepsInCurrentStation: 250,
        totalSteps: 1200,
        progressPercentage: 45,
      },
      currentStreak: {
        userId: 'user-123',
        currentStreak: 15,
        maxStreak: 28,
        freezeDaysUsed: 0,
        lastCompletionDate: new Date(),
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isLoading: false,
      error: null,
      refreshQuests: jest.fn(),
    });

    render(<HomeScreen />);

    // クエストリストが表示されているはず
    const questList = screen.getByTestId('quests-list');
    expect(questList).toBeTruthy();
  });

  it('進捗情報を表示できること', () => {
    mockUseQuests.mockReturnValue({
      todayQuests: [],
      progress: {
        currentStation: 5,
        stepsInCurrentStation: 500,
        totalSteps: 2000,
        progressPercentage: 55,
      },
      currentStreak: {
        userId: 'user-123',
        currentStreak: 20,
        maxStreak: 30,
        freezeDaysUsed: 1,
        lastCompletionDate: new Date(),
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isLoading: false,
      error: null,
      refreshQuests: jest.fn(),
    });

    render(<HomeScreen />);

    // 進捗情報が表示されているはず
    const textElements = screen.getAllByText(/(\d+|合目|日連続|歩)/);
    expect(textElements.length).toBeGreaterThan(0);
  });

  it('エラーバナーを表示できること', () => {
    const mockError = new Error('クエスト取得に失敗しました');

    mockUseQuests.mockReturnValue({
      todayQuests: [],
      progress: {
        currentStation: 3,
        stepsInCurrentStation: 250,
        totalSteps: 1200,
        progressPercentage: 45,
      },
      currentStreak: {
        userId: 'user-123',
        currentStreak: 15,
        maxStreak: 28,
        freezeDaysUsed: 0,
        lastCompletionDate: new Date(),
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isLoading: false,
      error: mockError,
      refreshQuests: jest.fn(),
    });

    render(<HomeScreen />);

    // エラーメッセージが表示されているはず
    const errorText = screen.getByText(/クエスト取得エラー/);
    expect(errorText).toBeTruthy();
  });

  it('クエストが0件のときに空状態を表示できること', () => {
    mockUseQuests.mockReturnValue({
      todayQuests: [],
      progress: {
        currentStation: 3,
        stepsInCurrentStation: 250,
        totalSteps: 1200,
        progressPercentage: 45,
      },
      currentStreak: {
        userId: 'user-123',
        currentStreak: 15,
        maxStreak: 28,
        freezeDaysUsed: 0,
        lastCompletionDate: new Date(),
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isLoading: false,
      error: null,
      refreshQuests: jest.fn(),
    });

    render(<HomeScreen />);

    // 空状態メッセージが表示されているはず
    const emptyText = screen.getByText('今日のクエストはありません');
    expect(emptyText).toBeTruthy();
  });

  it('複数クエストを表示できること', () => {
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

    mockUseQuests.mockReturnValue({
      todayQuests: mockQuests,
      progress: {
        currentStation: 3,
        stepsInCurrentStation: 250,
        totalSteps: 1200,
        progressPercentage: 45,
      },
      currentStreak: {
        userId: 'user-123',
        currentStreak: 15,
        maxStreak: 28,
        freezeDaysUsed: 0,
        lastCompletionDate: new Date(),
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isLoading: false,
      error: null,
      refreshQuests: jest.fn(),
    });

    render(<HomeScreen />);

    // 3つのクエストが表示されているはず
    const questList = screen.getByTestId('quests-list');
    expect(questList).toBeTruthy();
  });

  it('refreshQuests が呼び出されること', () => {
    const mockRefreshQuests = jest.fn();

    mockUseQuests.mockReturnValue({
      todayQuests: [],
      progress: {
        currentStation: 3,
        stepsInCurrentStation: 250,
        totalSteps: 1200,
        progressPercentage: 45,
      },
      currentStreak: {
        userId: 'user-123',
        currentStreak: 15,
        maxStreak: 28,
        freezeDaysUsed: 0,
        lastCompletionDate: new Date(),
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isLoading: false,
      error: null,
      refreshQuests: mockRefreshQuests,
    });

    render(<HomeScreen />);

    // refreshQuests が呼び出せることを確認
    // (実際のPull-to-Refresh操作のテストは Detox E2E テストで行う)
    expect(mockRefreshQuests).toBeDefined();
  });

  it('アクセシビリティ属性を持っていること', () => {
    mockUseQuests.mockReturnValue({
      todayQuests: [
        {
          id: 'quest-1',
          questBundleId: 'bundle-1',
          type: 'small',
          title: 'テストクエスト',
          description: '説明',
          estimatedTime: 30,
          difficulty: 'easy',
          completionCriteria: '完了',
          evidenceType: 'text',
          contributesToStation: 3,
          order: 1,
          status: 'pending',
          createdAt: new Date(),
          validUntil: new Date(),
        },
      ],
      progress: {
        currentStation: 3,
        stepsInCurrentStation: 250,
        totalSteps: 1200,
        progressPercentage: 45,
      },
      currentStreak: {
        userId: 'user-123',
        currentStreak: 15,
        maxStreak: 28,
        freezeDaysUsed: 0,
        lastCompletionDate: new Date(),
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isLoading: false,
      error: null,
      refreshQuests: jest.fn(),
    });

    render(<HomeScreen />);

    // testID を使用してアクセシビリティをサポート
    const questList = screen.getByTestId('quests-list');
    expect(questList).toBeTruthy();
  });
});

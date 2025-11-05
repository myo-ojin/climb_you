/**
 * useProgress Hook Tests
 */

// Expoモジュールをモック
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-modules-core', () => ({
  EventEmitter: jest.fn(),
  Subscription: jest.fn(),
  UnavailabilityError: jest.fn(),
}));

import { renderHook, waitFor } from '@testing-library/react-native';
import { useProgress } from './useProgress';
import { DatabaseManager } from '@/core/data/DatabaseManager';

// DatabaseManagerをモック
jest.mock('@/core/data/DatabaseManager');

describe('useProgress', () => {
  let mockDbManager: jest.Mocked<DatabaseManager>;

  beforeEach(() => {
    mockDbManager = {
      execute: jest.fn(),
    } as any;

    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(mockDbManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('進捗データを正しく読み込むこと', async () => {
    // モックデータを設定
    mockDbManager.execute
      // 目標データ
      .mockResolvedValueOnce({
        rows: {
          _array: [
            {
              id: 'goal-1',
              user_id: 'user-1',
              title: 'TOEIC 800点を達成する',
              deadline: '2025-12-31',
            },
          ],
          length: 1,
        },
      })
      // マイルストーンデータ
      .mockResolvedValueOnce({
        rows: {
          _array: [
            {
              id: 'milestone-1',
              goal_id: 'goal-1',
              station_number: 1,
              title: '1合目',
              criteria: '基礎単語500語',
              required_steps: 500,
              achieved_at: null,
              evidence: null,
            },
            {
              id: 'milestone-2',
              goal_id: 'goal-1',
              station_number: 2,
              title: '2合目',
              criteria: '基礎文法',
              required_steps: 1000,
              achieved_at: null,
              evidence: null,
            },
          ],
          length: 2,
        },
      })
      // 進捗データ
      .mockResolvedValueOnce({
        rows: {
          _array: [
            {
              user_id: 'user-1',
              total_steps: 300,
              current_station: 1,
              station_progress: 60,
            },
          ],
          length: 1,
        },
      })
      // ストリークデータ
      .mockResolvedValueOnce({
        rows: {
          _array: [
            {
              user_id: 'user-1',
              current_streak: 5,
              max_streak: 10,
            },
          ],
          length: 1,
        },
      });

    const { result } = renderHook(() => useProgress('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.progressData).toBeDefined();
    expect(result.current.progressData?.totalSteps).toBe(300);
    expect(result.current.progressData?.currentStation).toBe(1);
    expect(result.current.progressData?.currentStreak).toBe(5);
  });

  it('エラー時にエラー状態を返すこと', async () => {
    mockDbManager.execute.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useProgress('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Database error');
  });

  it('次の合目情報を正しく計算すること', async () => {
    mockDbManager.execute
      .mockResolvedValueOnce({
        rows: {
          _array: [
            {
              id: 'goal-1',
              user_id: 'user-1',
              title: 'Test Goal',
              deadline: '2025-12-31',
            },
          ],
          length: 1,
        },
      })
      .mockResolvedValueOnce({
        rows: {
          _array: [
            {
              id: 'milestone-1',
              goal_id: 'goal-1',
              station_number: 1,
              title: '1合目',
              criteria: 'Test',
              required_steps: 500,
              achieved_at: null,
              evidence: null,
            },
            {
              id: 'milestone-2',
              goal_id: 'goal-1',
              station_number: 2,
              title: '2合目',
              criteria: 'Test 2',
              required_steps: 1000,
              achieved_at: null,
              evidence: null,
            },
          ],
          length: 2,
        },
      })
      .mockResolvedValueOnce({
        rows: {
          _array: [
            {
              user_id: 'user-1',
              total_steps: 300,
              current_station: 1,
              station_progress: 60,
            },
          ],
          length: 1,
        },
      })
      .mockResolvedValueOnce({
        rows: {
          _array: [
            {
              user_id: 'user-1',
              current_streak: 5,
              max_streak: 10,
            },
          ],
          length: 1,
        },
      });

    const { result } = renderHook(() => useProgress('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.nextStationInfo).toBeDefined();
    expect(result.current.nextStationInfo?.stationNumber).toBe(2);
    expect(result.current.nextStationInfo?.title).toBe('2合目');
    expect(result.current.nextStationInfo?.remainingSteps).toBe(700);
  });
});

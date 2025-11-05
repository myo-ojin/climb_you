/**
 * Quest Slice
 * クエスト状態のグローバル管理（Redux Toolkit）
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Quest, QuestBundle, QuestLog, ClimbingProgress, Streak } from '@/core/domain/entities';
import { MCPClient } from '@/core/network/mcp';

/**
 * クエスト状態の型定義
 */
export interface QuestState {
  // 今日のクエストバンドル
  todayQuests: Quest[];
  questBundleId: string | null;
  questBundleGeneratedAt: Date | null;
  questBundleValidUntil: Date | null;

  // 進捗情報
  progress: ClimbingProgress | null;
  streak: Streak | null;

  // UI状態
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // キャッシュ
  lastFetchedAt: Date | null;
}

/**
 * 初期状態
 */
const initialState: QuestState = {
  todayQuests: [],
  questBundleId: null,
  questBundleGeneratedAt: null,
  questBundleValidUntil: null,

  progress: null,
  streak: null,

  isLoading: false,
  isRefreshing: false,
  error: null,

  lastFetchedAt: null,
};

/**
 * 非同期アクション: 今日のクエストを取得
 */
export const fetchTodayQuests = createAsyncThunk(
  'quest/fetchTodayQuests',
  async ({ userId, refresh = false }: { userId: string; refresh?: boolean }, { rejectWithValue }) => {
    try {
      // MCPClientを使用してクエストバンドルを取得
      // 実装は後で完成させる（MCPClientインスタンスが必要）

      // 仮のデータを返す
      return {
        quests: [] as Quest[],
        bundleId: `bundle_${Date.now()}`,
        generatedAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
        progress: null,
        streak: null,
      };
    } catch (error) {
      console.error('Failed to fetch quests:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch quests');
    }
  }
);

/**
 * 非同期アクション: クエストを完了
 */
export const completeQuest = createAsyncThunk(
  'quest/completeQuest',
  async (
    {
      userId,
      questId,
      actualMinutes,
      evidence,
    }: {
      userId: string;
      questId: string;
      actualMinutes?: number;
      evidence?: { type: 'text' | 'image'; content: string };
    },
    { rejectWithValue }
  ) => {
    try {
      // MCPClientを使用してクエスト完了を記録
      // 実装は後で完成させる

      return {
        questId,
        status: 'completed' as const,
        steps: 0,
        progress: null,
        streak: null,
      };
    } catch (error) {
      console.error('Failed to complete quest:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to complete quest');
    }
  }
);

/**
 * 非同期アクション: クエストを見送り
 */
export const skipQuest = createAsyncThunk(
  'quest/skipQuest',
  async (
    { userId, questId, reason }: { userId: string; questId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      // MCPClientを使用してクエスト見送りを記録
      // 実装は後で完成させる

      return {
        questId,
        status: 'skipped' as const,
      };
    } catch (error) {
      console.error('Failed to skip quest:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to skip quest');
    }
  }
);

/**
 * 非同期アクション: クエストを阻害
 */
export const obstructQuest = createAsyncThunk(
  'quest/obstructQuest',
  async (
    { userId, questId, reason }: { userId: string; questId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      // MCPClientを使用してクエスト阻害を記録
      // 実装は後で完成させる

      return {
        questId,
        status: 'obstructed' as const,
      };
    } catch (error) {
      console.error('Failed to obstruct quest:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to obstruct quest');
    }
  }
);

/**
 * Quest Slice
 */
const questSlice = createSlice({
  name: 'quest',
  initialState,
  reducers: {
    /**
     * エラーをクリア
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * クエスト状態をリセット
     */
    resetQuests: (state) => {
      state.todayQuests = [];
      state.questBundleId = null;
      state.questBundleGeneratedAt = null;
      state.questBundleValidUntil = null;
      state.error = null;
    },

    /**
     * 進捗情報を更新（ローカル）
     */
    updateProgress: (state, action: PayloadAction<ClimbingProgress>) => {
      state.progress = action.payload;
    },

    /**
     * ストリーク情報を更新（ローカル）
     */
    updateStreak: (state, action: PayloadAction<Streak>) => {
      state.streak = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchTodayQuests
    builder
      .addCase(fetchTodayQuests.pending, (state, action) => {
        const refresh = action.meta.arg.refresh;
        if (refresh) {
          state.isRefreshing = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchTodayQuests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.todayQuests = action.payload.quests;
        state.questBundleId = action.payload.bundleId;
        state.questBundleGeneratedAt = action.payload.generatedAt;
        state.questBundleValidUntil = action.payload.validUntil;

        if (action.payload.progress) {
          state.progress = action.payload.progress;
        }
        if (action.payload.streak) {
          state.streak = action.payload.streak;
        }

        state.lastFetchedAt = new Date();
        state.error = null;
      })
      .addCase(fetchTodayQuests.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload as string;
      });

    // completeQuest
    builder
      .addCase(completeQuest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeQuest.fulfilled, (state, action) => {
        state.isLoading = false;

        // クエストのステータスを更新
        const quest = state.todayQuests.find((q) => q.id === action.payload.questId);
        if (quest) {
          quest.status = action.payload.status;
        }

        // 進捗情報を更新
        if (action.payload.progress) {
          state.progress = action.payload.progress;
        }
        if (action.payload.streak) {
          state.streak = action.payload.streak;
        }

        state.error = null;
      })
      .addCase(completeQuest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // skipQuest
    builder
      .addCase(skipQuest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(skipQuest.fulfilled, (state, action) => {
        state.isLoading = false;

        // クエストのステータスを更新
        const quest = state.todayQuests.find((q) => q.id === action.payload.questId);
        if (quest) {
          quest.status = action.payload.status;
        }

        state.error = null;
      })
      .addCase(skipQuest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // obstructQuest
    builder
      .addCase(obstructQuest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(obstructQuest.fulfilled, (state, action) => {
        state.isLoading = false;

        // クエストのステータスを更新
        const quest = state.todayQuests.find((q) => q.id === action.payload.questId);
        if (quest) {
          quest.status = action.payload.status;
        }

        state.error = null;
      })
      .addCase(obstructQuest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

/**
 * Actions
 */
export const { clearError, resetQuests, updateProgress, updateStreak } = questSlice.actions;

/**
 * Selectors
 */
export const selectQuests = (state: { quest: QuestState }) => state.quest.todayQuests;
export const selectQuestById = (state: { quest: QuestState }, questId: string) =>
  state.quest.todayQuests.find((q) => q.id === questId);
export const selectProgress = (state: { quest: QuestState }) => state.quest.progress;
export const selectStreak = (state: { quest: QuestState }) => state.quest.streak;
export const selectQuestLoading = (state: { quest: QuestState }) => state.quest.isLoading;
export const selectQuestRefreshing = (state: { quest: QuestState }) => state.quest.isRefreshing;
export const selectQuestError = (state: { quest: QuestState }) => state.quest.error;

/**
 * Reducer
 */
export default questSlice.reducer;

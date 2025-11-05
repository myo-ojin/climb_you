/**
 * Auth Slice
 * 認証状態のグローバル管理（Redux Toolkit）
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SecureTokenStore } from '@/services/auth';
import { User, AuthProvider } from '@/core/domain/entities';

/**
 * 認証状態の型定義
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  lastLoginAt: number | null;
}

/**
 * 初期状態
 */
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
  lastLoginAt: null,
};

/**
 * 非同期アクション: セッションを復元
 */
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const token = await SecureTokenStore.getToken();
      
      if (!token) {
        return null;
      }

      const isValid = await SecureTokenStore.isTokenValid();
      
      if (!isValid) {
        await SecureTokenStore.deleteToken();
        return null;
      }

      // ユーザー情報を取得（実装は後で）
      // const user = await fetchUserProfile();
      
      return {
        user: null, // 仮の実装
        lastLoginAt: Date.now(),
      };
    } catch (error) {
      console.error('Failed to restore session:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * 非同期アクション: ログイン
 */
export const login = createAsyncThunk(
  'auth/login',
  async (
    { user, provider }: { user: User; provider: AuthProvider },
    { rejectWithValue }
  ) => {
    try {
      console.log('Login successful:', user.email);
      
      return {
        user,
        provider,
        lastLoginAt: Date.now(),
      };
    } catch (error) {
      console.error('Login failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

/**
 * 非同期アクション: ログアウト
 */
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await SecureTokenStore.deleteToken();
      console.log('Logout successful');
      return null;
    } catch (error) {
      console.error('Logout failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Logout failed');
    }
  }
);

/**
 * Auth Slice
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * エラーをクリア
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * ユーザー情報を更新
     */
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
          updatedAt: new Date(),
        };
      }
    },

    /**
     * 認証状態をリセット
     */
    resetAuth: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      state.lastLoginAt = null;
    },
  },
  extraReducers: (builder) => {
    // restoreSession
    builder
      .addCase(restoreSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.lastLoginAt = action.payload.lastLoginAt;
        } else {
          state.isAuthenticated = false;
          state.user = null;
        }
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });

    // login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.lastLoginAt = action.payload.lastLoginAt;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });

    // logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.lastLoginAt = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

/**
 * Actions
 */
export const { clearError, updateUser, resetAuth } = authSlice.actions;

/**
 * Selectors
 */
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

/**
 * Reducer
 */
export default authSlice.reducer;

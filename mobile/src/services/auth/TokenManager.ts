/**
 * TokenManager
 * トークンのセキュアな管理
 * expo-secure-store を使用して、認証トークンをデバイスのセキュアストレージに保存
 */

import * as SecureStore from 'expo-secure-store';
import { AuthToken } from '@/core/domain/entities';

export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'auth:access_token';
  private static readonly REFRESH_TOKEN_KEY = 'auth:refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'auth:token_expiry';
  private static readonly TOKEN_TYPE_KEY = 'auth:token_type';

  /**
   * トークンペアを保存
   */
  static async saveTokens(authToken: AuthToken): Promise<void> {
    try {
      const now = Date.now();
      const expiresAt = now + authToken.expiresIn * 1000;

      await Promise.all([
        SecureStore.setItemAsync(
          this.ACCESS_TOKEN_KEY,
          authToken.accessToken
        ),
        authToken.refreshToken
          ? SecureStore.setItemAsync(
              this.REFRESH_TOKEN_KEY,
              authToken.refreshToken
            )
          : Promise.resolve(),
        SecureStore.setItemAsync(this.TOKEN_EXPIRY_KEY, expiresAt.toString()),
        SecureStore.setItemAsync(this.TOKEN_TYPE_KEY, authToken.tokenType),
      ]);

      console.log('Tokens saved successfully');
    } catch (error) {
      console.error('Failed to save tokens:', error);
      throw error;
    }
  }

  /**
   * アクセストークンを取得
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * リフレッシュトークンを取得
   */
  static async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * トークンの有効期限を確認
   */
  static async getTokenExpiry(): Promise<number | null> {
    try {
      const expiry = await SecureStore.getItemAsync(this.TOKEN_EXPIRY_KEY);
      return expiry ? parseInt(expiry, 10) : null;
    } catch (error) {
      console.error('Failed to get token expiry:', error);
      return null;
    }
  }

  /**
   * トークンが有効か確認
   */
  static async isTokenValid(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      if (!token) return false;

      const expiry = await this.getTokenExpiry();
      if (!expiry) return false;

      const now = Date.now();
      // 有効期限まで60秒以上残っているか確認
      return expiry - now > 60000;
    } catch (error) {
      console.error('Failed to check token validity:', error);
      return false;
    }
  }

  /**
   * トークンが有効期限切れに近いか確認（5分以内）
   */
  static async isTokenExpiringSoon(): Promise<boolean> {
    try {
      const expiry = await this.getTokenExpiry();
      if (!expiry) return true;

      const now = Date.now();
      const remainingTime = expiry - now;
      const fiveMinutesInMs = 5 * 60 * 1000;

      return remainingTime < fiveMinutesInMs;
    } catch (error) {
      console.error('Failed to check token expiry time:', error);
      return true;
    }
  }

  /**
   * トークンの残り有効期限を取得（秒）
   */
  static async getTokenRemainingTime(): Promise<number> {
    try {
      const expiry = await this.getTokenExpiry();
      if (!expiry) return 0;

      const now = Date.now();
      const remaining = Math.max(0, expiry - now);
      return Math.floor(remaining / 1000);
    } catch (error) {
      console.error('Failed to get remaining token time:', error);
      return 0;
    }
  }

  /**
   * すべてのトークンを削除
   */
  static async deleteTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(this.ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(this.TOKEN_EXPIRY_KEY),
        SecureStore.deleteItemAsync(this.TOKEN_TYPE_KEY),
      ]);

      console.log('Tokens deleted successfully');
    } catch (error) {
      console.error('Failed to delete tokens:', error);
      throw error;
    }
  }

  /**
   * トークンペアを取得
   */
  static async getTokenPair(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
  }> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.getAccessToken(),
        this.getRefreshToken(),
      ]);

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Failed to get token pair:', error);
      return { accessToken: null, refreshToken: null };
    }
  }

  /**
   * 認証情報をクリア（ログアウト時）
   */
  static async clearAuthData(): Promise<void> {
    try {
      await this.deleteTokens();
      console.log('Auth data cleared');
    } catch (error) {
      console.error('Failed to clear auth data:', error);
      throw error;
    }
  }
}

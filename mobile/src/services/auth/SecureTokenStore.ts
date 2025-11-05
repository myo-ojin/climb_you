/**
 * SecureTokenStore
 * セキュアストレージ上でのトークン管理
 * Secure Store を使用して、トークンのセキュアな保存と検索を実現
 *
 * 機能:
 * - トークンの暗号化保存
 * - トークンローテーション
 * - 有効期限管理
 * - セキュアな削除
 */

import * as SecureStore from 'expo-secure-store';
import { AuthToken } from '@/core/domain/entities';

export interface SecureToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
  scope?: string;
  issuedAt: number;
}

/**
 * SecureTokenStore クラス
 */
export class SecureTokenStore {
  private static readonly SECURE_KEY_PREFIX = 'secure_auth:';
  private static readonly CURRENT_TOKEN_KEY = `${SecureTokenStore.SECURE_KEY_PREFIX}current`;
  private static readonly TOKEN_HISTORY_KEY = `${SecureTokenStore.SECURE_KEY_PREFIX}history`;
  private static readonly TOKEN_ROTATION_KEY = `${SecureTokenStore.SECURE_KEY_PREFIX}rotation`;

  /**
   * トークンを安全に保存
   */
  static async storeToken(token: AuthToken): Promise<void> {
    try {
      const secureToken: SecureToken = {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresAt: Date.now() + token.expiresIn * 1000,
        tokenType: token.tokenType,
        scope: token.scope,
        issuedAt: token.issuedAt * 1000,
      };

      // 現在のトークンを保存
      await SecureStore.setItemAsync(
        this.CURRENT_TOKEN_KEY,
        JSON.stringify(secureToken)
      );

      // トークンローテーション履歴を更新
      await this.recordTokenRotation(secureToken);

      console.log('Token stored securely');
    } catch (error) {
      console.error('Failed to store token:', error);
      throw error;
    }
  }

  /**
   * 現在のトークンを取得
   */
  static async getToken(): Promise<SecureToken | null> {
    try {
      const tokenJson = await SecureStore.getItemAsync(this.CURRENT_TOKEN_KEY);

      if (!tokenJson) {
        return null;
      }

      return JSON.parse(tokenJson) as SecureToken;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  /**
   * アクセストークンが有効か確認
   */
  static async isTokenValid(): Promise<boolean> {
    try {
      const token = await this.getToken();

      if (!token) {
        return false;
      }

      const now = Date.now();
      // 有効期限まで60秒以上残っているか確認
      return token.expiresAt - now > 60000;
    } catch (error) {
      console.error('Failed to check token validity:', error);
      return false;
    }
  }

  /**
   * トークンが有効期限切れに近いか確認
   */
  static async isTokenExpiringSoon(
    thresholdMinutes: number = 5
  ): Promise<boolean> {
    try {
      const token = await this.getToken();

      if (!token) {
        return true;
      }

      const now = Date.now();
      const remainingTime = token.expiresAt - now;
      const thresholdMs = thresholdMinutes * 60 * 1000;

      return remainingTime < thresholdMs;
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  }

  /**
   * トークンの残り有効期限を取得（秒）
   */
  static async getTokenRemainingTime(): Promise<number> {
    try {
      const token = await this.getToken();

      if (!token) {
        return 0;
      }

      const now = Date.now();
      const remaining = Math.max(0, token.expiresAt - now);
      return Math.floor(remaining / 1000);
    } catch (error) {
      console.error('Failed to get remaining token time:', error);
      return 0;
    }
  }

  /**
   * トークンを安全に削除
   */
  static async deleteToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.CURRENT_TOKEN_KEY);
      console.log('Token deleted securely');
    } catch (error) {
      console.error('Failed to delete token:', error);
      throw error;
    }
  }

  /**
   * すべてのセキュアデータを削除
   */
  static async clearAllSecureData(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(this.CURRENT_TOKEN_KEY),
        SecureStore.deleteItemAsync(this.TOKEN_HISTORY_KEY),
        SecureStore.deleteItemAsync(this.TOKEN_ROTATION_KEY),
      ]);

      console.log('All secure data deleted');
    } catch (error) {
      console.error('Failed to clear secure data:', error);
      throw error;
    }
  }

  /**
   * トークンローテーション履歴を記録
   */
  private static async recordTokenRotation(token: SecureToken): Promise<void> {
    try {
      const rotationRecord = {
        timestamp: Date.now(),
        tokenHash: await this.hashToken(token.accessToken),
        expiresAt: token.expiresAt,
      };

      // 履歴を記録
      const historyJson = await SecureStore.getItemAsync(
        this.TOKEN_HISTORY_KEY
      );
      const history = historyJson ? JSON.parse(historyJson) : [];

      // 最新100件のみ保持
      history.push(rotationRecord);
      if (history.length > 100) {
        history.shift();
      }

      await SecureStore.setItemAsync(
        this.TOKEN_HISTORY_KEY,
        JSON.stringify(history)
      );
    } catch (error) {
      console.error('Failed to record token rotation:', error);
      // エラーは無視（履歴記録失敗がアプリケーション全体に影響しないように）
    }
  }

  /**
   * トークンをハッシュ化（履歴保存時に元のトークンを保存しない）
   * 注：実装簡略化のためシンプルなハッシュを使用
   */
  private static async hashToken(token: string): Promise<string> {
    try {
      // 実装: Expo Crypto を使用する、または簡単なハッシュを使用
      // ここではシンプルな実装例
      const chars = token.substring(0, 8);
      const tail = token.substring(token.length - 8);
      return `${chars}...${tail}`;
    } catch (error) {
      console.error('Failed to hash token:', error);
      return 'unknown';
    }
  }

  /**
   * トークンローテーション履歴を取得
   */
  static async getTokenHistory(): Promise<
    Array<{
      timestamp: number;
      tokenHash: string;
      expiresAt: number;
    }>
  > {
    try {
      const historyJson = await SecureStore.getItemAsync(
        this.TOKEN_HISTORY_KEY
      );
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Failed to get token history:', error);
      return [];
    }
  }

  /**
   * 古いトークン履歴をクリア
   */
  static async clearOldTokenHistory(daysToKeep: number = 7): Promise<void> {
    try {
      const history = await this.getTokenHistory();
      const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

      const recentHistory = history.filter(
        (record) => record.timestamp > cutoffTime
      );

      if (recentHistory.length < history.length) {
        await SecureStore.setItemAsync(
          this.TOKEN_HISTORY_KEY,
          JSON.stringify(recentHistory)
        );
        console.log(
          `Cleared ${history.length - recentHistory.length} old token records`
        );
      }
    } catch (error) {
      console.error('Failed to clear old token history:', error);
    }
  }

  /**
   * トークンの最後のローテーション時刻を取得
   */
  static async getLastRotationTime(): Promise<number | null> {
    try {
      const history = await this.getTokenHistory();
      if (history.length === 0) {
        return null;
      }
      return history[history.length - 1].timestamp;
    } catch (error) {
      console.error('Failed to get last rotation time:', error);
      return null;
    }
  }

  /**
   * トークンローテーションが必要か確認（例：24時間ごと）
   */
  static async needsRotation(maxAgeHours: number = 24): Promise<boolean> {
    try {
      const lastRotation = await this.getLastRotationTime();

      if (!lastRotation) {
        return true;
      }

      const now = Date.now();
      const ageMs = now - lastRotation;
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

      return ageMs > maxAgeMs;
    } catch (error) {
      console.error('Failed to check rotation requirement:', error);
      return false;
    }
  }
}

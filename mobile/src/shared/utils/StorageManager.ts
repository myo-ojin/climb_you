/**
 * StorageManager
 * AsyncStorage を使用した設定データの保存・取得を管理
 * 一般的なアプリケーション設定、ユーザーの環境設定などを保存
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export class StorageManager {
  // ===== ストレージキー定義 =====

  static readonly KEYS = {
    // 認証関連
    AUTH_TOKEN: '@auth:token',
    REFRESH_TOKEN: '@auth:refresh_token',
    USER_ID: '@auth:user_id',

    // アプリ設定
    APP_LANGUAGE: '@app:language',
    APP_THEME: '@app:theme',
    NOTIFICATION_ENABLED: '@app:notification_enabled',

    // ユーザー設定
    USER_TIMEZONE: '@user:timezone',
    USER_COMMIT_TIME: '@user:commit_time',

    // 同期状態
    LAST_SYNC_TIME: '@sync:last_sync_time',
    PENDING_SYNC_ITEMS: '@sync:pending_items',

    // デバッグ情報
    DEBUG_MODE: '@debug:mode'
  };

  /**
   * 文字列値を保存
   */
  static async setString(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to save string to ${key}:`, error);
      throw error;
    }
  }

  /**
   * 文字列値を取得
   */
  static async getString(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get string from ${key}:`, error);
      throw error;
    }
  }

  /**
   * JSON オブジェクトを保存
   */
  static async setObject<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Failed to save object to ${key}:`, error);
      throw error;
    }
  }

  /**
   * JSON オブジェクトを取得
   */
  static async getObject<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Failed to get object from ${key}:`, error);
      throw error;
    }
  }

  /**
   * 数値を保存
   */
  static async setNumber(key: string, value: number): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error(`Failed to save number to ${key}:`, error);
      throw error;
    }
  }

  /**
   * 数値を取得
   */
  static async getNumber(key: string): Promise<number | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value != null ? parseFloat(value) : null;
    } catch (error) {
      console.error(`Failed to get number from ${key}:`, error);
      throw error;
    }
  }

  /**
   * ブール値を保存
   */
  static async setBoolean(key: string, value: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value ? 'true' : 'false');
    } catch (error) {
      console.error(`Failed to save boolean to ${key}:`, error);
      throw error;
    }
  }

  /**
   * ブール値を取得
   */
  static async getBoolean(key: string): Promise<boolean | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value != null ? value === 'true' : null;
    } catch (error) {
      console.error(`Failed to get boolean from ${key}:`, error);
      throw error;
    }
  }

  /**
   * キーを削除
   */
  static async removeKey(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 複数のキーを削除
   */
  static async removeKeys(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Failed to remove multiple keys:', error);
      throw error;
    }
  }

  /**
   * すべてのキーを取得
   */
  static async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Failed to get all keys:', error);
      throw error;
    }
  }

  /**
   * すべてのデータをクリア（デバッグ用）
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear all storage:', error);
      throw error;
    }
  }

  /**
   * 認証トークンを保存
   */
  static async setAuthToken(token: string): Promise<void> {
    await this.setString(this.KEYS.AUTH_TOKEN, token);
  }

  /**
   * 認証トークンを取得
   */
  static async getAuthToken(): Promise<string | null> {
    return await this.getString(this.KEYS.AUTH_TOKEN);
  }

  /**
   * リフレッシュトークンを保存
   */
  static async setRefreshToken(token: string): Promise<void> {
    await this.setString(this.KEYS.REFRESH_TOKEN, token);
  }

  /**
   * リフレッシュトークンを取得
   */
  static async getRefreshToken(): Promise<string | null> {
    return await this.getString(this.KEYS.REFRESH_TOKEN);
  }

  /**
   * ユーザーIDを保存
   */
  static async setUserId(userId: string): Promise<void> {
    await this.setString(this.KEYS.USER_ID, userId);
  }

  /**
   * ユーザーIDを取得
   */
  static async getUserId(): Promise<string | null> {
    return await this.getString(this.KEYS.USER_ID);
  }

  /**
   * 言語設定を保存
   */
  static async setLanguage(language: string): Promise<void> {
    await this.setString(this.KEYS.APP_LANGUAGE, language);
  }

  /**
   * 言語設定を取得
   */
  static async getLanguage(): Promise<string | null> {
    return await this.getString(this.KEYS.APP_LANGUAGE);
  }

  /**
   * 最後の同期時刻を保存
   */
  static async setLastSyncTime(timestamp: number): Promise<void> {
    await this.setNumber(this.KEYS.LAST_SYNC_TIME, timestamp);
  }

  /**
   * 最後の同期時刻を取得
   */
  static async getLastSyncTime(): Promise<number | null> {
    return await this.getNumber(this.KEYS.LAST_SYNC_TIME);
  }

  /**
   * 認証情報をすべてクリア
   */
  static async clearAuthData(): Promise<void> {
    await this.removeKeys([
      this.KEYS.AUTH_TOKEN,
      this.KEYS.REFRESH_TOKEN,
      this.KEYS.USER_ID
    ]);
  }
}

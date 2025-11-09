/**
 * TokenManager Tests
 * トークン管理のユニットテスト
 */

import { TokenManager } from '../TokenManager';
import type { AuthToken } from '@/core/domain/entities';
import * as SecureStore from 'expo-secure-store';

// SecureStoreをモック
jest.mock('expo-secure-store');

describe('TokenManager', () => {
  const mockAuthToken: AuthToken = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600, // 1 hour
    tokenType: 'Bearer',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    // Reset Date.now mock
    jest.spyOn(Date, 'now').mockRestore();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveTokens', () => {
    it('トークンペアを保存できること', async () => {
      jest.mocked(SecureStore.setItemAsync).mockResolvedValue();
      const mockNow = 1704067200000; // 2024-01-01 00:00:00
      jest.spyOn(Date, 'now').mockReturnValue(mockNow);

      await TokenManager.saveTokens(mockAuthToken);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth:access_token',
        'mock-access-token'
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth:refresh_token',
        'mock-refresh-token'
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth:token_expiry',
        (mockNow + 3600 * 1000).toString()
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth:token_type',
        'Bearer'
      );
      expect(console.log).toHaveBeenCalledWith('Tokens saved successfully');
    });

    it('refreshTokenがない場合も保存できること', async () => {
      jest.mocked(SecureStore.setItemAsync).mockResolvedValue();
      const tokenWithoutRefresh: AuthToken = {
        accessToken: 'mock-access-token',
        refreshToken: undefined,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      await TokenManager.saveTokens(tokenWithoutRefresh);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth:access_token',
        'mock-access-token'
      );
      // refreshTokenの保存は呼ばれないはず（Promise.resolve()が呼ばれる）
      const refreshTokenCalls = jest
        .mocked(SecureStore.setItemAsync)
        .mock.calls.filter(call => call[0] === 'auth:refresh_token');
      expect(refreshTokenCalls).toHaveLength(0);
    });

    it('保存失敗時にエラーをスローすること', async () => {
      jest
        .mocked(SecureStore.setItemAsync)
        .mockRejectedValue(new Error('SecureStore error'));

      await expect(TokenManager.saveTokens(mockAuthToken)).rejects.toThrow(
        'SecureStore error'
      );
      expect(console.error).toHaveBeenCalledWith(
        'Failed to save tokens:',
        expect.any(Error)
      );
    });
  });

  describe('getAccessToken', () => {
    it('アクセストークンを取得できること', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue('mock-access-token');

      const result = await TokenManager.getAccessToken();

      expect(result).toBe('mock-access-token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth:access_token');
    });

    it('トークンがない場合nullを返すこと', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      const result = await TokenManager.getAccessToken();

      expect(result).toBeNull();
    });

    it('取得失敗時にnullを返すこと', async () => {
      jest
        .mocked(SecureStore.getItemAsync)
        .mockRejectedValue(new Error('SecureStore error'));

      const result = await TokenManager.getAccessToken();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to get access token:',
        expect.any(Error)
      );
    });
  });

  describe('getRefreshToken', () => {
    it('リフレッシュトークンを取得できること', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue('mock-refresh-token');

      const result = await TokenManager.getRefreshToken();

      expect(result).toBe('mock-refresh-token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth:refresh_token');
    });

    it('取得失敗時にnullを返すこと', async () => {
      jest
        .mocked(SecureStore.getItemAsync)
        .mockRejectedValue(new Error('SecureStore error'));

      const result = await TokenManager.getRefreshToken();

      expect(result).toBeNull();
    });
  });

  describe('getTokenExpiry', () => {
    it('トークンの有効期限を取得できること', async () => {
      const expiry = 1704070800000; // 2024-01-01 01:00:00
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(expiry.toString());

      const result = await TokenManager.getTokenExpiry();

      expect(result).toBe(expiry);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth:token_expiry');
    });

    it('有効期限がない場合nullを返すこと', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      const result = await TokenManager.getTokenExpiry();

      expect(result).toBeNull();
    });

    it('取得失敗時にnullを返すこと', async () => {
      jest
        .mocked(SecureStore.getItemAsync)
        .mockRejectedValue(new Error('SecureStore error'));

      const result = await TokenManager.getTokenExpiry();

      expect(result).toBeNull();
    });
  });

  describe('isTokenValid', () => {
    it('トークンが有効な場合trueを返すこと', async () => {
      const mockNow = 1704067200000; // 2024-01-01 00:00:00
      const expiry = mockNow + 3600 * 1000; // 1 hour later

      jest.spyOn(Date, 'now').mockReturnValue(mockNow);
      jest
        .mocked(SecureStore.getItemAsync)
        .mockImplementation(async (key) => {
          if (key === 'auth:access_token') return 'mock-token';
          if (key === 'auth:token_expiry') return expiry.toString();
          return null;
        });

      const result = await TokenManager.isTokenValid();

      expect(result).toBe(true);
    });

    it('トークンがない場合falseを返すこと', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      const result = await TokenManager.isTokenValid();

      expect(result).toBe(false);
    });

    it('有効期限がない場合falseを返すこと', async () => {
      jest
        .mocked(SecureStore.getItemAsync)
        .mockImplementation(async (key) => {
          if (key === 'auth:access_token') return 'mock-token';
          if (key === 'auth:token_expiry') return null;
          return null;
        });

      const result = await TokenManager.isTokenValid();

      expect(result).toBe(false);
    });

    it('有効期限まで60秒未満の場合falseを返すこと', async () => {
      const mockNow = 1704067200000;
      const expiry = mockNow + 30 * 1000; // 30 seconds later (< 60 seconds)

      jest.spyOn(Date, 'now').mockReturnValue(mockNow);
      jest
        .mocked(SecureStore.getItemAsync)
        .mockImplementation(async (key) => {
          if (key === 'auth:access_token') return 'mock-token';
          if (key === 'auth:token_expiry') return expiry.toString();
          return null;
        });

      const result = await TokenManager.isTokenValid();

      expect(result).toBe(false);
    });

    it('エラー時にfalseを返すこと', async () => {
      jest
        .mocked(SecureStore.getItemAsync)
        .mockRejectedValue(new Error('SecureStore error'));

      const result = await TokenManager.isTokenValid();

      expect(result).toBe(false);
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('有効期限まで5分未満の場合trueを返すこと', async () => {
      const mockNow = 1704067200000;
      const expiry = mockNow + 4 * 60 * 1000; // 4 minutes later

      jest.spyOn(Date, 'now').mockReturnValue(mockNow);
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(expiry.toString());

      const result = await TokenManager.isTokenExpiringSoon();

      expect(result).toBe(true);
    });

    it('有効期限まで5分以上の場合falseを返すこと', async () => {
      const mockNow = 1704067200000;
      const expiry = mockNow + 10 * 60 * 1000; // 10 minutes later

      jest.spyOn(Date, 'now').mockReturnValue(mockNow);
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(expiry.toString());

      const result = await TokenManager.isTokenExpiringSoon();

      expect(result).toBe(false);
    });

    it('有効期限がない場合trueを返すこと', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      const result = await TokenManager.isTokenExpiringSoon();

      expect(result).toBe(true);
    });

    it('エラー時にtrueを返すこと', async () => {
      jest
        .mocked(SecureStore.getItemAsync)
        .mockRejectedValue(new Error('SecureStore error'));

      const result = await TokenManager.isTokenExpiringSoon();

      expect(result).toBe(true);
    });
  });

  describe('getTokenRemainingTime', () => {
    it('残り有効期限を秒で返すこと', async () => {
      const mockNow = 1704067200000;
      const expiry = mockNow + 3600 * 1000; // 1 hour later

      jest.spyOn(Date, 'now').mockReturnValue(mockNow);
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(expiry.toString());

      const result = await TokenManager.getTokenRemainingTime();

      expect(result).toBe(3600); // 3600 seconds = 1 hour
    });

    it('有効期限がない場合0を返すこと', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      const result = await TokenManager.getTokenRemainingTime();

      expect(result).toBe(0);
    });

    it('有効期限切れの場合0を返すこと', async () => {
      const mockNow = 1704067200000;
      const expiry = mockNow - 3600 * 1000; // 1 hour ago

      jest.spyOn(Date, 'now').mockReturnValue(mockNow);
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(expiry.toString());

      const result = await TokenManager.getTokenRemainingTime();

      expect(result).toBe(0);
    });

    it('エラー時に0を返すこと', async () => {
      jest
        .mocked(SecureStore.getItemAsync)
        .mockRejectedValue(new Error('SecureStore error'));

      const result = await TokenManager.getTokenRemainingTime();

      expect(result).toBe(0);
    });
  });

  describe('deleteTokens', () => {
    it('すべてのトークンを削除できること', async () => {
      jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue();

      await TokenManager.deleteTokens();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth:access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth:refresh_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth:token_expiry');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth:token_type');
      expect(console.log).toHaveBeenCalledWith('Tokens deleted successfully');
    });

    it('削除失敗時にエラーをスローすること', async () => {
      jest
        .mocked(SecureStore.deleteItemAsync)
        .mockRejectedValue(new Error('SecureStore error'));

      await expect(TokenManager.deleteTokens()).rejects.toThrow('SecureStore error');
      expect(console.error).toHaveBeenCalledWith(
        'Failed to delete tokens:',
        expect.any(Error)
      );
    });
  });

  describe('getTokenPair', () => {
    it('アクセストークンとリフレッシュトークンを取得できること', async () => {
      jest
        .mocked(SecureStore.getItemAsync)
        .mockImplementation(async (key) => {
          if (key === 'auth:access_token') return 'mock-access-token';
          if (key === 'auth:refresh_token') return 'mock-refresh-token';
          return null;
        });

      const result = await TokenManager.getTokenPair();

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('トークンがない場合nullを返すこと', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      const result = await TokenManager.getTokenPair();

      expect(result).toEqual({
        accessToken: null,
        refreshToken: null,
      });
    });

    it('エラー時にnullを返すこと', async () => {
      jest
        .mocked(SecureStore.getItemAsync)
        .mockRejectedValue(new Error('SecureStore error'));

      const result = await TokenManager.getTokenPair();

      expect(result).toEqual({
        accessToken: null,
        refreshToken: null,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Failed to get token pair:',
        expect.any(Error)
      );
    });
  });

  describe('clearAuthData', () => {
    it('認証データをクリアできること', async () => {
      jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue();

      await TokenManager.clearAuthData();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(4);
      expect(console.log).toHaveBeenCalledWith('Auth data cleared');
    });

    it('クリア失敗時にエラーをスローすること', async () => {
      jest
        .mocked(SecureStore.deleteItemAsync)
        .mockRejectedValue(new Error('SecureStore error'));

      await expect(TokenManager.clearAuthData()).rejects.toThrow('SecureStore error');
      expect(console.error).toHaveBeenCalledWith(
        'Failed to clear auth data:',
        expect.any(Error)
      );
    });
  });
});

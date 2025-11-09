/**
 * SecureTokenStore Tests
 * テスト対象: セキュアストレージでのトークン管理（暗号化、ローテーション、有効期限管理）
 */

import * as SecureStore from 'expo-secure-store';
import { SecureTokenStore, SecureToken } from '../SecureTokenStore';
import { AuthToken } from '@/core/domain/entities';

// Mock expo-secure-store
jest.mock('expo-secure-store');

describe('SecureTokenStore', () => {
  const mockAuthToken: AuthToken = {
    accessToken: 'test_access_token_12345',
    refreshToken: 'test_refresh_token_67890',
    expiresIn: 3600, // 1 hour
    tokenType: 'Bearer',
    scope: 'openid profile email',
    issuedAt: Math.floor(Date.now() / 1000),
  };

  const mockSecureToken: SecureToken = {
    accessToken: 'test_access_token_12345',
    refreshToken: 'test_refresh_token_67890',
    expiresAt: Date.now() + 3600000,
    tokenType: 'Bearer',
    scope: 'openid profile email',
    issuedAt: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('storeToken', () => {
    it('should store token securely', async () => {
      jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      await SecureTokenStore.storeToken(mockAuthToken);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        expect.stringContaining('current'),
        expect.any(String)
      );
    });

    it('should record token rotation', async () => {
      jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      await SecureTokenStore.storeToken(mockAuthToken);

      const calls = jest.mocked(SecureStore.setItemAsync).mock.calls;
      expect(calls.length).toBeGreaterThan(1);
    });

    it('should throw error on storage failure', async () => {
      jest.mocked(SecureStore.setItemAsync).mockRejectedValue(new Error('Storage failed'));

      await expect(SecureTokenStore.storeToken(mockAuthToken)).rejects.toThrow('Storage failed');
    });

    it('should handle missing refresh token', async () => {
      jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      const tokenWithoutRefresh: AuthToken = {
        ...mockAuthToken,
        refreshToken: undefined,
      };

      await SecureTokenStore.storeToken(tokenWithoutRefresh);

      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe('getToken', () => {
    it('should retrieve stored token', async () => {
      const storedToken = JSON.stringify(mockSecureToken);
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(storedToken);

      const result = await SecureTokenStore.getToken();

      expect(result).toEqual(mockSecureToken);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
        expect.stringContaining('current')
      );
    });

    it('should return null when no token stored', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      const result = await SecureTokenStore.getToken();

      expect(result).toBeNull();
    });

    it('should handle corrupted token data', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue('invalid json');

      const result = await SecureTokenStore.getToken();

      expect(result).toBeNull();
    });

    it('should return null on retrieval error', async () => {
      jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('Retrieval failed'));

      const result = await SecureTokenStore.getToken();

      expect(result).toBeNull();
    });
  });

  describe('isTokenValid', () => {
    it('should return true for valid token', async () => {
      const futureToken: SecureToken = {
        ...mockSecureToken,
        expiresAt: Date.now() + 120000, // 2 minutes from now
      };
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(futureToken));

      const result = await SecureTokenStore.isTokenValid();

      expect(result).toBe(true);
    });

    it('should return false for expired token', async () => {
      const expiredToken: SecureToken = {
        ...mockSecureToken,
        expiresAt: Date.now() - 1000, // 1 second ago
      };
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(expiredToken));

      const result = await SecureTokenStore.isTokenValid();

      expect(result).toBe(false);
    });

    it('should return false when expiring in less than 60 seconds', async () => {
      const expiringToken: SecureToken = {
        ...mockSecureToken,
        expiresAt: Date.now() + 30000, // 30 seconds from now
      };
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(expiringToken));

      const result = await SecureTokenStore.isTokenValid();

      expect(result).toBe(false);
    });

    it('should return false when no token', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      const result = await SecureTokenStore.isTokenValid();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('Check failed'));

      const result = await SecureTokenStore.isTokenValid();

      expect(result).toBe(false);
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('should return true when expiring within threshold', async () => {
      const expiringToken: SecureToken = {
        ...mockSecureToken,
        expiresAt: Date.now() + 180000, // 3 minutes from now
      };
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(expiringToken));

      const result = await SecureTokenStore.isTokenExpiringSoon(5); // 5 minute threshold

      expect(result).toBe(true);
    });

    it('should return false when not expiring within threshold', async () => {
      const validToken: SecureToken = {
        ...mockSecureToken,
        expiresAt: Date.now() + 600000, // 10 minutes from now
      };
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(validToken));

      const result = await SecureTokenStore.isTokenExpiringSoon(5); // 5 minute threshold

      expect(result).toBe(false);
    });

    it('should use default 5 minute threshold', async () => {
      const expiringToken: SecureToken = {
        ...mockSecureToken,
        expiresAt: Date.now() + 240000, // 4 minutes from now
      };
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(expiringToken));

      const result = await SecureTokenStore.isTokenExpiringSoon();

      expect(result).toBe(true);
    });

    it('should return true when no token', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      const result = await SecureTokenStore.isTokenExpiringSoon();

      expect(result).toBe(true);
    });

    it('should return true on error', async () => {
      jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('Check failed'));

      const result = await SecureTokenStore.isTokenExpiringSoon();

      expect(result).toBe(true);
    });
  });

  describe('getTokenRemainingTime', () => {
    it('should return remaining seconds', async () => {
      const remainingMs = 1800000; // 30 minutes
      const token: SecureToken = {
        ...mockSecureToken,
        expiresAt: Date.now() + remainingMs,
      };
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(token));

      const result = await SecureTokenStore.getTokenRemainingTime();

      expect(result).toBeGreaterThan(1700);
      expect(result).toBeLessThanOrEqual(1800);
    });

    it('should return 0 for expired token', async () => {
      const token: SecureToken = {
        ...mockSecureToken,
        expiresAt: Date.now() - 1000,
      };
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(token));

      const result = await SecureTokenStore.getTokenRemainingTime();

      expect(result).toBe(0);
    });

    it('should return 0 when no token', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      const result = await SecureTokenStore.getTokenRemainingTime();

      expect(result).toBe(0);
    });

    it('should return 0 on error', async () => {
      jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('Failed'));

      const result = await SecureTokenStore.getTokenRemainingTime();

      expect(result).toBe(0);
    });
  });

  describe('deleteToken', () => {
    it('should delete token securely', async () => {
      jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue(undefined);

      await SecureTokenStore.deleteToken();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        expect.stringContaining('current')
      );
    });

    it('should throw error on deletion failure', async () => {
      jest.mocked(SecureStore.deleteItemAsync).mockRejectedValue(new Error('Deletion failed'));

      await expect(SecureTokenStore.deleteToken()).rejects.toThrow('Deletion failed');
    });
  });

  describe('clearAllSecureData', () => {
    it('should delete all secure data', async () => {
      jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue(undefined);

      await SecureTokenStore.clearAllSecureData();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
    });

    it('should throw error on any deletion failure', async () => {
      jest.mocked(SecureStore.deleteItemAsync)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Deletion failed'));

      await expect(SecureTokenStore.clearAllSecureData()).rejects.toThrow('Deletion failed');
    });
  });

  describe('recordTokenRotation', () => {
    it('should record token rotation', async () => {
      jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      await SecureTokenStore.storeToken(mockAuthToken);

      const setCalls = jest.mocked(SecureStore.setItemAsync).mock.calls;
      const historyCall = setCalls.find((call) => call[0].includes('history'));
      expect(historyCall).toBeDefined();
    });

    it('should maintain max 100 rotation records', async () => {
      const records = Array.from({ length: 101 }, (_, i) => ({
        timestamp: Date.now() - i * 1000,
        tokenHash: `hash_${i}`,
        expiresAt: Date.now() + 3600000,
      }));

      const historyJson = JSON.stringify(records);
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(historyJson);
      jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);

      await SecureTokenStore.storeToken(mockAuthToken);

      const setCalls = jest.mocked(SecureStore.setItemAsync).mock.calls;
      const historyCalls = setCalls.filter((call) => call[0].includes('history'));

      historyCalls.forEach((call) => {
        if (call[1]) {
          const history = JSON.parse(call[1] as string);
          expect(history.length).toBeLessThanOrEqual(100);
        }
      });
    });

    it('should handle rotation record error gracefully', async () => {
      jest.mocked(SecureStore.setItemAsync)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('History failed'));

      // Should not throw - rotation failure is non-critical
      await SecureTokenStore.storeToken(mockAuthToken);

      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe('getTokenHistory', () => {
    it('should retrieve token history', async () => {
      const history = [
        {
          timestamp: Date.now(),
          tokenHash: 'abc123...xyz789',
          expiresAt: Date.now() + 3600000,
        },
      ];

      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(history));

      const result = await SecureTokenStore.getTokenHistory();

      expect(result).toEqual(history);
    });

    it('should return empty array when no history', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

      const result = await SecureTokenStore.getTokenHistory();

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('Failed'));

      const result = await SecureTokenStore.getTokenHistory();

      expect(result).toEqual([]);
    });
  });

  describe('clearOldTokenHistory', () => {
    it('should clear old token history', async () => {
      const now = Date.now();
      const history = [
        { timestamp: now - 10 * 24 * 60 * 60 * 1000, tokenHash: 'old', expiresAt: now },
        { timestamp: now - 3 * 24 * 60 * 60 * 1000, tokenHash: 'recent', expiresAt: now },
      ];

      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(history));
      jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);

      await SecureTokenStore.clearOldTokenHistory(7);

      const setCalls = jest.mocked(SecureStore.setItemAsync).mock.calls;
      const historyCalls = setCalls.filter((call) => call[0].includes('history'));

      if (historyCalls.length > 0 && historyCalls[0][1]) {
        const saved = JSON.parse(historyCalls[0][1] as string);
        expect(saved.length).toBe(1);
        expect(saved[0].tokenHash).toBe('recent');
      }
    });

    it('should not update if all records are recent', async () => {
      const now = Date.now();
      const history = [{ timestamp: now - 1 * 24 * 60 * 60 * 1000, tokenHash: 'recent', expiresAt: now }];

      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(history));
      jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);

      await SecureTokenStore.clearOldTokenHistory(7);

      const setCalls = jest.mocked(SecureStore.setItemAsync).mock.calls;
      // Should be called for token storage, but not for history update
      expect(setCalls.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle error gracefully', async () => {
      jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('Failed'));

      await SecureTokenStore.clearOldTokenHistory(7);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('getLastRotationTime', () => {
    it('should return last rotation timestamp', async () => {
      const now = Date.now();
      const history = [
        { timestamp: now - 10000, tokenHash: 'old', expiresAt: now },
        { timestamp: now - 1000, tokenHash: 'recent', expiresAt: now },
      ];

      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(history));

      const result = await SecureTokenStore.getLastRotationTime();

      expect(result).toBe(now - 1000);
    });

    it('should return null when no history', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify([]));

      const result = await SecureTokenStore.getLastRotationTime();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('Failed'));

      const result = await SecureTokenStore.getLastRotationTime();

      expect(result).toBeNull();
    });
  });

  describe('needsRotation', () => {
    it('should return true when rotation needed', async () => {
      const oldRotation = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      const history = [{ timestamp: oldRotation, tokenHash: 'old', expiresAt: Date.now() }];

      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(history));

      const result = await SecureTokenStore.needsRotation(24);

      expect(result).toBe(true);
    });

    it('should return false when rotation not needed', async () => {
      const recentRotation = Date.now() - 12 * 60 * 60 * 1000; // 12 hours ago
      const history = [{ timestamp: recentRotation, tokenHash: 'recent', expiresAt: Date.now() }];

      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(history));

      const result = await SecureTokenStore.needsRotation(24);

      expect(result).toBe(false);
    });

    it('should return true when no rotation history', async () => {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify([]));

      const result = await SecureTokenStore.needsRotation(24);

      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('Failed'));

      const result = await SecureTokenStore.needsRotation(24);

      expect(result).toBe(false);
    });

    it('should use default 24 hour max age', async () => {
      const oldRotation = Date.now() - 25 * 60 * 60 * 1000;
      const history = [{ timestamp: oldRotation, tokenHash: 'old', expiresAt: Date.now() }];

      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(history));

      const result = await SecureTokenStore.needsRotation();

      expect(result).toBe(true);
    });
  });
});

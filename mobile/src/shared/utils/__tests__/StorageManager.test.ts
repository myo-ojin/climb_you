/**
 * StorageManager Unit Tests
 * AsyncStorage ラッパーのテスト
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageManager } from '../StorageManager';

// AsyncStorage をモック
jest.mock('@react-native-async-storage/async-storage');

describe('StorageManager', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    jest.clearAllMocks();
  });

  describe('String operations', () => {
    it('should set and get string value', async () => {
      const mockSetItem = jest.fn().mockResolvedValue(undefined);
      const mockGetItem = jest.fn().mockResolvedValue('test-value');

      (AsyncStorage.setItem as jest.Mock) = mockSetItem;
      (AsyncStorage.getItem as jest.Mock) = mockGetItem;

      await StorageManager.setString('key', 'value');
      expect(mockSetItem).toHaveBeenCalledWith('key', 'value');

      const value = await StorageManager.getString('key');
      expect(mockGetItem).toHaveBeenCalledWith('key');
    });

    it('should return null for non-existent key', async () => {
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(null);

      const value = await StorageManager.getString('non-existent');
      expect(value).toBeNull();
    });

    it('should handle string with special characters', async () => {
      const specialString = 'Hello\nWorld\t!@#$%';
      (AsyncStorage.setItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(specialString);

      await StorageManager.setString('special', specialString);
      const retrieved = await StorageManager.getString('special');
      expect(retrieved).toBe(specialString);
    });
  });

  describe('Object operations', () => {
    it('should set and get JSON object', async () => {
      const testObject = { id: 1, name: 'Test', active: true };
      const jsonString = JSON.stringify(testObject);

      (AsyncStorage.setItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(jsonString);

      await StorageManager.setObject('obj', testObject);
      const retrieved = await StorageManager.getObject('obj');
      expect(retrieved).toEqual(testObject);
    });

    it('should handle complex nested objects', async () => {
      const complexObject = {
        user: {
          id: '123',
          profile: {
            name: 'John',
            email: 'john@example.com',
            preferences: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
      };

      (AsyncStorage.setItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(JSON.stringify(complexObject));

      await StorageManager.setObject('complex', complexObject);
      const retrieved = await StorageManager.getObject('complex');
      expect(retrieved).toEqual(complexObject);
    });

    it('should return null for invalid JSON', async () => {
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(null);

      const retrieved = await StorageManager.getObject('invalid');
      expect(retrieved).toBeNull();
    });
  });

  describe('Number operations', () => {
    it('should set and get number value', async () => {
      (AsyncStorage.setItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue('42');

      await StorageManager.setNumber('count', 42);
      const value = await StorageManager.getNumber('count');
      expect(value).toBe(42);
    });

    it('should handle float numbers', async () => {
      (AsyncStorage.setItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue('3.14159');

      await StorageManager.setNumber('pi', 3.14159);
      const value = await StorageManager.getNumber('pi');
      expect(value).toBeCloseTo(3.14159);
    });

    it('should return null for non-existent number', async () => {
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(null);

      const value = await StorageManager.getNumber('non-existent');
      expect(value).toBeNull();
    });
  });

  describe('Boolean operations', () => {
    it('should set and get boolean true', async () => {
      (AsyncStorage.setItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue('true');

      await StorageManager.setBoolean('enabled', true);
      const value = await StorageManager.getBoolean('enabled');
      expect(value).toBe(true);
    });

    it('should set and get boolean false', async () => {
      (AsyncStorage.setItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue('false');

      await StorageManager.setBoolean('enabled', false);
      const value = await StorageManager.getBoolean('enabled');
      expect(value).toBe(false);
    });

    it('should return null for non-existent boolean', async () => {
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(null);

      const value = await StorageManager.getBoolean('non-existent');
      expect(value).toBeNull();
    });
  });

  describe('Key management', () => {
    it('should remove a key', async () => {
      (AsyncStorage.removeItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);

      await StorageManager.removeKey('to-remove');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('to-remove');
    });

    it('should remove multiple keys', async () => {
      (AsyncStorage.multiRemove as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);

      const keys = ['key1', 'key2', 'key3'];
      await StorageManager.removeKeys(keys);
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(keys);
    });

    it('should get all keys', async () => {
      const mockKeys = ['key1', 'key2', 'key3'];
      (AsyncStorage.getAllKeys as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockKeys);

      const keys = await StorageManager.getAllKeys();
      expect(keys).toEqual(mockKeys);
    });

    it('should clear all storage', async () => {
      (AsyncStorage.clear as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);

      await StorageManager.clearAll();
      expect(AsyncStorage.clear).toHaveBeenCalled();
    });
  });

  describe('Authentication operations', () => {
    it('should set and get auth token', async () => {
      const token = 'jwt-token-abc123';

      (AsyncStorage.setItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(token);

      await StorageManager.setAuthToken(token);
      const retrievedToken = await StorageManager.getAuthToken();
      expect(retrievedToken).toBe(token);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        StorageManager.KEYS.AUTH_TOKEN,
        token
      );
    });

    it('should set and get refresh token', async () => {
      const refreshToken = 'refresh-token-xyz789';

      (AsyncStorage.setItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(refreshToken);

      await StorageManager.setRefreshToken(refreshToken);
      const retrieved = await StorageManager.getRefreshToken();
      expect(retrieved).toBe(refreshToken);
    });

    it('should clear auth data', async () => {
      (AsyncStorage.multiRemove as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);

      await StorageManager.clearAuthData();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        StorageManager.KEYS.AUTH_TOKEN,
        StorageManager.KEYS.REFRESH_TOKEN,
        StorageManager.KEYS.USER_ID,
      ]);
    });
  });

  describe('User-specific operations', () => {
    it('should set and get user ID', async () => {
      const userId = 'user-12345';

      (AsyncStorage.setItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(userId);

      await StorageManager.setUserId(userId);
      const retrieved = await StorageManager.getUserId();
      expect(retrieved).toBe(userId);
    });

    it('should set and get language preference', async () => {
      (AsyncStorage.setItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue('ja');

      await StorageManager.setLanguage('ja');
      const language = await StorageManager.getLanguage();
      expect(language).toBe('ja');
    });
  });

  describe('Sync-specific operations', () => {
    it('should set and get last sync time', async () => {
      const timestamp = Date.now();

      (AsyncStorage.setItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockResolvedValue(timestamp.toString());

      await StorageManager.setLastSyncTime(timestamp);
      const retrieved = await StorageManager.getLastSyncTime();
      expect(retrieved).toBe(timestamp);
    });
  });

  describe('Error handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      const error = new Error('AsyncStorage error');
      (AsyncStorage.setItem as jest.Mock) = jest
        .fn()
        .mockRejectedValue(error);

      await expect(
        StorageManager.setString('key', 'value')
      ).rejects.toThrow('AsyncStorage error');
    });

    it('should handle get errors gracefully', async () => {
      const error = new Error('AsyncStorage read error');
      (AsyncStorage.getItem as jest.Mock) = jest
        .fn()
        .mockRejectedValue(error);

      await expect(
        StorageManager.getString('key')
      ).rejects.toThrow('AsyncStorage read error');
    });
  });
});

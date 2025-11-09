/**
 * AuthInterceptor Basic Tests
 * 認証インターセプターの基本テスト
 */

import axios, { AxiosInstance } from 'axios';
import { setupAuthInterceptor } from '../authInterceptor';
import { SecureTokenStore } from '@/services/auth';
import { OAuth2Client } from '@/core/network/oauth';

// モック
jest.mock('@/services/auth');
jest.mock('@/core/network/oauth');

describe('AuthInterceptor - Basic Tests', () => {
  let axiosInstance: AxiosInstance;
  let mockOAuthClient: jest.Mocked<OAuth2Client>;

  beforeEach(() => {
    axiosInstance = axios.create();
    mockOAuthClient = {
      refreshToken: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  describe('setupAuthInterceptor', () => {
    it('インターセプターを設定できること', () => {
      const config = {
        tokenRefreshUrl: 'https://api.example.com/refresh',
      };

      expect(() => {
        setupAuthInterceptor(axiosInstance, mockOAuthClient, config);
      }).not.toThrow();

      // インターセプターが追加されていることを確認
      expect(axiosInstance.interceptors.request['handlers'].length).toBeGreaterThan(0);
      expect(axiosInstance.interceptors.response['handlers'].length).toBeGreaterThan(0);
    });
  });

  describe('request interceptor', () => {
    it('トークンがリクエストヘッダーに追加されること', async () => {
      // SecureTokenStoreをモック化
      (SecureTokenStore.getAccessToken as jest.Mock) = jest.fn().mockResolvedValue('mock-token');

      const config = {
        tokenRefreshUrl: 'https://api.example.com/refresh',
      };

      setupAuthInterceptor(axiosInstance, mockOAuthClient, config);

      // リクエスト設定を作成
      const requestConfig = {
        url: '/api/data',
        headers: {},
      };

      // リクエストインターセプターを手動で呼び出し
      const interceptor = axiosInstance.interceptors.request['handlers'][0];
      const result = await interceptor.fulfilled(requestConfig);

      expect(result.headers.Authorization).toBe('Bearer mock-token');
    });

    it('トークンがない場合もエラーにならないこと', async () => {
      // SecureTokenStoreをモック化
      (SecureTokenStore.getAccessToken as jest.Mock) = jest.fn().mockResolvedValue(null);

      const config = {
        tokenRefreshUrl: 'https://api.example.com/refresh',
      };

      setupAuthInterceptor(axiosInstance, mockOAuthClient, config);

      const requestConfig = {
        url: '/api/data',
        headers: {},
      };

      const interceptor = axiosInstance.interceptors.request['handlers'][0];
      const result = await interceptor.fulfilled(requestConfig);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });
});

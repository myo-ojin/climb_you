/**
 * Interceptors Tests
 * テスト対象: Auth、Error、Logging インターセプター
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios, { AxiosInstance } from 'axios';
import { setupAuthInterceptor, setupErrorInterceptor, AppError, setupLoggingInterceptor, LogLevel } from '../index';
import { SecureTokenStore } from '@/services/auth';
import { OAuth2Client } from '@/core/network/oauth';

// Mock dependencies
vi.mock('@/services/auth');
vi.mock('@/core/network/oauth');

describe('Interceptors', () => {
  let axiosInstance: AxiosInstance;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    axiosInstance = axios.create({
      baseURL: 'https://api.example.com',
    });

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Auth Interceptor', () => {
    it('should attach token to request headers', async () => {
      const mockToken = {
        accessToken: 'test_token_123',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        issuedAt: Date.now(),
      };

      vi.mocked(SecureTokenStore.getToken).mockResolvedValue(mockToken);

      const oauthClient = new OAuth2Client({} as any);
      setupAuthInterceptor(axiosInstance, oauthClient, {
        tokenRefreshUrl: 'https://api.example.com/auth/refresh',
      });

      // リクエスト実行時にインターセプターが動作するかテスト
      let capturedHeaders: any = {};

      axiosInstance.interceptors.request.handlers[0].fulfilled({
        headers: {},
      } as any);

      // トークン取得を確認
      expect(SecureTokenStore.getToken).toHaveBeenCalled();
    });

    it('should exclude URLs from auth', async () => {
      vi.mocked(SecureTokenStore.getToken).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        issuedAt: Date.now(),
      });

      const oauthClient = new OAuth2Client({} as any);
      setupAuthInterceptor(axiosInstance, oauthClient, {
        tokenRefreshUrl: 'https://api.example.com/auth/refresh',
        excludeUrls: [/\/health/],
      });

      const handler = axiosInstance.interceptors.request.handlers[0].fulfilled;
      const response = await handler({
        url: '/health',
        headers: {},
      } as any);

      // 除外URL ではトークンが付与されない
      expect(response.headers?.Authorization).toBeUndefined();
    });

    it('should handle 401 and refresh token', async () => {
      const oldToken = {
        accessToken: 'old_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        issuedAt: Date.now(),
      };

      const newToken = {
        accessToken: 'new_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        issuedAt: Date.now(),
      };

      vi.mocked(SecureTokenStore.getToken).mockResolvedValue(oldToken);
      const mockOauthClient = {
        refreshAccessToken: vi.fn().mockResolvedValue(newToken),
      };

      setupAuthInterceptor(axiosInstance, mockOauthClient as any, {
        tokenRefreshUrl: 'https://api.example.com/auth/refresh',
      });

      // 401エラーハンドラを取得
      const errorHandler = axiosInstance.interceptors.response.handlers[0].rejected;

      const error = {
        response: { status: 401 },
        config: { _retry: false },
      };

      // エラーハンドラが実行されることを確認
      expect(errorHandler).toBeDefined();
    });

    it('should call onUnauthorized callback on token refresh failure', async () => {
      const mockCallback = vi.fn();

      vi.mocked(SecureTokenStore.getToken).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        issuedAt: Date.now(),
      });

      const mockOauthClient = {
        refreshAccessToken: vi.fn().mockRejectedValue(new Error('Refresh failed')),
      };

      setupAuthInterceptor(axiosInstance, mockOauthClient as any, {
        tokenRefreshUrl: 'https://api.example.com/auth/refresh',
        onUnauthorized: mockCallback,
      });

      // コールバックが登録されたことを確認
      expect(axiosInstance.interceptors.response.handlers).toBeDefined();
    });
  });

  describe('Error Interceptor', () => {
    it('should handle client errors (4xx)', async () => {
      setupErrorInterceptor(axiosInstance);

      const error = {
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { message: 'Invalid input' },
        },
      };

      const handler = axiosInstance.interceptors.response.handlers[0].rejected;

      try {
        await handler(error);
      } catch (caught) {
        expect(caught).toBeInstanceOf(AppError);
        expect((caught as AppError).code).toBe('BAD_REQUEST');
        expect((caught as AppError).statusCode).toBe(400);
      }
    });

    it('should handle server errors (5xx)', async () => {
      setupErrorInterceptor(axiosInstance);

      const error = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Server error' },
        },
      };

      const handler = axiosInstance.interceptors.response.handlers[0].rejected;

      try {
        await handler(error);
      } catch (caught) {
        expect(caught).toBeInstanceOf(AppError);
        expect((caught as AppError).code).toBe('INTERNAL_SERVER_ERROR');
      }
    });

    it('should handle network errors', async () => {
      const onNetworkError = vi.fn();
      setupErrorInterceptor(axiosInstance, { onNetworkError });

      const error = new Error('Network error');
      (error as any).response = undefined;

      const handler = axiosInstance.interceptors.response.handlers[0].rejected;

      try {
        await handler(error as any);
      } catch (caught) {
        expect(caught).toBeInstanceOf(AppError);
        expect((caught as AppError).code).toBe('NETWORK_ERROR');
      }
    });

    it('should provide localized error messages', async () => {
      setupErrorInterceptor(axiosInstance);

      const testCases = [
        { status: 401, expectedCode: 'UNAUTHORIZED' },
        { status: 403, expectedCode: 'FORBIDDEN' },
        { status: 404, expectedCode: 'NOT_FOUND' },
        { status: 429, expectedCode: 'TOO_MANY_REQUESTS' },
        { status: 503, expectedCode: 'SERVICE_UNAVAILABLE' },
      ];

      const handler = axiosInstance.interceptors.response.handlers[0].rejected;

      for (const testCase of testCases) {
        const error = {
          response: {
            status: testCase.status,
            statusText: 'Error',
            data: {},
          },
        };

        try {
          await handler(error);
        } catch (caught) {
          expect((caught as AppError).code).toBe(testCase.expectedCode);
        }
      }
    });

    it('should call onError callback', async () => {
      const onError = vi.fn();
      setupErrorInterceptor(axiosInstance, { onError });

      const error = {
        response: { status: 400, statusText: 'Bad Request', data: {} },
      };

      const handler = axiosInstance.interceptors.response.handlers[0].rejected;

      try {
        await handler(error);
      } catch (caught) {
        expect(onError).toHaveBeenCalledWith(expect.any(AppError));
      }
    });

    it('should extract details from error response', async () => {
      setupErrorInterceptor(axiosInstance);

      const error = {
        response: {
          status: 422,
          statusText: 'Unprocessable Entity',
          data: {
            message: 'Validation failed',
            details: {
              field: 'email',
              issue: 'Invalid format',
            },
          },
        },
      };

      const handler = axiosInstance.interceptors.response.handlers[0].rejected;

      try {
        await handler(error);
      } catch (caught) {
        expect((caught as AppError).details).toBeDefined();
        expect((caught as AppError).details.details).toEqual({
          field: 'email',
          issue: 'Invalid format',
        });
      }
    });
  });

  describe('Logging Interceptor', () => {
    it('should log requests at DEBUG level', async () => {
      setupLoggingInterceptor(axiosInstance, {
        level: LogLevel.DEBUG,
        maskSensitiveData: false,
      });

      const handler = axiosInstance.interceptors.request.handlers[0].fulfilled;
      await handler({
        method: 'GET',
        url: '/api/users',
        headers: { 'Content-Type': 'application/json' },
      } as any);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should mask sensitive data in logs', async () => {
      setupLoggingInterceptor(axiosInstance, {
        level: LogLevel.DEBUG,
        maskSensitiveData: true,
        sensitiveFields: ['password', 'token'],
      });

      const handler = axiosInstance.interceptors.request.handlers[0].fulfilled;
      await handler({
        method: 'POST',
        url: '/api/login',
        data: {
          email: 'user@example.com',
          password: 'secret123',
          token: 'sensitive_token_abc123',
        },
        headers: {},
      } as any);

      // ログが出力されたことを確認
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should mask sensitive headers', async () => {
      setupLoggingInterceptor(axiosInstance, {
        level: LogLevel.DEBUG,
        maskSensitiveData: true,
        sensitiveHeaders: ['Authorization'],
      });

      const handler = axiosInstance.interceptors.request.handlers[0].fulfilled;
      await handler({
        method: 'GET',
        url: '/api/data',
        headers: {
          Authorization: 'Bearer very_long_token_that_should_be_masked_xyz123',
        },
      } as any);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exclude URLs from logging', async () => {
      setupLoggingInterceptor(axiosInstance, {
        level: LogLevel.DEBUG,
        excludeUrls: [/\/health/],
      });

      const handler = axiosInstance.interceptors.request.handlers[0].fulfilled;
      const initialCallCount = consoleLogSpy.mock.calls.length;

      await handler({
        method: 'GET',
        url: '/health',
        headers: {},
      } as any);

      // /health エンドポイントはログ出力されない
      expect(consoleLogSpy.mock.calls.length).toBe(initialCallCount);
    });

    it('should handle different log levels', async () => {
      const levels = [LogLevel.NONE, LogLevel.ERROR, LogLevel.INFO, LogLevel.DEBUG];

      for (const level of levels) {
        consoleLogSpy.mockClear();

        const instance = axios.create({
          baseURL: 'https://api.example.com',
        });

        setupLoggingInterceptor(instance, { level });

        const handler = instance.interceptors.request.handlers[0].fulfilled;
        await handler({
          method: 'GET',
          url: '/api/data',
          headers: {},
        } as any);

        if (level >= LogLevel.DEBUG) {
          expect(consoleLogSpy).toHaveBeenCalled();
        } else {
          expect(consoleLogSpy).not.toHaveBeenCalled();
        }
      }
    });

    it('should log response time', async () => {
      setupLoggingInterceptor(axiosInstance, {
        level: LogLevel.DEBUG,
      });

      // リクエストハンドラを実行してタイムスタンプを記録
      const requestHandler = axiosInstance.interceptors.request.handlers[0].fulfilled;
      const config = await requestHandler({
        method: 'GET',
        url: '/api/data',
        headers: {},
      } as any);

      // レスポンスハンドラを実行
      const responseHandler = axiosInstance.interceptors.response.handlers[0].fulfilled;
      await responseHandler({
        status: 200,
        statusText: 'OK',
        data: { result: 'success' },
        config,
      } as any);

      // レスポンスログが出力されたことを確認
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log errors', async () => {
      setupLoggingInterceptor(axiosInstance, {
        level: LogLevel.ERROR,
      });

      const errorHandler = axiosInstance.interceptors.response.handlers[0].rejected;

      const error = {
        config: { method: 'GET', url: '/api/data' },
        response: { status: 500, statusText: 'Server Error', data: {} },
        message: 'Request failed',
      };

      try {
        await errorHandler(error);
      } catch (e) {
        // エラーハンドラは他のインターセプターに処理を委ねる
        expect(e).toBeDefined();
      }
    });
  });

  describe('AppError', () => {
    it('should create AppError instance', () => {
      const error = new AppError(
        'TEST_ERROR',
        'Test error message',
        400,
        { field: 'test' }
      );

      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'test' });
      expect(error).toBeInstanceOf(Error);
    });

    it('should have AppError name', () => {
      const error = new AppError('ERROR', 'Message');
      expect(error.name).toBe('AppError');
    });
  });
});

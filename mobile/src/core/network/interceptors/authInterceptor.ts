/**
 * Auth Interceptor
 * リクエストに認証トークンを自動付与
 * 401エラー時にトークンをリフレッシュ
 */

import { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { SecureTokenStore } from '@/services/auth';
import { OAuth2Client } from '@/core/network/oauth';

/**
 * 認証インターセプターの設定
 */
export interface AuthInterceptorConfig {
  tokenRefreshUrl: string;
  excludeUrls?: RegExp[];
  onUnauthorized?: () => void;
  onTokenRefreshed?: (token: string) => void;
}

/**
 * トークンリフレッシュリクエスト中にキューされたリクエスト
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

/**
 * キューされたリクエストを処理
 */
const processQueue = (error: AxiosError | null, token?: string) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

/**
 * 認証インターセプターを設定
 */
export function setupAuthInterceptor(
  axiosInstance: AxiosInstance,
  oauthClient: OAuth2Client,
  config: AuthInterceptorConfig
): void {
  /**
   * リクエストインターセプター
   * すべてのリクエストに認証トークンを付与
   */
  axiosInstance.interceptors.request.use(
    async (requestConfig: AxiosRequestConfig) => {
      // 除外URL リストに含まれるかチェック
      if (config.excludeUrls?.some((regex) => regex.test(requestConfig.url || ''))) {
        return requestConfig;
      }

      try {
        // セキュアストレージからトークンを取得
        const token = await SecureTokenStore.getToken();

        if (token) {
          // Authorization ヘッダーに付与
          requestConfig.headers = requestConfig.headers || {};
          requestConfig.headers.Authorization = `Bearer ${token.accessToken}`;

          console.log('[Auth] Token attached to request');
        }
      } catch (error) {
        console.error('[Auth] Failed to get token:', error);
      }

      return requestConfig;
    },
    (error) => Promise.reject(error)
  );

  /**
   * レスポンスインターセプター
   * 401エラー時にトークンをリフレッシュ
   */
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // 除外URL リストに含まれるかチェック
      if (config.excludeUrls?.some((regex) => regex.test(originalRequest.url || ''))) {
        return Promise.reject(error);
      }

      // 401 エラーで、かつまだリトライしていないリクエスト
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          // トークンリフレッシュ中の場合、キューに追加
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            // リフレッシュ完了後、元のリクエストを再実行
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          });
        }

        isRefreshing = true;

        try {
          console.log('[Auth] Attempting to refresh token...');

          // トークンをリフレッシュ
          const newToken = await oauthClient.refreshAccessToken();

          // 新しいトークンをセキュアストレージに保存
          await SecureTokenStore.storeToken(newToken);

          console.log('[Auth] Token refreshed successfully');

          // キューされたリクエストを処理
          processQueue(null, newToken.accessToken);

          // コールバックを実行
          if (config.onTokenRefreshed) {
            config.onTokenRefreshed(newToken.accessToken);
          }

          // 元のリクエストを再実行
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken.accessToken}`;

          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error('[Auth] Token refresh failed:', refreshError);

          // リフレッシュ失敗時、キューを処理
          processQueue(refreshError as AxiosError, undefined);

          // コールバックを実行
          if (config.onUnauthorized) {
            config.onUnauthorized();
          }

          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
}

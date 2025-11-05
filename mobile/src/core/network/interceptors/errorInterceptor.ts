/**
 * Error Interceptor
 * ネットワークエラーを統一的に処理
 * APIエラーレスポンスをパース
 */

import { AxiosInstance, AxiosError } from 'axios';

/**
 * アプリケーション独自のエラー
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * エラーレスポンスの標準形式
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp?: number;
}

/**
 * エラーインターセプターの設定
 */
export interface ErrorInterceptorConfig {
  onError?: (error: AppError) => void;
  onNetworkError?: () => void;
  onServerError?: (error: AppError) => void;
  onClientError?: (error: AppError) => void;
}

/**
 * HTTP ステータスコードからエラーコードへのマッピング
 */
const statusCodeToErrorCode: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
};

/**
 * HTTP ステータスコードを判定
 */
const getErrorCategory = (status: number): 'client' | 'server' | 'network' => {
  if (status >= 400 && status < 500) return 'client';
  if (status >= 500 && status < 600) return 'server';
  return 'network';
};

/**
 * エラーメッセージを取得
 */
const getErrorMessage = (status: number, data: any): string => {
  // APIレスポンスにメッセージがある場合
  if (data?.message) {
    return data.message;
  }
  if (data?.error?.message) {
    return data.error.message;
  }

  // ステータスコードに基づくデフォルトメッセージ
  const defaultMessages: Record<number, string> = {
    400: 'リクエストが不正です',
    401: '認証が失敗しました',
    403: 'アクセス権がありません',
    404: 'リソースが見つかりません',
    409: 'リソースの競合が発生しました',
    422: '入力値の検証に失敗しました',
    429: 'リクエストが多すぎます。しばらく待ってからお試しください',
    500: 'サーバーエラーが発生しました',
    502: 'サーバーエラーが発生しました',
    503: 'サーバーはメンテナンス中です',
    504: 'サーバーの応答がタイムアウトしました',
  };

  return defaultMessages[status] || 'エラーが発生しました';
};

/**
 * エラーインターセプターを設定
 */
export function setupErrorInterceptor(
  axiosInstance: AxiosInstance,
  config: ErrorInterceptorConfig = {}
): void {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      console.error('[Error Interceptor]', error.message);

      let appError: AppError;

      // ネットワークエラー（レスポンスがない場合）
      if (!error.response) {
        console.error('[Network Error]', error.message);

        appError = new AppError(
          'NETWORK_ERROR',
          error.message || 'ネットワークに接続できません',
          undefined,
          error
        );

        if (config.onNetworkError) {
          config.onNetworkError();
        }
      } else {
        const status = error.response.status;
        const data = error.response.data as any;

        // エラーコードを取得
        const errorCode = statusCodeToErrorCode[status] || 'UNKNOWN_ERROR';

        // エラーメッセージを取得
        const errorMessage = getErrorMessage(status, data);

        appError = new AppError(
          errorCode,
          errorMessage,
          status,
          data?.details || data
        );

        console.error(`[HTTP ${status}]`, {
          code: errorCode,
          message: errorMessage,
          data,
        });

        // ステータスコードに基づくコールバック実行
        const category = getErrorCategory(status);
        if (category === 'server' && config.onServerError) {
          config.onServerError(appError);
        } else if (category === 'client' && config.onClientError) {
          config.onClientError(appError);
        }
      }

      // 一般的なエラーコールバック
      if (config.onError) {
        config.onError(appError);
      }

      return Promise.reject(appError);
    }
  );
}

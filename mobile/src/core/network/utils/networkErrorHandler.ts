/**
 * Network Error Handler
 * ネットワークエラーの詳細な処理と復旧戦略
 */

import { AppError } from '@/core/network/interceptors';

/**
 * ネットワークエラー復旧戦略
 */
export enum ErrorRecoveryStrategy {
  RETRY = 'RETRY',              // リトライ
  REFRESH_TOKEN = 'REFRESH_TOKEN', // トークンリフレッシュ
  REFRESH_DATA = 'REFRESH_DATA',  // データを再取得
  OFFLINE_MODE = 'OFFLINE_MODE',  // オフラインモード
  LOGIN_REQUIRED = 'LOGIN_REQUIRED', // ログイン必須
  RATE_LIMIT_WAIT = 'RATE_LIMIT_WAIT', // レート制限待機
  RETRY_LATER = 'RETRY_LATER',   // 後でリトライ
  SHOW_ERROR = 'SHOW_ERROR',     // エラー表示
}

/**
 * エラーハンドラの設定
 */
export interface ErrorHandlerConfig {
  maxRetries: number;
  initialRetryDelay: number;
  maxRetryDelay: number;
  backoffMultiplier: number;
  onUnauthorized?: () => void;
  onForbidden?: () => void;
  onRateLimited?: (retryAfter?: number) => void;
  onServerError?: () => void;
  onNetworkError?: () => void;
  onOfflineDetected?: () => void;
}

/**
 * リトライ試行情報
 */
export interface RetryContext {
  attempt: number;
  maxRetries: number;
  nextRetryDelay: number;
  error: AppError | Error;
}

/**
 * ネットワークエラーハンドラ
 */
export class NetworkErrorHandler {
  private config: ErrorHandlerConfig;
  private retryContexts: Map<string, RetryContext> = new Map();

  constructor(config: ErrorHandlerConfig) {
    this.config = {
      maxRetries: 3,
      initialRetryDelay: 1000,
      maxRetryDelay: 30000,
      backoffMultiplier: 2,
      ...config,
    };
  }

  /**
   * エラーに対する復旧戦略を判定
   */
  getRecoveryStrategy(error: AppError | Error): ErrorRecoveryStrategy {
    if (!(error instanceof AppError)) {
      return ErrorRecoveryStrategy.SHOW_ERROR;
    }

    switch (error.code) {
      // 401: トークン期限切れ
      case 'UNAUTHORIZED':
        return ErrorRecoveryStrategy.REFRESH_TOKEN;

      // 403: 権限なし
      case 'FORBIDDEN':
        return ErrorRecoveryStrategy.LOGIN_REQUIRED;

      // 404: リソース削除済み
      case 'NOT_FOUND':
        return ErrorRecoveryStrategy.REFRESH_DATA;

      // 409: リソース競合
      case 'CONFLICT':
        return ErrorRecoveryStrategy.REFRESH_DATA;

      // 429: レート制限
      case 'TOO_MANY_REQUESTS':
        return ErrorRecoveryStrategy.RATE_LIMIT_WAIT;

      // 503: サービス利用不可
      case 'SERVICE_UNAVAILABLE':
        return ErrorRecoveryStrategy.RETRY_LATER;

      // 5xx: サーバーエラー
      case 'INTERNAL_SERVER_ERROR':
      case 'BAD_GATEWAY':
      case 'GATEWAY_TIMEOUT':
        return ErrorRecoveryStrategy.RETRY;

      // ネットワークエラー
      case 'NETWORK_ERROR':
        return ErrorRecoveryStrategy.OFFLINE_MODE;

      default:
        return ErrorRecoveryStrategy.SHOW_ERROR;
    }
  }

  /**
   * リトライ可能かチェック
   */
  isRetryable(error: AppError | Error): boolean {
    if (!(error instanceof AppError)) {
      return false;
    }

    // リトライ可能なエラーコード
    const retryableErrors = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'INTERNAL_SERVER_ERROR',
      'BAD_GATEWAY',
      'GATEWAY_TIMEOUT',
      'SERVICE_UNAVAILABLE',
    ];

    return retryableErrors.includes(error.code);
  }

  /**
   * リトライ遅延を計算（エクスポーネンシャルバックオフ）
   */
  calculateRetryDelay(attempt: number): number {
    // 遅延 = initialDelay * (backoffMultiplier ^ attempt) + ジッター
    const exponentialDelay =
      this.config.initialRetryDelay *
      Math.pow(this.config.backoffMultiplier, attempt);

    // ジッター（±20%）を追加
    const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
    const delay = Math.max(0, exponentialDelay + jitter);

    // 最大遅延を超えないように制限
    return Math.min(delay, this.config.maxRetryDelay);
  }

  /**
   * リトライコンテキストを作成
   */
  createRetryContext(error: AppError | Error, attemptNumber: number = 0): RetryContext {
    return {
      attempt: attemptNumber,
      maxRetries: this.config.maxRetries,
      nextRetryDelay: this.calculateRetryDelay(attemptNumber),
      error,
    };
  }

  /**
   * リトライ可能かチェック（試行回数ベース）
   */
  shouldRetry(context: RetryContext): boolean {
    return context.attempt < context.maxRetries && this.isRetryable(context.error);
  }

  /**
   * Retry-After ヘッダーからリトライ遅延を取得
   */
  getRetryAfterDelay(error: AppError): number | null {
    if (error.code !== 'TOO_MANY_REQUESTS') {
      return null;
    }

    const retryAfter = error.details?.['retry-after'];
    if (!retryAfter) {
      return null;
    }

    // Retry-After は秒単位
    const delaySeconds = parseInt(retryAfter, 10);
    return isNaN(delaySeconds) ? null : delaySeconds * 1000;
  }

  /**
   * エラーに対するコールバックを実行
   */
  async handleError(error: AppError): Promise<void> {
    switch (error.code) {
      case 'UNAUTHORIZED':
        if (this.config.onUnauthorized) {
          this.config.onUnauthorized();
        }
        break;

      case 'FORBIDDEN':
        if (this.config.onForbidden) {
          this.config.onForbidden();
        }
        break;

      case 'TOO_MANY_REQUESTS':
        const retryAfter = this.getRetryAfterDelay(error);
        if (this.config.onRateLimited) {
          this.config.onRateLimited(retryAfter || undefined);
        }
        break;

      case 'INTERNAL_SERVER_ERROR':
      case 'BAD_GATEWAY':
      case 'GATEWAY_TIMEOUT':
      case 'SERVICE_UNAVAILABLE':
        if (this.config.onServerError) {
          this.config.onServerError();
        }
        break;

      case 'NETWORK_ERROR':
        if (this.config.onNetworkError) {
          this.config.onNetworkError();
        }
        if (this.config.onOfflineDetected) {
          this.config.onOfflineDetected();
        }
        break;
    }
  }

  /**
   * 遅延を待機（キャンセル可能）
   */
  async waitWithCancellation(
    delayMs: number,
    signal?: AbortSignal
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(resolve, delayMs);

      if (signal) {
        if (signal.aborted) {
          clearTimeout(timeoutId);
          reject(new Error('Cancelled'));
        }

        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Cancelled'));
        });
      }
    });
  }

  /**
   * リトライコンテキストを保存
   */
  saveRetryContext(key: string, context: RetryContext): void {
    this.retryContexts.set(key, context);
  }

  /**
   * リトライコンテキストを取得
   */
  getRetryContext(key: string): RetryContext | undefined {
    return this.retryContexts.get(key);
  }

  /**
   * リトライコンテキストをクリア
   */
  clearRetryContext(key: string): void {
    this.retryContexts.delete(key);
  }

  /**
   * すべてのリトライコンテキストをクリア
   */
  clearAllRetryContexts(): void {
    this.retryContexts.clear();
  }
}

/**
 * グローバルなネットワークエラーハンドラインスタンス
 */
let globalErrorHandler: NetworkErrorHandler | null = null;

/**
 * グローバルエラーハンドラを初期化
 */
export function initializeGlobalErrorHandler(config: ErrorHandlerConfig): NetworkErrorHandler {
  globalErrorHandler = new NetworkErrorHandler(config);
  return globalErrorHandler;
}

/**
 * グローバルエラーハンドラを取得
 */
export function getGlobalErrorHandler(): NetworkErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new NetworkErrorHandler({
      maxRetries: 3,
      initialRetryDelay: 1000,
      maxRetryDelay: 30000,
      backoffMultiplier: 2,
    });
  }
  return globalErrorHandler;
}

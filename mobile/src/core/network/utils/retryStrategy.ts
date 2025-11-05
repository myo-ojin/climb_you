/**
 * Retry Strategy
 * リトライロジック実装
 * - エクスポーネンシャルバックオフ
 * - ジッター付きリトライ
 * - リトライ履歴追跡
 */

import { AppError } from '@/core/network/interceptors';

/**
 * リトライ戦略の種類
 */
export enum RetryStrategyType {
  EXPONENTIAL = 'EXPONENTIAL',  // エクスポーネンシャルバックオフ
  LINEAR = 'LINEAR',             // リニアバックオフ
  FIXED = 'FIXED',               // 固定遅延
  NONE = 'NONE',                 // リトライなし
}

/**
 * リトライ設定
 */
export interface RetryConfig {
  strategy: RetryStrategyType;
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
  jitterFactor: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

/**
 * リトライ試行の情報
 */
export interface RetryAttempt {
  attempt: number;
  timestamp: number;
  error: Error | null;
  delayMs: number;
}

/**
 * リトライ実行結果
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: RetryAttempt[];
  totalDuration: number;
}

/**
 * リトライ戦略実装
 */
export class RetryStrategy {
  private config: RetryConfig;
  private attempts: RetryAttempt[] = [];

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      strategy: RetryStrategyType.EXPONENTIAL,
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      multiplier: 2,
      jitterFactor: 0.1,
      ...config,
    };
  }

  /**
   * 遅延を計算
   */
  calculateDelay(attempt: number): number {
    let delay: number;

    switch (this.config.strategy) {
      case RetryStrategyType.EXPONENTIAL:
        // initialDelay * (multiplier ^ attempt)
        delay =
          this.config.initialDelay *
          Math.pow(this.config.multiplier, attempt);
        break;

      case RetryStrategyType.LINEAR:
        // initialDelay * (attempt + 1)
        delay = this.config.initialDelay * (attempt + 1);
        break;

      case RetryStrategyType.FIXED:
        // 固定遅延
        delay = this.config.initialDelay;
        break;

      case RetryStrategyType.NONE:
        return 0;

      default:
        delay = this.config.initialDelay;
    }

    // ジッターを追加
    const jitter =
      delay * this.config.jitterFactor * (Math.random() * 2 - 1);
    const delayWithJitter = Math.max(0, delay + jitter);

    // 最大遅延を超えないように制限
    return Math.min(delayWithJitter, this.config.maxDelay);
  }

  /**
   * リトライが可能か判定
   */
  shouldRetry(error: any, attempt: number): boolean {
    // ユーザー定義の判定関数を使用
    if (this.config.shouldRetry) {
      return this.config.shouldRetry(error, attempt);
    }

    // デフォルト: 最大試行回数未満
    if (attempt >= this.config.maxAttempts) {
      return false;
    }

    // AppError の場合、リトライ可能なエラーをチェック
    if (error instanceof AppError) {
      const retryableErrors = [
        'NETWORK_ERROR',
        'TIMEOUT',
        'INTERNAL_SERVER_ERROR',
        'BAD_GATEWAY',
        'GATEWAY_TIMEOUT',
      ];
      return retryableErrors.includes(error.code);
    }

    // その他のエラーはリトライ可能
    return true;
  }

  /**
   * 関数をリトライで実行
   */
  async execute<T>(
    fn: (attempt: number) => Promise<T>
  ): Promise<RetryResult<T>> {
    this.attempts = [];
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxAttempts; attempt++) {
      const attemptStartTime = Date.now();

      try {
        console.log(`[Retry] Attempt ${attempt + 1}/${this.config.maxAttempts}`);

        const result = await fn(attempt);

        this.attempts.push({
          attempt,
          timestamp: attemptStartTime,
          error: null,
          delayMs: 0,
        });

        console.log(`[Retry] Success on attempt ${attempt + 1}`);

        return {
          success: true,
          result,
          attempts: this.attempts,
          totalDuration: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // リトライが可能か判定
        if (!this.shouldRetry(error, attempt + 1)) {
          console.log(`[Retry] Not retryable, error: ${lastError.message}`);

          this.attempts.push({
            attempt,
            timestamp: attemptStartTime,
            error: lastError,
            delayMs: 0,
          });

          return {
            success: false,
            error: lastError,
            attempts: this.attempts,
            totalDuration: Date.now() - startTime,
          };
        }

        // 遅延を計算
        const delay = this.calculateDelay(attempt);

        this.attempts.push({
          attempt,
          timestamp: attemptStartTime,
          error: lastError,
          delayMs: delay,
        });

        console.log(
          `[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${lastError.message}`
        );

        // 遅延を待機
        await this.wait(delay);
      }
    }

    // 最大試行回数に達した
    console.log(
      `[Retry] Max attempts reached, last error: ${lastError?.message}`
    );

    return {
      success: false,
      error: lastError || new Error('Max retry attempts exceeded'),
      attempts: this.attempts,
      totalDuration: Date.now() - startTime,
    };
  }

  /**
   * 遅延を待機
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 試行履歴を取得
   */
  getAttempts(): RetryAttempt[] {
    return [...this.attempts];
  }

  /**
   * 試行履歴をクリア
   */
  clearAttempts(): void {
    this.attempts = [];
  }

  /**
   * 統計情報を取得
   */
  getStats(): {
    totalAttempts: number;
    successAttempt: number | null;
    totalDuration: number;
    averageDelay: number;
  } {
    const totalAttempts = this.attempts.length;
    const successAttempt = this.attempts.findIndex((a) => a.error === null);
    const totalDuration =
      this.attempts.length > 0
        ? this.attempts[this.attempts.length - 1].timestamp -
          this.attempts[0].timestamp
        : 0;
    const totalDelay = this.attempts.reduce((sum, a) => sum + a.delayMs, 0);
    const averageDelay =
      this.attempts.length > 0 ? totalDelay / this.attempts.length : 0;

    return {
      totalAttempts,
      successAttempt: successAttempt >= 0 ? successAttempt : null,
      totalDuration,
      averageDelay,
    };
  }
}

/**
 * 便利な関数: リトライ付きで関数を実行
 */
export async function executeWithRetry<T>(
  fn: (attempt: number) => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const strategy = new RetryStrategy(config);
  const result = await strategy.execute(fn);

  if (result.success) {
    return result.result as T;
  }

  throw result.error;
}

/**
 * 便利な関数: API呼び出しをリトライ
 */
export async function retryApiCall<T>(
  apiFunction: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  return executeWithRetry(
    async () => {
      return apiFunction();
    },
    {
      strategy: RetryStrategyType.EXPONENTIAL,
      maxAttempts,
      initialDelay,
      maxDelay: 30000,
      multiplier: 2,
    }
  );
}

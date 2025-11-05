/**
 * Logging Interceptor
 * リクエスト/レスポンスをログ出力
 * 本番環境ではセンシティブ情報をマスク
 */

import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * ログレベル
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

/**
 * ログインターセプターの設定
 */
export interface LoggingInterceptorConfig {
  level: LogLevel;
  maskSensitiveData: boolean;
  excludeUrls?: RegExp[];
  sensitiveHeaders?: string[];
  sensitiveFields?: string[];
}

/**
 * デフォルト設定
 */
const defaultConfig: LoggingInterceptorConfig = {
  level: LogLevel.INFO,
  maskSensitiveData: true,
  sensitiveHeaders: ['Authorization', 'X-API-Key', 'Cookie'],
  sensitiveFields: ['password', 'token', 'secret', 'accessToken', 'refreshToken'],
};

/**
 * センシティブデータをマスク
 */
function maskSensitiveData(
  data: any,
  sensitiveFields: string[],
  maxLength: number = 8
): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const masked = { ...data };

  for (const [key, value] of Object.entries(masked)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      if (typeof value === 'string' && value.length > maxLength) {
        masked[key] = value.substring(0, maxLength) + '***';
      } else if (typeof value === 'string') {
        masked[key] = '***';
      }
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value, sensitiveFields, maxLength);
    }
  }

  return masked;
}

/**
 * ヘッダーをマスク
 */
function maskHeaders(
  headers: any,
  sensitiveHeaders: string[]
): Record<string, any> {
  const masked: Record<string, any> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.some((header) => key.toLowerCase().includes(header.toLowerCase()))) {
      masked[key] = typeof value === 'string' ? value.substring(0, 8) + '***' : '***';
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * リクエストを人間が読みやすい形式にフォーマット
 */
function formatRequest(
  config: AxiosRequestConfig,
  maskSensitive: boolean,
  sensitiveHeaders: string[],
  sensitiveFields: string[]
): string {
  const { method = 'GET', url, params, data, headers } = config;

  let output = `\n[REQUEST] ${method} ${url}`;

  // パラメータ
  if (params) {
    const maskedParams = maskSensitive
      ? maskSensitiveData(params, sensitiveFields)
      : params;
    output += `\n  Params: ${JSON.stringify(maskedParams, null, 2)}`;
  }

  // リクエストボディ
  if (data) {
    const maskedData = maskSensitive
      ? maskSensitiveData(data, sensitiveFields)
      : data;
    output += `\n  Body: ${JSON.stringify(maskedData, null, 2)}`;
  }

  // ヘッダー
  if (headers) {
    const maskedHeaders = maskSensitive
      ? maskHeaders(headers, sensitiveHeaders)
      : headers;
    output += `\n  Headers: ${JSON.stringify(maskedHeaders, null, 2)}`;
  }

  return output;
}

/**
 * レスポンスを人間が読みやすい形式にフォーマット
 */
function formatResponse(
  response: AxiosResponse,
  maskSensitive: boolean,
  sensitiveFields: string[],
  durationMs: number
): string {
  const { status, statusText, data } = response;

  let output = `\n[RESPONSE] ${status} ${statusText} (${durationMs}ms)`;

  // レスポンスボディ
  if (data) {
    const maskedData = maskSensitive
      ? maskSensitiveData(data, sensitiveFields)
      : data;
    output += `\n  Body: ${JSON.stringify(maskedData, null, 2)}`;
  }

  return output;
}

/**
 * ログインターセプターを設定
 */
export function setupLoggingInterceptor(
  axiosInstance: AxiosInstance,
  configOverride?: Partial<LoggingInterceptorConfig>
): void {
  const config = { ...defaultConfig, ...configOverride };

  // リクエスト開始時刻を保存するシンボル
  const requestTimeSymbol = Symbol('requestTime');

  /**
   * リクエストインターセプター
   */
  axiosInstance.interceptors.request.use(
    (requestConfig: any) => {
      // 除外URL リストに含まれるかチェック
      if (config.excludeUrls?.some((regex) => regex.test(requestConfig.url || ''))) {
        return requestConfig;
      }

      // リクエスト開始時刻を記録
      requestConfig[requestTimeSymbol] = Date.now();

      if (config.level >= LogLevel.DEBUG) {
        const logOutput = formatRequest(
          requestConfig,
          config.maskSensitiveData,
          config.sensitiveHeaders || [],
          config.sensitiveFields || []
        );
        console.log(logOutput);
      }

      return requestConfig;
    },
    (error) => Promise.reject(error)
  );

  /**
   * レスポンスインターセプター
   */
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse & { config: any }) => {
      // 除外URL リストに含まれるかチェック
      if (config.excludeUrls?.some((regex) => regex.test(response.config.url || ''))) {
        return response;
      }

      const durationMs =
        Date.now() - (response.config[requestTimeSymbol] || Date.now());

      if (config.level >= LogLevel.DEBUG) {
        const logOutput = formatResponse(
          response,
          config.maskSensitiveData,
          config.sensitiveFields || [],
          durationMs
        );
        console.log(logOutput);
      } else if (config.level >= LogLevel.INFO) {
        console.log(
          `[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${durationMs}ms)`
        );
      }

      return response;
    },
    (error: any) => {
      // 除外URL リストに含まれるかチェック
      if (config.excludeUrls?.some((regex) => regex.test(error.config?.url || ''))) {
        return Promise.reject(error);
      }

      const durationMs =
        Date.now() - (error.config?.[requestTimeSymbol] || Date.now());

      if (config.level >= LogLevel.ERROR) {
        let logOutput = `\n[ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}`;

        if (error.response) {
          logOutput += ` - ${error.response.status} ${error.response.statusText} (${durationMs}ms)`;
          logOutput += `\n  Error: ${JSON.stringify(error.response.data, null, 2)}`;
        } else {
          logOutput += ` - ${error.message} (${durationMs}ms)`;
        }

        console.error(logOutput);
      }

      return Promise.reject(error);
    }
  );
}

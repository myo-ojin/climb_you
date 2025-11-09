/**
 * セキュリティ設定
 *
 * 本番環境とそれ以外の環境でセキュリティ設定を切り替える
 */

import Constants from 'expo-constants';

/**
 * 環境タイプ
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * 現在の環境を取得
 */
export const getEnvironment = (): Environment => {
  const env = Constants.expoConfig?.extra?.eas?.environment ||
               process.env.APP_ENV ||
               'development';
  return env as Environment;
};

/**
 * 本番環境かどうかを判定
 */
export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

/**
 * 開発環境かどうかを判定
 */
export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};

/**
 * デバッグモードが有効かどうかを判定
 */
export const isDebugMode = (): boolean => {
  // 本番環境では常にfalse
  if (isProduction()) {
    return false;
  }
  return __DEV__;
};

/**
 * 環境別設定
 */
interface EnvironmentConfig {
  apiBaseUrl: string;
  mcpServerUrl: string;
  enableLogging: boolean;
  enableDebugInfo: boolean;
  enableNetworkInspector: boolean;
  timeout: number;
}

const developmentConfig: EnvironmentConfig = {
  apiBaseUrl: 'http://localhost:3000/api',
  mcpServerUrl: 'http://localhost:3001',
  enableLogging: true,
  enableDebugInfo: true,
  enableNetworkInspector: true,
  timeout: 30000,
};

const stagingConfig: EnvironmentConfig = {
  apiBaseUrl: 'https://staging-api.climbyou.com/api',
  mcpServerUrl: 'https://staging-mcp.climbyou.com',
  enableLogging: true,
  enableDebugInfo: true,
  enableNetworkInspector: false,
  timeout: 30000,
};

const productionConfig: EnvironmentConfig = {
  apiBaseUrl: 'https://api.climbyou.com/api',
  mcpServerUrl: 'https://mcp.climbyou.com',
  enableLogging: false,
  enableDebugInfo: false,
  enableNetworkInspector: false,
  timeout: 20000,
};

/**
 * 環境設定を取得
 */
export const getConfig = (): EnvironmentConfig => {
  const env = getEnvironment();
  switch (env) {
    case 'production':
      return productionConfig;
    case 'staging':
      return stagingConfig;
    case 'development':
    default:
      return developmentConfig;
  }
};

/**
 * セキュリティヘッダー設定
 */
export const getSecurityHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-App-Version': Constants.expoConfig?.version || '1.0.0',
    'X-Platform': Constants.platform?.ios ? 'ios' : 'android',
  };

  // 本番環境では追加のセキュリティヘッダーを設定
  if (isProduction()) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
  }

  return headers;
};

/**
 * Certificate Pinning設定
 *
 * 本番環境では証明書ピンニングを有効化
 * IMPORTANT: 実際の証明書の公開鍵ハッシュに置き換える必要があります
 */
export interface CertificatePinningConfig {
  enabled: boolean;
  publicKeyHashes?: string[];
}

export const getCertificatePinningConfig = (): CertificatePinningConfig => {
  if (isProduction()) {
    return {
      enabled: true,
      // TODO: 実際の証明書の公開鍵ハッシュに置き換える
      // openssl s_client -connect api.climbyou.com:443 | openssl x509 -pubkey -noout | openssl rsa -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
      publicKeyHashes: [
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // プレースホルダー
      ],
    };
  }
  return {
    enabled: false,
  };
};

/**
 * HTTPSを強制するかどうか
 */
export const enforceHttps = (): boolean => {
  return isProduction();
};

/**
 * ログ出力
 *
 * 本番環境ではログを出力しない
 */
export const secureLog = {
  debug: (...args: unknown[]): void => {
    if (!isProduction() && getConfig().enableLogging) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (!isProduction() && getConfig().enableLogging) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (getConfig().enableLogging) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: unknown[]): void => {
    // エラーは本番環境でも記録（Crashlyticsなどに送信）
    console.error('[ERROR]', ...args);
  },
};

/**
 * デバッグ情報の表示設定
 */
export const shouldShowDebugInfo = (): boolean => {
  return getConfig().enableDebugInfo;
};

/**
 * ネットワークインスペクターの有効化設定
 */
export const shouldEnableNetworkInspector = (): boolean => {
  return getConfig().enableNetworkInspector;
};

/**
 * セキュリティ設定のエクスポート
 */
export const securityConfig = {
  getEnvironment,
  isProduction,
  isDevelopment,
  isDebugMode,
  getConfig,
  getSecurityHeaders,
  getCertificatePinningConfig,
  enforceHttps,
  secureLog,
  shouldShowDebugInfo,
  shouldEnableNetworkInspector,
};

export default securityConfig;

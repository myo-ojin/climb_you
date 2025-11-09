/**
 * Security Configuration Tests
 * セキュリティ設定のユニットテスト
 */

import {
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
} from '../security';

// Constants mock
jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.0',
    extra: {
      eas: {
        environment: 'development',
      },
    },
  },
  platform: {
    ios: false,
  },
}));

describe('Security Configuration', () => {
  const originalEnv = process.env.APP_ENV;
  const originalDev = (global as any).__DEV__;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env.APP_ENV = originalEnv;
    (global as any).__DEV__ = originalDev;
  });

  afterAll(() => {
    process.env.APP_ENV = originalEnv;
    (global as any).__DEV__ = originalDev;
  });

  describe('getEnvironment', () => {
    it('APP_ENVからEnvironmentを取得できること', () => {
      process.env.APP_ENV = 'production';
      expect(getEnvironment()).toBe('production');
    });

    it('APP_ENVがない場合はdevelopmentを返すこと', () => {
      delete process.env.APP_ENV;
      expect(getEnvironment()).toBe('development');
    });

    it('stagingEnvironmentを返せること', () => {
      process.env.APP_ENV = 'staging';
      expect(getEnvironment()).toBe('staging');
    });
  });

  describe('isProduction', () => {
    it('本番環境の場合trueを返すこと', () => {
      process.env.APP_ENV = 'production';
      expect(isProduction()).toBe(true);
    });

    it('開発環境の場合falseを返すこと', () => {
      process.env.APP_ENV = 'development';
      expect(isProduction()).toBe(false);
    });

    it('staging環境の場合falseを返すこと', () => {
      process.env.APP_ENV = 'staging';
      expect(isProduction()).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('開発環境の場合trueを返すこと', () => {
      process.env.APP_ENV = 'development';
      expect(isDevelopment()).toBe(true);
    });

    it('本番環境の場合falseを返すこと', () => {
      process.env.APP_ENV = 'production';
      expect(isDevelopment()).toBe(false);
    });
  });

  describe('isDebugMode', () => {
    it('本番環境では常にfalseを返すこと', () => {
      process.env.APP_ENV = 'production';
      (global as any).__DEV__ = true;
      expect(isDebugMode()).toBe(false);
    });

    it('開発環境で__DEV__がtrueの場合trueを返すこと', () => {
      process.env.APP_ENV = 'development';
      (global as any).__DEV__ = true;
      expect(isDebugMode()).toBe(true);
    });

    it('開発環境で__DEV__がfalseの場合falseを返すこと', () => {
      process.env.APP_ENV = 'development';
      (global as any).__DEV__ = false;
      expect(isDebugMode()).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('開発環境の設定を返すこと', () => {
      process.env.APP_ENV = 'development';
      const config = getConfig();

      expect(config.apiBaseUrl).toBe('http://localhost:3000/api');
      expect(config.mcpServerUrl).toBe('http://localhost:3001');
      expect(config.enableLogging).toBe(true);
      expect(config.enableDebugInfo).toBe(true);
      expect(config.enableNetworkInspector).toBe(true);
      expect(config.timeout).toBe(30000);
    });

    it('staging環境の設定を返すこと', () => {
      process.env.APP_ENV = 'staging';
      const config = getConfig();

      expect(config.apiBaseUrl).toBe('https://staging-api.climbyou.com/api');
      expect(config.mcpServerUrl).toBe('https://staging-mcp.climbyou.com');
      expect(config.enableLogging).toBe(true);
      expect(config.enableDebugInfo).toBe(true);
      expect(config.enableNetworkInspector).toBe(false);
      expect(config.timeout).toBe(30000);
    });

    it('本番環境の設定を返すこと', () => {
      process.env.APP_ENV = 'production';
      const config = getConfig();

      expect(config.apiBaseUrl).toBe('https://api.climbyou.com/api');
      expect(config.mcpServerUrl).toBe('https://mcp.climbyou.com');
      expect(config.enableLogging).toBe(false);
      expect(config.enableDebugInfo).toBe(false);
      expect(config.enableNetworkInspector).toBe(false);
      expect(config.timeout).toBe(20000);
    });
  });

  describe('getSecurityHeaders', () => {
    it('基本的なセキュリティヘッダーを返すこと', () => {
      const headers = getSecurityHeaders();

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-App-Version']).toBeDefined();
      expect(headers['X-Platform']).toBeDefined();
    });

    it('本番環境では追加のセキュリティヘッダーを含むこと', () => {
      process.env.APP_ENV = 'production';
      const headers = getSecurityHeaders();

      expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
    });

    it('開発環境では追加のセキュリティヘッダーを含まないこと', () => {
      process.env.APP_ENV = 'development';
      const headers = getSecurityHeaders();

      expect(headers['Strict-Transport-Security']).toBeUndefined();
      expect(headers['X-Content-Type-Options']).toBeUndefined();
      expect(headers['X-Frame-Options']).toBeUndefined();
    });
  });

  describe('getCertificatePinningConfig', () => {
    it('本番環境ではCertificate Pinningを有効化すること', () => {
      process.env.APP_ENV = 'production';
      const config = getCertificatePinningConfig();

      expect(config.enabled).toBe(true);
      expect(config.publicKeyHashes).toBeDefined();
      expect(Array.isArray(config.publicKeyHashes)).toBe(true);
    });

    it('開発環境ではCertificate Pinningを無効化すること', () => {
      process.env.APP_ENV = 'development';
      const config = getCertificatePinningConfig();

      expect(config.enabled).toBe(false);
      expect(config.publicKeyHashes).toBeUndefined();
    });

    it('staging環境ではCertificate Pinningを無効化すること', () => {
      process.env.APP_ENV = 'staging';
      const config = getCertificatePinningConfig();

      expect(config.enabled).toBe(false);
    });
  });

  describe('enforceHttps', () => {
    it('本番環境ではtrueを返すこと', () => {
      process.env.APP_ENV = 'production';
      expect(enforceHttps()).toBe(true);
    });

    it('開発環境ではfalseを返すこと', () => {
      process.env.APP_ENV = 'development';
      expect(enforceHttps()).toBe(false);
    });

    it('staging環境ではfalseを返すこと', () => {
      process.env.APP_ENV = 'staging';
      expect(enforceHttps()).toBe(false);
    });
  });

  describe('secureLog', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'info').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('開発環境ではdebugログを出力すること', () => {
      process.env.APP_ENV = 'development';
      secureLog.debug('test message');

      expect(console.log).toHaveBeenCalledWith('[DEBUG]', 'test message');
    });

    it('本番環境ではdebugログを出力しないこと', () => {
      process.env.APP_ENV = 'production';
      secureLog.debug('test message');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('開発環境ではinfoログを出力すること', () => {
      process.env.APP_ENV = 'development';
      secureLog.info('test message');

      expect(console.info).toHaveBeenCalledWith('[INFO]', 'test message');
    });

    it('本番環境ではinfoログを出力しないこと', () => {
      process.env.APP_ENV = 'production';
      secureLog.info('test message');

      expect(console.info).not.toHaveBeenCalled();
    });

    it('開発環境ではwarnログを出力すること', () => {
      process.env.APP_ENV = 'development';
      secureLog.warn('test warning');

      expect(console.warn).toHaveBeenCalledWith('[WARN]', 'test warning');
    });

    it('本番環境でもwarnログは出力しないこと（loggingが無効）', () => {
      process.env.APP_ENV = 'production';
      secureLog.warn('test warning');

      // 本番環境ではenableLogging=falseなので出力されない
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('全環境でerrorログを出力すること', () => {
      process.env.APP_ENV = 'production';
      secureLog.error('test error');

      expect(console.error).toHaveBeenCalledWith('[ERROR]', 'test error');

      jest.clearAllMocks();

      process.env.APP_ENV = 'development';
      secureLog.error('test error 2');

      expect(console.error).toHaveBeenCalledWith('[ERROR]', 'test error 2');
    });
  });

  describe('shouldShowDebugInfo', () => {
    it('開発環境ではtrueを返すこと', () => {
      process.env.APP_ENV = 'development';
      expect(shouldShowDebugInfo()).toBe(true);
    });

    it('本番環境ではfalseを返すこと', () => {
      process.env.APP_ENV = 'production';
      expect(shouldShowDebugInfo()).toBe(false);
    });

    it('staging環境ではtrueを返すこと', () => {
      process.env.APP_ENV = 'staging';
      expect(shouldShowDebugInfo()).toBe(true);
    });
  });

  describe('shouldEnableNetworkInspector', () => {
    it('開発環境ではtrueを返すこと', () => {
      process.env.APP_ENV = 'development';
      expect(shouldEnableNetworkInspector()).toBe(true);
    });

    it('本番環境ではfalseを返すこと', () => {
      process.env.APP_ENV = 'production';
      expect(shouldEnableNetworkInspector()).toBe(false);
    });

    it('staging環境ではfalseを返すこと', () => {
      process.env.APP_ENV = 'staging';
      expect(shouldEnableNetworkInspector()).toBe(false);
    });
  });
});

/**
 * NetworkErrorHandler Basic Tests
 * ネットワークエラーハンドラーの基本テスト
 */

import { NetworkErrorHandler, ErrorRecoveryStrategy } from '../networkErrorHandler';
import { AppError } from '@/core/network/interceptors';

describe('NetworkErrorHandler - Basic Tests', () => {
  let handler: NetworkErrorHandler;

  beforeEach(() => {
    handler = new NetworkErrorHandler({
      maxRetries: 3,
      initialRetryDelay: 1000,
      maxRetryDelay: 30000,
      backoffMultiplier: 2,
    });
  });

  describe('constructor', () => {
    it('インスタンスを作成できること', () => {
      expect(handler).toBeInstanceOf(NetworkErrorHandler);
    });

    it('デフォルト設定でインスタンスを作成できること', () => {
      const defaultHandler = new NetworkErrorHandler({
        maxRetries: 3,
        initialRetryDelay: 1000,
        maxRetryDelay: 30000,
        backoffMultiplier: 2,
      });

      expect(defaultHandler).toBeInstanceOf(NetworkErrorHandler);
    });
  });

  describe('getRecoveryStrategy', () => {
    it('UNAUTHORIZED エラーで REFRESH_TOKEN 戦略を返すこと', () => {
      const error = new AppError('UNAUTHORIZED', 'Token expired', 401);
      const strategy = handler.getRecoveryStrategy(error);

      expect(strategy).toBe(ErrorRecoveryStrategy.REFRESH_TOKEN);
    });

    it('FORBIDDEN エラーで LOGIN_REQUIRED 戦略を返すこと', () => {
      const error = new AppError('FORBIDDEN', 'Access denied', 403);
      const strategy = handler.getRecoveryStrategy(error);

      expect(strategy).toBe(ErrorRecoveryStrategy.LOGIN_REQUIRED);
    });

    it('NOT_FOUND エラーで REFRESH_DATA 戦略を返すこと', () => {
      const error = new AppError('NOT_FOUND', 'Resource not found', 404);
      const strategy = handler.getRecoveryStrategy(error);

      expect(strategy).toBe(ErrorRecoveryStrategy.REFRESH_DATA);
    });

    it('TOO_MANY_REQUESTS エラーで RATE_LIMIT_WAIT 戦略を返すこと', () => {
      const error = new AppError('TOO_MANY_REQUESTS', 'Rate limit exceeded', 429);
      const strategy = handler.getRecoveryStrategy(error);

      expect(strategy).toBe(ErrorRecoveryStrategy.RATE_LIMIT_WAIT);
    });

    it('一般的な Error で SHOW_ERROR 戦略を返すこと', () => {
      const error = new Error('Generic error');
      const strategy = handler.getRecoveryStrategy(error);

      expect(strategy).toBe(ErrorRecoveryStrategy.SHOW_ERROR);
    });
  });
});

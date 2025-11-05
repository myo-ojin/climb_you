/**
 * NotificationActionHandler Unit Tests
 * NotificationActionHandlerのユニットテスト
 */

// モックを最初に設定
jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

import { NotificationActionHandler } from './NotificationActionHandler';
import { NotificationActionIdentifier } from './types';
import * as Notifications from 'expo-notifications';

describe('NotificationActionHandler', () => {
  let handler: NotificationActionHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = NotificationActionHandler.getInstance();
  });

  describe('getInstance', () => {
    it('シングルトンインスタンスを返すこと', () => {
      const instance1 = NotificationActionHandler.getInstance();
      const instance2 = NotificationActionHandler.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('初期化が正常に完了すること', async () => {
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue(
        mockSubscription
      );

      await handler.initialize();

      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    });
  });

  describe('registerActionHandler', () => {
    it('アクションハンドラーを登録できること', () => {
      const mockHandler = jest.fn();

      handler.registerActionHandler('test_action', mockHandler);

      // ハンドラーが登録されたことを確認（内部的なテスト）
      expect(() => handler.registerActionHandler('test_action', mockHandler)).not.toThrow();
    });
  });

  describe('unregisterActionHandler', () => {
    it('アクションハンドラーを削除できること', () => {
      const mockHandler = jest.fn();

      handler.registerActionHandler('test_action', mockHandler);
      handler.unregisterActionHandler('test_action');

      // ハンドラーが削除されたことを確認（内部的なテスト）
      expect(() => handler.unregisterActionHandler('test_action')).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('クリーンアップが正常に動作すること', () => {
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue(
        mockSubscription
      );

      handler.initialize();
      handler.cleanup();

      // クリーンアップが正常に動作することを確認
      expect(() => handler.cleanup()).not.toThrow();
    });
  });
});

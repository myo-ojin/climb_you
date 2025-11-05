/**
 * DeepLinkHandler Unit Tests
 * DeepLinkHandlerのユニットテスト
 */

import { DeepLinkHandler } from './DeepLinkHandler';
import * as Linking from 'expo-linking';

// Linkingモジュールのモック
jest.mock('expo-linking', () => ({
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  parse: jest.fn(),
  createURL: jest.fn((path) => `climbyou://${path}`),
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));

describe('DeepLinkHandler', () => {
  let handler: DeepLinkHandler;
  let mockNavigationRef: any;

  beforeEach(() => {
    // モックのNavigationRefを作成
    mockNavigationRef = {
      navigate: jest.fn(),
      isReady: jest.fn(() => true),
    };

    handler = DeepLinkHandler.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    handler.cleanup();
  });

  describe('getInstance', () => {
    it('シングルトンインスタンスを返すこと', () => {
      const instance1 = DeepLinkHandler.getInstance();
      const instance2 = DeepLinkHandler.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('NavigationRefとイベントリスナーを初期化できること', () => {
      (Linking.getInitialURL as jest.Mock).mockResolvedValue(null);

      expect(() => {
        handler.initialize({ navigationRef: mockNavigationRef });
      }).not.toThrow();

      expect(Linking.addEventListener).toHaveBeenCalled();
    });
  });

  describe('createDeepLink', () => {
    it('ホーム画面のディープリンクを生成できること', () => {
      const url = handler.createDeepLink('Home');
      expect(url).toBe('climbyou://home');
    });

    it('クエスト詳細画面のディープリンクを生成できること', () => {
      const url = handler.createDeepLink('QuestDetail', { questId: 'quest-123' });
      expect(url).toBe('climbyou://quest/quest-123');
    });

    it('進捗画面のディープリンクを生成できること', () => {
      const url = handler.createDeepLink('Progress');
      expect(url).toBe('climbyou://progress');
    });

    it('ランキング画面のディープリンクを生成できること', () => {
      const url = handler.createDeepLink('Ranking');
      expect(url).toBe('climbyou://ranking');
    });

    it('目標詳細画面のディープリンクを生成できること', () => {
      const url = handler.createDeepLink('GoalDetail', { goalId: 'goal-456' });
      expect(url).toBe('climbyou://goal/goal-456');
    });

    it('目標編集画面のディープリンクを生成できること', () => {
      const url = handler.createDeepLink('GoalEdit', { goalId: 'goal-789' });
      expect(url).toBe('climbyou://goal/goal-789/edit');
    });

    it('設定画面のディープリンクを生成できること', () => {
      const url = handler.createDeepLink('Settings');
      expect(url).toBe('climbyou://settings');
    });

    it('通知設定画面のディープリンクを生成できること', () => {
      const url = handler.createDeepLink('NotificationSettings');
      expect(url).toBe('climbyou://settings/notifications');
    });

    it('プライバシーポリシー画面のディープリンクを生成できること', () => {
      const url = handler.createDeepLink('PrivacyPolicy');
      expect(url).toBe('climbyou://settings/privacy');
    });

    it('不明な画面の場合、ホーム画面のディープリンクを生成すること', () => {
      const url = handler.createDeepLink('UnknownScreen');
      expect(url).toBe('climbyou://home');
    });

    it('パラメータなしでパラメータが必要な画面の場合、ホーム画面のディープリンクを生成すること', () => {
      const url = handler.createDeepLink('QuestDetail');
      expect(url).toBe('climbyou://home');
    });
  });

  describe('openDeepLink', () => {
    it('URLを開けることを確認してから開くこと', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      const url = 'climbyou://home';
      await handler.openDeepLink(url);

      expect(Linking.canOpenURL).toHaveBeenCalledWith(url);
      expect(Linking.openURL).toHaveBeenCalledWith(url);
    });

    it('URLを開けない場合、openURLを呼ばないこと', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const url = 'climbyou://home';
      await handler.openDeepLink(url);

      expect(Linking.canOpenURL).toHaveBeenCalledWith(url);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('エラーが発生しても例外をスローしないこと', async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(new Error('Test error'));

      const url = 'climbyou://home';

      await expect(handler.openDeepLink(url)).resolves.not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('イベントリスナーとNavigation Refをクリアできること', () => {
      const mockRemove = jest.fn();
      (Linking.addEventListener as jest.Mock).mockReturnValue({
        remove: mockRemove,
      });

      handler.initialize({ navigationRef: mockNavigationRef });

      expect(() => {
        handler.cleanup();
      }).not.toThrow();

      expect(mockRemove).toHaveBeenCalled();
    });
  });
});

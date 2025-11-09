/**
 * OfflineManager Basic Tests
 * オフラインマネージャの基本テスト
 */

import { OfflineManager, ConnectionStatus } from '../offlineManager';
import NetInfo from '@react-native-community/netinfo';

jest.mock('@react-native-community/netinfo');

describe('OfflineManager - Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('オンライン状態で初期化すること', async () => {
      jest.mocked(NetInfo.fetch).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      } as any);

      const manager = new OfflineManager();
      const status = await manager.initialize();

      expect(status).toBe(ConnectionStatus.ONLINE);
    });

    it('オフライン状態で初期化すること', async () => {
      jest.mocked(NetInfo.fetch).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      } as any);

      const manager = new OfflineManager();
      const status = await manager.initialize();

      expect(status).toBe(ConnectionStatus.OFFLINE);
    });
  });

  describe('getStatus', () => {
    it('現在の接続状態を返すこと', async () => {
      jest.mocked(NetInfo.fetch).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      } as any);

      const manager = new OfflineManager();
      await manager.initialize();

      const status = manager.getStatus();

      expect(status).toBe(ConnectionStatus.ONLINE);
    });
  });

  describe('isOnline', () => {
    it('オンライン時にtrueを返すこと', async () => {
      jest.mocked(NetInfo.fetch).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      } as any);

      const manager = new OfflineManager();
      await manager.initialize();

      expect(manager.isOnline()).toBe(true);
    });

    it('オフライン時にfalseを返すこと', async () => {
      jest.mocked(NetInfo.fetch).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      } as any);

      const manager = new OfflineManager();
      await manager.initialize();

      expect(manager.isOnline()).toBe(false);
    });
  });
});

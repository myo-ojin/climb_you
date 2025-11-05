/**
 * Offline Manager
 * ネットワーク接続状態の監視とオフライン機能の管理
 */

import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

/**
 * ネットワーク接続状態
 */
export enum ConnectionStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * ネットワーク接続情報
 */
export interface NetworkInfo {
  status: ConnectionStatus;
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

/**
 * オフラインマネージャの設定
 */
export interface OfflineManagerConfig {
  enableAutoRetry: boolean;
  retryInterval: number;
  maxQueuedRequests: number;
  onOnline?: () => void;
  onOffline?: () => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

/**
 * キューに入れられたリクエスト
 */
export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data?: any;
  timestamp: number;
  retries: number;
}

/**
 * オフラインマネージャ
 */
export class OfflineManager {
  private config: OfflineManagerConfig;
  private networkSubscription: NetInfoSubscription | null = null;
  private currentStatus: ConnectionStatus = ConnectionStatus.UNKNOWN;
  private requestQueue: Map<string, QueuedRequest> = new Map();
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: Partial<OfflineManagerConfig> = {}) {
    this.config = {
      enableAutoRetry: true,
      retryInterval: 5000, // 5秒
      maxQueuedRequests: 50,
      ...config,
    };
  }

  /**
   * オフラインマネージャを初期化
   */
  async initialize(): Promise<ConnectionStatus> {
    try {
      // 現在の接続状態を取得
      const netInfoState = await NetInfo.fetch();
      this.updateConnectionStatus(netInfoState);

      // 接続状態の変化を監視
      this.networkSubscription = NetInfo.addEventListener((state) => {
        this.updateConnectionStatus(state);
      });

      console.log('[OfflineManager] Initialized', {
        status: this.currentStatus,
        isConnected: await this.isOnline(),
      });

      return this.currentStatus;
    } catch (error) {
      console.error('[OfflineManager] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * 接続状態を更新
   */
  private updateConnectionStatus(netInfoState: NetInfoState): void {
    const previousStatus = this.currentStatus;

    // オンライン/オフラインを判定
    if (netInfoState.isConnected === false) {
      this.currentStatus = ConnectionStatus.OFFLINE;
    } else if (netInfoState.isConnected === true) {
      this.currentStatus = ConnectionStatus.ONLINE;
    } else {
      this.currentStatus = ConnectionStatus.UNKNOWN;
    }

    console.log('[OfflineManager] Status updated', {
      previousStatus,
      newStatus: this.currentStatus,
      netInfo: netInfoState,
    });

    // ステータスが変わった場合
    if (previousStatus !== this.currentStatus) {
      // コールバック実行
      if (this.config.onStatusChange) {
        this.config.onStatusChange(this.currentStatus);
      }

      // オンライン/オフラインのコールバック
      if (this.currentStatus === ConnectionStatus.ONLINE) {
        if (this.config.onOnline) {
          this.config.onOnline();
        }
        // キューのリトライを開始
        if (this.config.enableAutoRetry) {
          this.startAutoRetry();
        }
      } else if (this.currentStatus === ConnectionStatus.OFFLINE) {
        if (this.config.onOffline) {
          this.config.onOffline();
        }
        // キューのリトライを停止
        this.stopAutoRetry();
      }
    }
  }

  /**
   * 現在オンラインか確認
   */
  async isOnline(): Promise<boolean> {
    try {
      const netInfoState = await NetInfo.fetch();
      return netInfoState.isConnected === true;
    } catch (error) {
      console.error('[OfflineManager] Failed to check connection:', error);
      return false;
    }
  }

  /**
   * 現在のステータスを取得
   */
  getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  /**
   * ネットワーク情報を取得
   */
  async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      const netInfoState = await NetInfo.fetch();
      return {
        status: this.currentStatus,
        isConnected: netInfoState.isConnected ?? false,
        isInternetReachable: netInfoState.isInternetReachable,
        type: netInfoState.type,
      };
    } catch (error) {
      console.error('[OfflineManager] Failed to get network info:', error);
      return {
        status: ConnectionStatus.UNKNOWN,
        isConnected: false,
        isInternetReachable: null,
        type: null,
      };
    }
  }

  /**
   * リクエストをキューに追加
   */
  queueRequest(request: QueuedRequest): boolean {
    // キューサイズをチェック
    if (this.requestQueue.size >= this.config.maxQueuedRequests) {
      console.warn('[OfflineManager] Queue is full, dropping oldest request');
      // 最も古いリクエストを削除
      const oldestKey = Array.from(this.requestQueue.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.requestQueue.delete(oldestKey);
    }

    this.requestQueue.set(request.id, request);
    console.log('[OfflineManager] Request queued', {
      id: request.id,
      url: request.url,
      queueSize: this.requestQueue.size,
    });

    return true;
  }

  /**
   * キューに入っているリクエストを取得
   */
  getQueuedRequests(): QueuedRequest[] {
    return Array.from(this.requestQueue.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * キューからリクエストを削除
   */
  removeQueuedRequest(requestId: string): boolean {
    const removed = this.requestQueue.delete(requestId);
    if (removed) {
      console.log('[OfflineManager] Request removed from queue', { requestId });
    }
    return removed;
  }

  /**
   * キューをクリア
   */
  clearQueue(): void {
    const size = this.requestQueue.size;
    this.requestQueue.clear();
    console.log('[OfflineManager] Queue cleared', { requestSize: size });
  }

  /**
   * キューサイズを取得
   */
  getQueueSize(): number {
    return this.requestQueue.size;
  }

  /**
   * 自動リトライを開始
   */
  private startAutoRetry(): void {
    if (this.retryTimer) {
      return;
    }

    console.log('[OfflineManager] Starting auto-retry');

    this.retryTimer = setInterval(() => {
      this.processQueue();
    }, this.config.retryInterval);
  }

  /**
   * 自動リトライを停止
   */
  private stopAutoRetry(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
      console.log('[OfflineManager] Auto-retry stopped');
    }
  }

  /**
   * キューのリクエストを処理
   */
  private async processQueue(): Promise<void> {
    if (this.requestQueue.size === 0) {
      return;
    }

    console.log('[OfflineManager] Processing queue', {
      queueSize: this.requestQueue.size,
    });

    const isOnline = await this.isOnline();
    if (!isOnline) {
      console.log('[OfflineManager] Still offline, skipping retry');
      return;
    }

    // キューのリクエストを取得（古い順）
    const requests = this.getQueuedRequests();

    for (const request of requests) {
      // リクエストを再実行（外部で実装）
      // この例では、イベントを発火してアプリケーション層で処理
      console.log('[OfflineManager] Retrying request', {
        id: request.id,
        url: request.url,
        attempt: request.retries + 1,
      });

      // リトライ回数を増加
      request.retries++;

      // 最大リトライ回数を超えた場合は削除
      if (request.retries > 5) {
        console.warn('[OfflineManager] Max retries exceeded, removing request', {
          id: request.id,
        });
        this.removeQueuedRequest(request.id);
      }
    }
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    if (this.networkSubscription) {
      this.networkSubscription();
      this.networkSubscription = null;
    }

    this.stopAutoRetry();
    this.clearQueue();

    console.log('[OfflineManager] Destroyed');
  }
}

/**
 * グローバルなオフラインマネージャインスタンス
 */
let globalOfflineManager: OfflineManager | null = null;

/**
 * グローバルオフラインマネージャを初期化
 */
export async function initializeGlobalOfflineManager(
  config?: Partial<OfflineManagerConfig>
): Promise<OfflineManager> {
  globalOfflineManager = new OfflineManager(config);
  await globalOfflineManager.initialize();
  return globalOfflineManager;
}

/**
 * グローバルオフラインマネージャを取得
 */
export function getGlobalOfflineManager(): OfflineManager {
  if (!globalOfflineManager) {
    globalOfflineManager = new OfflineManager();
  }
  return globalOfflineManager;
}

/**
 * React Hook: ネットワーク接続状態を監視
 */
export function useNetworkStatus(): {
  status: ConnectionStatus;
  isOnline: boolean;
  networkInfo: NetworkInfo | null;
} {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.UNKNOWN);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  useEffect(() => {
    const offlineManager = getGlobalOfflineManager();

    const checkStatus = async () => {
      const info = await offlineManager.getNetworkInfo();
      setNetworkInfo(info);
      setStatus(offlineManager.getStatus());
    };

    // 初期状態を設定
    checkStatus();

    // ステータス変化をリッスン
    const originalOnStatusChange = offlineManager['config'].onStatusChange;
    offlineManager['config'].onStatusChange = (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
      originalOnStatusChange?.(newStatus);
    };

    return () => {
      // クリーンアップ
      offlineManager['config'].onStatusChange = originalOnStatusChange;
    };
  }, []);

  return {
    status,
    isOnline: status === ConnectionStatus.ONLINE,
    networkInfo,
  };
}

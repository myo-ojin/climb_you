// Network Utilities
// Error Handling, Offline Management, Retry Strategy

export {
  NetworkErrorHandler,
  initializeGlobalErrorHandler,
  getGlobalErrorHandler,
  type ErrorHandlerConfig,
  type RetryContext,
  ErrorRecoveryStrategy,
} from './networkErrorHandler';

export {
  OfflineManager,
  initializeGlobalOfflineManager,
  getGlobalOfflineManager,
  useNetworkStatus,
  ConnectionStatus,
  type OfflineManagerConfig,
  type NetworkInfo,
  type QueuedRequest,
} from './offlineManager';

export {
  RetryStrategy,
  executeWithRetry,
  retryApiCall,
  RetryStrategyType,
  type RetryConfig,
  type RetryAttempt,
  type RetryResult,
} from './retryStrategy';

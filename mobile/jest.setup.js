/**
 * Jest Setup File
 * テスト環境の初期化
 */

// React Native Testing Library の設定
import '@testing-library/jest-native/extend-expect';

// React Native EventEmitter モック
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// mock警告を抑制（Expo/React Native特有）
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
  SQLiteDatabase: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  cacheDirectory: 'file://cache/',
  documentDirectory: 'file://document/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  downloadAsync: jest.fn(),
  deleteAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

jest.mock('expo-battery', () => ({
  BatteryState: {
    UNKNOWN: 0,
    UNPLUGGED: 1,
    CHARGING: 2,
    FULL: 3,
  },
  getBatteryLevelAsync: jest.fn().mockResolvedValue(0.8),
  getBatteryStateAsync: jest.fn().mockResolvedValue(1), // UNPLUGGED
  addBatteryLevelListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addBatteryStateListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytes: jest.fn((length) => {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }),
  digestStringAsync: jest.fn((algorithm, data, options) => {
    // Simple mock hash generation
    return Promise.resolve('mocked-hash-' + data.substring(0, 10));
  }),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
    SHA384: 'SHA-384',
    SHA512: 'SHA-512',
    MD5: 'MD5',
    SHA1: 'SHA-1',
  },
  CryptoEncoding: {
    HEX: 'hex',
    BASE64: 'base64',
  },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED: 0,
  AFTER_FIRST_UNLOCK: 1,
  ALWAYS: 2,
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 3,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 4,
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
  addEventListener: jest.fn().mockReturnValue(() => {}),
  configure: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([1, 2]), // FINGERPRINT, FACIAL_RECOGNITION
  SecurityLevel: {
    NONE: 0,
    SECRET: 1,
    BIOMETRIC_WEAK: 2,
    BIOMETRIC_STRONG: 3,
  },
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
  dismissBrowser: jest.fn(),
  openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'success', url: 'http://example.com' }),
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn().mockReturnValue('http://localhost:8081'),
  useAuthRequest: jest.fn(),
  useAutoDiscovery: jest.fn(),
  ResponseType: {
    Code: 'code',
    Token: 'token',
  },
  Prompt: {
    Login: 'login',
    None: 'none',
    Consent: 'consent',
  },
}));

// グローバルな console.error と console.warn を抑制（ノイズ削減）
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    // 特定のメッセージはフィルタ
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Non-serializable values were found') ||
        args[0].includes('Cannot log after tests are done'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('ViewPropTypes')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

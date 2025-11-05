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

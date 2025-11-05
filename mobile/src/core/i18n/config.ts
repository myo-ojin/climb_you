/**
 * i18n Configuration
 * react-i18next設定ファイル
 *
 * 機能:
 * - 言語検出（デバイス設定、AsyncStorage）
 * - フォールバック言語設定
 * - 翻訳リソース管理
 * - 補間機能
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 翻訳リソースのインポート
import ja from './locales/ja.json';
import en from './locales/en.json';

/**
 * サポートされている言語
 */
export const SUPPORTED_LANGUAGES = ['ja', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * デフォルト言語
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'ja';

/**
 * AsyncStorageキー（言語設定保存用）
 */
const LANGUAGE_STORAGE_KEY = '@climb_you:language';

/**
 * デバイスの言語を取得
 * サポートされていない言語の場合はデフォルト言語を返す
 */
const getDeviceLanguage = (): SupportedLanguage => {
  const deviceLocale = Localization.getLocales()[0]?.languageCode || 'ja';

  // デバイス言語がサポートされているかチェック
  if (SUPPORTED_LANGUAGES.includes(deviceLocale as SupportedLanguage)) {
    return deviceLocale as SupportedLanguage;
  }

  return DEFAULT_LANGUAGE;
};

/**
 * 保存されている言語設定を取得
 */
export const getSavedLanguage = async (): Promise<SupportedLanguage | null> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage as SupportedLanguage)) {
      return savedLanguage as SupportedLanguage;
    }
    return null;
  } catch (error) {
    console.error('Failed to get saved language:', error);
    return null;
  }
};

/**
 * 言語設定を保存
 */
export const saveLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Failed to save language:', error);
  }
};

/**
 * i18n初期化
 */
const initI18n = async (): Promise<void> => {
  // 保存された言語設定を取得
  const savedLanguage = await getSavedLanguage();

  // 初期言語を決定（優先順位: 保存済み > デバイス設定 > デフォルト）
  const initialLanguage = savedLanguage || getDeviceLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      // 翻訳リソース
      resources: {
        ja: { translation: ja },
        en: { translation: en },
      },

      // 初期言語
      lng: initialLanguage,

      // フォールバック言語
      fallbackLng: DEFAULT_LANGUAGE,

      // 言語検出を無効化（手動で設定）
      detection: undefined,

      // 補間設定
      interpolation: {
        escapeValue: false, // React already safes from XSS
      },

      // React設定
      react: {
        useSuspense: false, // React Nativeでは非推奨
      },

      // デバッグモード（開発時のみ）
      debug: __DEV__,

      // 翻訳キーが見つからない場合の動作
      returnNull: false,
      returnEmptyString: false,
    });
};

// 初期化を実行
initI18n();

export default i18n;

/**
 * i18n Configuration
 * i18nextとreact-i18nextを使用した多言語対応の設定
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 翻訳ファイルのインポート
import ja from '@/locales/ja';
import en from '@/locales/en';

const LANGUAGE_KEY = 'app_language';

/**
 * i18nの初期化
 */
const initI18n = async () => {
  try {
    // AsyncStorageから保存された言語設定を取得
    let savedLanguage: string | null = null;
    try {
      savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    } catch (storageError) {
      console.warn('[i18n] Failed to read saved language from AsyncStorage:', storageError);
      // 続行（デバイス言語またはデフォルトにフォールバック）
    }

    // デバイスの言語を取得（例: "ja-JP" → "ja"）
    const deviceLanguage = Localization.locale.split('-')[0];

    // サポートしている言語のリスト
    const supportedLanguages = ['ja', 'en'];

    // 使用する言語を決定（優先順位: 保存された言語 > デバイス言語 > デフォルト言語）
    let languageToUse = 'en'; // デフォルト

    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      languageToUse = savedLanguage;
    } else if (supportedLanguages.includes(deviceLanguage)) {
      languageToUse = deviceLanguage;
    }

    await i18n
      .use(initReactI18next)
      .init({
        resources: {
          ja: { translation: ja },
          en: { translation: en },
        },
        lng: languageToUse,
        fallbackLng: 'en',
        debug: __DEV__, // 開発環境のみデバッグモード
        interpolation: {
          escapeValue: false, // React Nativeでは不要
        },
        react: {
          useSuspense: false, // React Nativeでは非同期レンダリングを無効化
        },
      });

    console.log(`[i18n] Initialized with language: ${languageToUse}`);
  } catch (error) {
    console.error('[i18n] Initialization error:', error);

    // エラーが発生してもアプリは動作するように、デフォルト設定で初期化
    await i18n
      .use(initReactI18next)
      .init({
        resources: {
          ja: { translation: ja },
          en: { translation: en },
        },
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
      });
  }
};

/**
 * 言語を変更する
 * @param language - 変更する言語コード（'ja' または 'en'）
 * @throws {Error} サポートされていない言語コードの場合
 */
export const changeLanguage = async (language: string): Promise<void> => {
  const supportedLanguages = ['ja', 'en'];

  // 言語コードのバリデーション
  if (!supportedLanguages.includes(language)) {
    const error = new Error(
      `Unsupported language: ${language}. Supported languages: ${supportedLanguages.join(', ')}`
    );
    console.error('[i18n]', error.message);
    throw error;
  }

  try {
    // AsyncStorageに保存
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (storageError) {
      console.error('[i18n] Failed to save language to AsyncStorage:', storageError);
      throw new Error(`Failed to save language preference: ${storageError instanceof Error ? storageError.message : String(storageError)}`);
    }

    // i18nの言語を変更
    try {
      await i18n.changeLanguage(language);
    } catch (i18nError) {
      console.error('[i18n] Failed to change i18n language:', i18nError);
      throw new Error(`Failed to change language: ${i18nError instanceof Error ? i18nError.message : String(i18nError)}`);
    }

    console.log(`[i18n] Language changed to: ${language}`);
  } catch (error) {
    console.error('[i18n] Failed to change language:', error);
    throw error;
  }
};

/**
 * 現在の言語を取得する
 * @returns 現在の言語コード
 */
export const getCurrentLanguage = (): string => {
  return i18n.language;
};

/**
 * サポートしている言語のリストを取得する
 * @returns サポートしている言語コードの配列
 */
export const getSupportedLanguages = (): Array<{ code: string; name: string; nativeName: string }> => {
  return [
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'en', name: 'English', nativeName: 'English' },
  ];
};

// i18nを初期化
initI18n();

export default i18n;

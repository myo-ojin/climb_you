/**
 * i18n Tests
 * i18n設定のユニットテスト
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import i18n, { changeLanguage, getCurrentLanguage, getSupportedLanguages } from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorageのモック
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// expo-localizationのモック
jest.mock('expo-localization', () => ({
  locale: 'en-US',
}));

describe('i18n Configuration', () => {
  beforeEach(async () => {
    // 各テスト前にモックをクリア
    jest.clearAllMocks();

    // デフォルトで英語に設定
    await i18n.changeLanguage('en');
  });

  describe('初期化', () => {
    it('i18nが正しく初期化される', () => {
      expect(i18n).toBeDefined();
      expect(i18n.language).toBeDefined();
      expect(i18n.t).toBeDefined();
    });

    it('サポートされている言語が正しく返される', () => {
      const languages = getSupportedLanguages();

      expect(languages).toHaveLength(2);
      expect(languages).toEqual([
        { code: 'ja', name: 'Japanese', nativeName: '日本語' },
        { code: 'en', name: 'English', nativeName: 'English' },
      ]);
    });
  });

  describe('翻訳機能', () => {
    it('英語の翻訳が正しく取得される', async () => {
      await i18n.changeLanguage('en');

      expect(i18n.t('common.ok')).toBe('OK');
      expect(i18n.t('common.cancel')).toBe('Cancel');
      expect(i18n.t('auth.login')).toBe('Login');
    });

    it('日本語の翻訳が正しく取得される', async () => {
      await i18n.changeLanguage('ja');

      expect(i18n.t('common.ok')).toBe('OK');
      expect(i18n.t('common.cancel')).toBe('キャンセル');
      expect(i18n.t('auth.login')).toBe('ログイン');
    });

    it('変数補間が正しく動作する', async () => {
      await i18n.changeLanguage('ja');

      expect(i18n.t('quest.estimated_time', { time: 30 })).toBe('所要時間：30分');
      expect(i18n.t('progress.current_station', { station: 5 })).toBe('現在：5合目');
    });

    it('存在しないキーの場合、キー自体が返される', async () => {
      await i18n.changeLanguage('en');

      expect(i18n.t('non.existent.key')).toBe('non.existent.key');
    });
  });

  describe('言語切り替え', () => {
    it('changeLanguage関数で言語が変更される', async () => {
      await changeLanguage('ja');

      expect(i18n.language).toBe('ja');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_language', 'ja');
    });

    it('getCurrentLanguage関数で現在の言語が取得される', async () => {
      await changeLanguage('ja');

      const currentLang = getCurrentLanguage();

      expect(currentLang).toBe('ja');
    });

    it('言語変更後に翻訳が正しく反映される', async () => {
      await changeLanguage('en');
      expect(i18n.t('common.cancel')).toBe('Cancel');

      await changeLanguage('ja');
      expect(i18n.t('common.cancel')).toBe('キャンセル');
    });
  });

  describe('フォールバック', () => {
    it('サポートされていない言語の場合、英語にフォールバックする', async () => {
      // i18nの設定上、フォールバック言語は英語
      await i18n.changeLanguage('fr'); // フランス語（サポート外）

      // フォールバックで英語の翻訳が使われる
      const translation = i18n.t('common.cancel');
      expect(translation).toBe('Cancel');
    });
  });
});

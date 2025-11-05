/**
 * i18n Configuration Test
 */

import i18n, {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getSavedLanguage,
  saveLanguage,
  type SupportedLanguage,
} from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorageをモック
jest.mock('@react-native-async-storage/async-storage');

// expo-localizationをモック
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'ja' }]),
}));

describe('i18n Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SUPPORTED_LANGUAGES', () => {
    it('should contain ja and en', () => {
      expect(SUPPORTED_LANGUAGES).toContain('ja');
      expect(SUPPORTED_LANGUAGES).toContain('en');
      expect(SUPPORTED_LANGUAGES).toHaveLength(2);
    });
  });

  describe('DEFAULT_LANGUAGE', () => {
    it('should be ja', () => {
      expect(DEFAULT_LANGUAGE).toBe('ja');
    });
  });

  describe('getSavedLanguage', () => {
    it('should return saved language if valid', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('en');

      const language = await getSavedLanguage();
      expect(language).toBe('en');
    });

    it('should return null if no saved language', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const language = await getSavedLanguage();
      expect(language).toBeNull();
    });

    it('should return null if saved language is not supported', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('fr');

      const language = await getSavedLanguage();
      expect(language).toBeNull();
    });

    it('should return null on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const language = await getSavedLanguage();
      expect(language).toBeNull();
    });
  });

  describe('saveLanguage', () => {
    it('should save language to AsyncStorage', async () => {
      await saveLanguage('en');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@climb_you:language', 'en');
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(saveLanguage('en')).resolves.not.toThrow();
    });
  });

  describe('i18n instance', () => {
    it('should be initialized', () => {
      expect(i18n).toBeDefined();
      expect(i18n.isInitialized).toBe(true);
    });

    it('should have translation resources', () => {
      expect(i18n.hasResourceBundle('ja', 'translation')).toBe(true);
      expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
    });

    it('should translate common.appName in Japanese', () => {
      i18n.changeLanguage('ja');
      expect(i18n.t('common.appName')).toBe('Climb You');
    });

    it('should translate common.appName in English', () => {
      i18n.changeLanguage('en');
      expect(i18n.t('common.appName')).toBe('Climb You');
    });

    it('should translate auth.welcome in Japanese', () => {
      i18n.changeLanguage('ja');
      expect(i18n.t('auth.welcome')).toBe('Climb Youへようこそ');
    });

    it('should translate auth.welcome in English', () => {
      i18n.changeLanguage('en');
      expect(i18n.t('auth.welcome')).toBe('Welcome to Climb You');
    });

    it('should interpolate variables in Japanese', () => {
      i18n.changeLanguage('ja');
      const result = i18n.t('home.questsAvailable', { count: 3 });
      expect(result).toBe('今日のクエストが3件あります');
    });

    it('should interpolate variables in English', () => {
      i18n.changeLanguage('en');
      const result = i18n.t('home.questsAvailable', { count: 3 });
      expect(result).toBe('You have 3 quests today');
    });

    it('should use fallback language if translation not found', () => {
      i18n.changeLanguage('en');
      const result = i18n.t('nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });
  });

  describe('Language switching', () => {
    it('should change language', async () => {
      await i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');

      await i18n.changeLanguage('ja');
      expect(i18n.language).toBe('ja');
    });

    it('should emit language changed event', (done) => {
      i18n.on('languageChanged', (lng) => {
        expect(lng).toBe('en');
        done();
      });

      i18n.changeLanguage('en');
    });
  });
});

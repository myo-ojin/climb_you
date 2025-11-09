/**
 * useTranslation Basic Tests
 * 翻訳フックの基本テスト
 */

import { renderHook } from '@testing-library/react-native';
import { useTranslation } from '../useTranslation';
import { useTranslation as useI18nextTranslation } from 'react-i18next';

// react-i18nextをモック
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

describe('useTranslation - Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フックが実行できること', () => {
    const mockT = jest.fn((key: string) => key);
    const mockI18n = {
      language: 'ja',
      changeLanguage: jest.fn(),
    };

    (useI18nextTranslation as jest.Mock).mockReturnValue({
      t: mockT,
      i18n: mockI18n,
    });

    const { result } = renderHook(() => useTranslation());

    expect(result.current).toBeDefined();
    expect(result.current.t).toBeDefined();
    expect(result.current.language).toBe('ja');
    expect(result.current.i18n).toBeDefined();
  });

  it('翻訳関数が返されること', () => {
    const mockT = jest.fn((key: string) => `translated_${key}`);
    const mockI18n = {
      language: 'en',
    };

    (useI18nextTranslation as jest.Mock).mockReturnValue({
      t: mockT,
      i18n: mockI18n,
    });

    const { result } = renderHook(() => useTranslation());

    const translated = result.current.t('test.key');
    expect(translated).toBe('translated_test.key');
    expect(mockT).toHaveBeenCalledWith('test.key');
  });

  it('現在の言語コードが取得できること', () => {
    const mockI18n = {
      language: 'ja',
    };

    (useI18nextTranslation as jest.Mock).mockReturnValue({
      t: jest.fn(),
      i18n: mockI18n,
    });

    const { result } = renderHook(() => useTranslation());

    expect(result.current.language).toBe('ja');
  });
});

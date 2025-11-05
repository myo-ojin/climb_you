/**
 * SignUpScreen Tests
 * テスト対象: サインアップ/パスワードログイン画面
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SignUpScreen } from '../screens/SignUpScreen';
import { OAuth2Client } from '@/core/network/oauth';
import { SecureTokenStore, BiometricAuth } from '@/services/auth';

// Mock dependencies
vi.mock('@/core/network/oauth');
vi.mock('@/services/auth');

// Mock fetch
global.fetch = vi.fn();

const Stack = createNativeStackNavigator();

const MockNavigationWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    <Stack.Navigator>{children}</Stack.Navigator>
  </NavigationContainer>
);

describe('SignUpScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockClear();
  });

  describe('Rendering', () => {
    it('should render login mode by default', () => {
      const { getByText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      expect(getByText('ログイン')).toBeTruthy();
      expect(getByText('メールアドレス')).toBeTruthy();
      expect(getByText('パスワード')).toBeTruthy();
    });

    it('should render email and password inputs', () => {
      const { getByPlaceholderText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      expect(getByPlaceholderText('user@example.com')).toBeTruthy();
      expect(getByPlaceholderText('••••••••')).toBeTruthy();
    });

    it('should not show password confirmation in login mode', () => {
      const { queryByText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      expect(queryByText('パスワード確認')).toBeNull();
    });
  });

  describe('Mode Switching', () => {
    it('should switch to signup mode', async () => {
      const { getByText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      const switchLink = getByText('サインアップ');
      fireEvent.press(switchLink);

      await waitFor(() => {
        expect(getByText('アカウント作成')).toBeTruthy();
      });
    });

    it('should show password confirmation in signup mode', async () => {
      const { getByText, queryByText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      fireEvent.press(getByText('サインアップ'));

      await waitFor(() => {
        expect(queryByText('パスワード確認')).toBeTruthy();
      });
    });

    it('should switch back to login mode', async () => {
      const { getByText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      fireEvent.press(getByText('サインアップ'));

      await waitFor(() => {
        expect(getByText('ログイン')).toBeTruthy();
      });

      fireEvent.press(getByText('ログイン'));

      await waitFor(() => {
        expect(getByText('ログイン')).toBeTruthy();
      });
    });
  });

  describe('Input Validation', () => {
    it('should require email address', async () => {
      const { getByText, getByPlaceholderText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      const passwordInput = getByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInput, 'ValidPassword1');

      fireEvent.press(getByText('ログイン'));

      await waitFor(() => {
        expect(getByText('メールアドレスを入力してください')).toBeTruthy();
      });
    });

    it('should validate email format', async () => {
      const { getByText, getByPlaceholderText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      const emailInput = getByPlaceholderText('user@example.com');
      fireEvent.changeText(emailInput, 'invalid-email');

      fireEvent.press(getByText('ログイン'));

      await waitFor(() => {
        expect(getByText('有効なメールアドレスを入力してください')).toBeTruthy();
      });
    });

    it('should require password', async () => {
      const { getByText, getByPlaceholderText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      const emailInput = getByPlaceholderText('user@example.com');
      fireEvent.changeText(emailInput, 'user@example.com');

      fireEvent.press(getByText('ログイン'));

      await waitFor(() => {
        expect(getByText('パスワードを入力してください')).toBeTruthy();
      });
    });

    it('should validate password in signup mode', async () => {
      const { getByText, getByPlaceholderText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      fireEvent.press(getByText('サインアップ'));

      await waitFor(() => {
        const emailInput = getByPlaceholderText('user@example.com');
        const passwordInput = getByPlaceholderText('••••••••');

        fireEvent.changeText(emailInput, 'user@example.com');
        fireEvent.changeText(passwordInput, 'weak');

        fireEvent.press(getByText('作成'));
      });

      await waitFor(() => {
        expect(
          getByText(
            '8文字以上で、大文字・小文字・数字を含める必要があります'
          )
        ).toBeTruthy();
      });
    });

    it('should validate password confirmation match', async () => {
      const { getByText, getByPlaceholderText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      fireEvent.press(getByText('サインアップ'));

      await waitFor(() => {
        const emailInput = getByPlaceholderText('user@example.com');
        const passwords = getByPlaceholderText('••••••••');

        fireEvent.changeText(emailInput, 'user@example.com');
        fireEvent.changeText(passwords, 'ValidPassword1');
        fireEvent.changeText(passwords, 'DifferentPassword1');

        fireEvent.press(getByText('作成'));
      });

      await waitFor(() => {
        expect(getByText('パスワードが一致しません')).toBeTruthy();
      });
    });
  });

  describe('Password Visibility', () => {
    it('should toggle password visibility', async () => {
      const { getByText, getByPlaceholderText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      const showButton = getByText('表示');
      fireEvent.press(showButton);

      await waitFor(() => {
        expect(getByText('非表示')).toBeTruthy();
      });

      fireEvent.press(getByText('非表示'));

      await waitFor(() => {
        expect(getByText('表示')).toBeTruthy();
      });
    });
  });

  describe('Login Process', () => {
    it('should handle successful login', async () => {
      vi.mocked(OAuth2Client.prototype.startLogin).mockResolvedValue({
        code: 'auth_code_123',
        state: 'state_123',
      });

      vi.mocked(OAuth2Client.prototype.exchangeCodeForToken).mockResolvedValue({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
        expiresIn: 3600,
        tokenType: 'Bearer',
        issuedAt: Math.floor(Date.now() / 1000),
      });

      vi.mocked(SecureTokenStore.storeToken).mockResolvedValue(undefined);
      vi.mocked(BiometricAuth.isAvailable).mockResolvedValue(false);

      const { getByText, getByPlaceholderText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      const emailInput = getByPlaceholderText('user@example.com');
      const passwordInput = getByPlaceholderText('••••••••');

      fireEvent.changeText(emailInput, 'user@example.com');
      fireEvent.changeText(passwordInput, 'ValidPassword1');

      fireEvent.press(getByText('ログイン'));

      await waitFor(() => {
        expect(SecureTokenStore.storeToken).toHaveBeenCalled();
      });
    });

    it('should handle login error', async () => {
      vi.mocked(OAuth2Client.prototype.startLogin).mockRejectedValue(
        new Error('Login failed')
      );

      const { getByText, getByPlaceholderText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      const emailInput = getByPlaceholderText('user@example.com');
      const passwordInput = getByPlaceholderText('••••••••');

      fireEvent.changeText(emailInput, 'user@example.com');
      fireEvent.changeText(passwordInput, 'ValidPassword1');

      fireEvent.press(getByText('ログイン'));

      await waitFor(() => {
        expect(
          getByText('ログインに失敗しました。もう一度お試しください。')
        ).toBeTruthy();
      });
    });
  });

  describe('SignUp Process', () => {
    it('should handle successful signup', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'access_token_123',
          refreshToken: 'refresh_token_123',
          expiresIn: 3600,
          scope: 'openid profile email',
        }),
      } as Response);

      vi.mocked(SecureTokenStore.storeToken).mockResolvedValue(undefined);
      vi.mocked(BiometricAuth.isAvailable).mockResolvedValue(false);

      const { getByText, getByPlaceholderText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      fireEvent.press(getByText('サインアップ'));

      await waitFor(() => {
        const emailInput = getByPlaceholderText('user@example.com');
        const passwordInputs = getByPlaceholderText('••••••••');

        fireEvent.changeText(emailInput, 'newuser@example.com');
        fireEvent.changeText(passwordInputs, 'ValidPassword1');
        fireEvent.changeText(passwordInputs, 'ValidPassword1');

        fireEvent.press(getByText('作成'));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/signup'),
          expect.any(Object)
        );
      });
    });

    it('should handle signup error from API', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Email already registered' }),
      } as Response);

      const { getByText, getByPlaceholderText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      fireEvent.press(getByText('サインアップ'));

      await waitFor(() => {
        const emailInput = getByPlaceholderText('user@example.com');
        const passwordInputs = getByPlaceholderText('••••••••');

        fireEvent.changeText(emailInput, 'existing@example.com');
        fireEvent.changeText(passwordInputs, 'ValidPassword1');
        fireEvent.changeText(passwordInputs, 'ValidPassword1');

        fireEvent.press(getByText('作成'));
      });

      await waitFor(() => {
        expect(getByText('Email already registered')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility labels on inputs', () => {
      const { getByLabelText } = render(
        <MockNavigationWrapper>
          <SignUpScreen />
        </MockNavigationWrapper>
      );

      expect(getByLabelText('メールアドレス入力フィールド')).toBeTruthy();
      expect(getByLabelText('パスワード入力フィールド')).toBeTruthy();
    });
  });
});

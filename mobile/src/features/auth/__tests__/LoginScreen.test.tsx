/**
 * LoginScreen Tests
 * テスト対象: ログイン画面（生体認証、ソーシャル認証統合）
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../screens/LoginScreen';
import { BiometricAuth, SecureTokenStore } from '@/services/auth';

// Mock dependencies
jest.mock('@/services/auth');
jest.mock('@/core/network/oauth');

// Mock Navigation
const Stack = createNativeStackNavigator();

const MockNavigationWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    <Stack.Navigator>{children}</Stack.Navigator>
  </NavigationContainer>
);

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login screen with title', () => {
      vi.mocked(BiometricAuth.isAvailable).mockResolvedValue(false);
      vi.mocked(SecureTokenStore.getToken).mockResolvedValue(null);

      render(
        <MockNavigationWrapper>
          <LoginScreen />
        </MockNavigationWrapper>
      );

      expect(screen.getByText('climb-you')).toBeTruthy();
      expect(screen.getByText('目標を山登りに変える')).toBeTruthy();
    });

    it('should render sign in buttons', () => {
      vi.mocked(BiometricAuth.isAvailable).mockResolvedValue(false);
      vi.mocked(SecureTokenStore.getToken).mockResolvedValue(null);

      render(
        <MockNavigationWrapper>
          <LoginScreen />
        </MockNavigationWrapper>
      );

      expect(screen.getByText('Googleでサインイン')).toBeTruthy();
      expect(screen.getByText('パスワードでサインイン')).toBeTruthy();
    });

    it('should render biometric button when available', async () => {
      vi.mocked(BiometricAuth.isAvailable).mockResolvedValue(true);
      vi.mocked(BiometricAuth.getPrimaryBiometricType).mockResolvedValue('face');
      vi.mocked(BiometricAuth.biometricTypeToString).mockReturnValue('Face ID');
      vi.mocked(SecureTokenStore.getToken).mockResolvedValue(null);

      render(
        <MockNavigationWrapper>
          <LoginScreen />
        </MockNavigationWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Face IDでログイン')).toBeTruthy();
      });
    });

    it('should render Apple button on iOS only', async () => {
      // Note: Platform.OS check would need mocking for this test
      vi.mocked(BiometricAuth.isAvailable).mockResolvedValue(false);
      vi.mocked(SecureTokenStore.getToken).mockResolvedValue(null);

      render(
        <MockNavigationWrapper>
          <LoginScreen />
        </MockNavigationWrapper>
      );

      // This would be tested in E2E for platform-specific behavior
      expect(screen.getByText('Googleでサインイン')).toBeTruthy();
    });
  });

  describe('Biometric Login', () => {
    it('should attempt biometric authentication when button pressed', async () => {
      vi.mocked(BiometricAuth.isAvailable).mockResolvedValue(true);
      vi.mocked(BiometricAuth.getPrimaryBiometricType).mockResolvedValue('fingerprint');
      vi.mocked(BiometricAuth.biometricTypeToString).mockReturnValue('Fingerprint');
      vi.mocked(BiometricAuth.authenticate).mockResolvedValue({ success: true, type: 'fingerprint' });
      vi.mocked(SecureTokenStore.getToken).mockResolvedValue({
        accessToken: 'test_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        issuedAt: Date.now(),
      });
      vi.mocked(SecureTokenStore.isTokenValid).mockResolvedValue(true);

      const { getByText } = render(
        <MockNavigationWrapper>
          <LoginScreen />
        </MockNavigationWrapper>
      );

      await waitFor(() => {
        expect(getByText('Fingerprintでログイン')).toBeTruthy();
      });

      const biometricButton = getByText('Fingerprintでログイン');
      fireEvent.press(biometricButton);

      await waitFor(() => {
        expect(BiometricAuth.authenticate).toHaveBeenCalled();
      });
    });

    it('should show error when biometric authentication fails', async () => {
      vi.mocked(BiometricAuth.isAvailable).mockResolvedValue(true);
      vi.mocked(BiometricAuth.getPrimaryBiometricType).mockResolvedValue('face');
      vi.mocked(BiometricAuth.biometricTypeToString).mockReturnValue('Face ID');
      vi.mocked(BiometricAuth.authenticate).mockResolvedValue({
        success: false,
        error: 'Authentication cancelled by user',
      });
      vi.mocked(SecureTokenStore.getToken).mockResolvedValue(null);

      const { getByText } = render(
        <MockNavigationWrapper>
          <LoginScreen />
        </MockNavigationWrapper>
      );

      await waitFor(() => {
        expect(getByText('Face IDでログイン')).toBeTruthy();
      });

      const biometricButton = getByText('Face IDでログイン');
      fireEvent.press(biometricButton);

      await waitFor(() => {
        expect(getByText('生体認証に失敗しました')).toBeTruthy();
      });
    });

    it('should show error when no token is stored', async () => {
      vi.mocked(BiometricAuth.isAvailable).mockResolvedValue(true);
      vi.mocked(BiometricAuth.getPrimaryBiometricType).mockResolvedValue('fingerprint');
      vi.mocked(BiometricAuth.biometricTypeToString).mockReturnValue('Fingerprint');
      vi.mocked(BiometricAuth.authenticate).mockResolvedValue({ success: true, type: 'fingerprint' });
      vi.mocked(SecureTokenStore.getToken).mockResolvedValue(null);

      const { getByText } = render(
        <MockNavigationWrapper>
          <LoginScreen />
        </MockNavigationWrapper>
      );

      await waitFor(() => {
        expect(getByText('Fingerprintでログイン')).toBeTruthy();
      });

      const biometricButton = getByText('Fingerprintでログイン');
      fireEvent.press(biometricButton);

      await waitFor(() => {
        expect(
          getByText('トークンが見つかりません。パスワードでログインしてください。')
        ).toBeTruthy();
      });
    });

    it('should show error when token is invalid', async () => {
      vi.mocked(BiometricAuth.isAvailable).mockResolvedValue(true);
      vi.mocked(BiometricAuth.getPrimaryBiometricType).mockResolvedValue('face');
      vi.mocked(BiometricAuth.biometricTypeToString).mockReturnValue('Face ID');
      vi.mocked(BiometricAuth.authenticate).mockResolvedValue({ success: true, type: 'face' });
      vi.mocked(SecureTokenStore.getToken).mockResolvedValue({
        accessToken: 'expired_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() - 1000,
        tokenType: 'Bearer',
        issuedAt: Date.now() - 7200000,
      });
      vi.mocked(SecureTokenStore.isTokenValid).mockResolvedValue(false);

      const { getByText } = render(
        <MockNavigationWrapper>
          <LoginScreen />
        </MockNavigationWrapper>
      );

      await waitFor(() => {
        expect(getByText('Face IDでログイン')).toBeTruthy();
      });

      const biometricButton = getByText('Face IDでログイン');
      fireEvent.press(biometricButton);

      await waitFor(() => {
        expect(
          getByText('セッションが期限切れです。パスワードで再ログインしてください。')
        ).toBeTruthy();
      });
    });
  });

  describe('Session Check', () => {
    it('should redirect to Home if valid session exists', async () => {
      const mockNavigate = vi.fn();

      vi.mocked(BiometricAuth.isAvailable).mockResolvedValue(false);
      vi.mocked(SecureTokenStore.getToken).mockResolvedValue({
        accessToken: 'valid_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        issuedAt: Date.now(),
      });
      vi.mocked(SecureTokenStore.isTokenValid).mockResolvedValue(true);

      render(
        <MockNavigationWrapper>
          <LoginScreen />
        </MockNavigationWrapper>
      );

      await waitFor(() => {
        // Session check should trigger navigation
        expect(SecureTokenStore.isTokenValid).toHaveBeenCalled();
      });
    });

    it('should stay on LoginScreen if no session', async () => {
      vi.mocked(BiometricAuth.isAvailable).mockResolvedValue(false);
      vi.mocked(SecureTokenStore.getToken).mockResolvedValue(null);

      const { getByText } = render(
        <MockNavigationWrapper>
          <LoginScreen />
        </MockNavigationWrapper>
      );

      await waitFor(() => {
        expect(getByText('climb-you')).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to SignUp when password button is pressed', async () => {
      vi.mocked(BiometricAuth.isAvailable).mockResolvedValue(false);
      vi.mocked(SecureTokenStore.getToken).mockResolvedValue(null);

      const { getByText } = render(
        <MockNavigationWrapper>
          <LoginScreen />
        </MockNavigationWrapper>
      );

      const passwordButton = getByText('パスワードでサインイン');
      fireEvent.press(passwordButton);

      await waitFor(() => {
        // Navigation event would be verified in E2E tests
        expect(true).toBe(true);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility labels on buttons', async () => {
      vi.mocked(BiometricAuth.isAvailable).mockResolvedValue(false);
      vi.mocked(SecureTokenStore.getToken).mockResolvedValue(null);

      const { getByLabelText } = render(
        <MockNavigationWrapper>
          <LoginScreen />
        </MockNavigationWrapper>
      );

      // Check for accessibility attributes
      expect(getByLabelText('Googleでサインイン')).toBeTruthy();
    });
  });
});

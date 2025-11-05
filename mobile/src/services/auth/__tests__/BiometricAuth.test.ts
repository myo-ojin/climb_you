/**
 * BiometricAuth Tests
 * テスト対象: 生体認証機能（Face ID/Touch ID/Fingerprint）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as LocalAuthentication from 'expo-local-authentication';
import { BiometricAuth, BiometricType, BiometricAuthResult } from '../BiometricAuth';

// Mock expo-local-authentication
vi.mock('expo-local-authentication');

describe('BiometricAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isAvailable', () => {
    it('should return true when hardware is available and enrolled', async () => {
      vi.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(true);
      vi.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);

      const result = await BiometricAuth.isAvailable();

      expect(result).toBe(true);
      expect(LocalAuthentication.hasHardwareAsync).toHaveBeenCalled();
      expect(LocalAuthentication.isEnrolledAsync).toHaveBeenCalled();
    });

    it('should return false when hardware is not available', async () => {
      vi.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(false);
      vi.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);

      const result = await BiometricAuth.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false when not enrolled', async () => {
      vi.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(true);
      vi.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(false);

      const result = await BiometricAuth.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      vi.mocked(LocalAuthentication.hasHardwareAsync).mockRejectedValue(
        new Error('Hardware check failed')
      );

      const result = await BiometricAuth.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('getSupportedTypes', () => {
    it('should return supported biometric types', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockResolvedValue(
        [
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          LocalAuthentication.AuthenticationType.FINGERPRINT,
        ]
      );

      const result = await BiometricAuth.getSupportedTypes();

      expect(result).toEqual([BiometricType.FACE, BiometricType.FINGERPRINT]);
    });

    it('should handle iris recognition', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockResolvedValue(
        [LocalAuthentication.AuthenticationType.IRIS]
      );

      const result = await BiometricAuth.getSupportedTypes();

      expect(result).toEqual([BiometricType.IRIS]);
    });

    it('should return empty array on error', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockRejectedValue(
        new Error('Failed to get types')
      );

      const result = await BiometricAuth.getSupportedTypes();

      expect(result).toEqual([]);
    });

    it('should return UNKNOWN for unmapped types', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockResolvedValue(
        [99 as any] // Unknown type
      );

      const result = await BiometricAuth.getSupportedTypes();

      expect(result).toEqual([BiometricType.UNKNOWN]);
    });
  });

  describe('authenticate', () => {
    it('should successfully authenticate with biometrics', async () => {
      vi.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(true);
      vi.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockResolvedValue(
        [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]
      );
      vi.mocked(LocalAuthentication.authenticateAsync).mockResolvedValue({
        success: true,
        error: undefined,
      });

      const result = await BiometricAuth.authenticate();

      expect(result.success).toBe(true);
      expect(result.type).toBe(BiometricType.FACE);
      expect(result.error).toBeUndefined();
    });

    it('should return error when biometric not available', async () => {
      vi.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(false);
      vi.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(false);

      const result = await BiometricAuth.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Biometric authentication is not available');
    });

    it('should handle user cancellation', async () => {
      vi.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(true);
      vi.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);
      vi.mocked(LocalAuthentication.authenticateAsync).mockResolvedValue({
        success: false,
        error: 'User cancelled',
      });

      const result = await BiometricAuth.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Biometric authentication cancelled by user');
    });

    it('should handle authentication errors', async () => {
      vi.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(true);
      vi.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);
      vi.mocked(LocalAuthentication.authenticateAsync).mockRejectedValue(
        new Error('Auth failed')
      );

      const result = await BiometricAuth.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Biometric authentication error');
    });

    it('should call authenticateAsync with correct parameters', async () => {
      vi.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(true);
      vi.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);
      vi.mocked(LocalAuthentication.authenticateAsync).mockResolvedValue({
        success: true,
        error: undefined,
      });

      await BiometricAuth.authenticate();

      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: 'ログインするには生体認証が必要です',
        fallbackLabel: 'パスコードを使用',
        disableDeviceFallback: false,
        requireConfirmation: true,
      });
    });
  });

  describe('getPrimaryBiometricType', () => {
    it('should return FACE when available', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockResolvedValue(
        [
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          LocalAuthentication.AuthenticationType.FINGERPRINT,
        ]
      );

      const result = await BiometricAuth.getPrimaryBiometricType();

      expect(result).toBe(BiometricType.FACE);
    });

    it('should return FINGERPRINT when FACE not available', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockResolvedValue(
        [LocalAuthentication.AuthenticationType.FINGERPRINT]
      );

      const result = await BiometricAuth.getPrimaryBiometricType();

      expect(result).toBe(BiometricType.FINGERPRINT);
    });

    it('should return first type as fallback', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockResolvedValue(
        [LocalAuthentication.AuthenticationType.IRIS]
      );

      const result = await BiometricAuth.getPrimaryBiometricType();

      expect(result).toBe(BiometricType.IRIS);
    });

    it('should return undefined when no types available', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockResolvedValue([]);

      const result = await BiometricAuth.getPrimaryBiometricType();

      expect(result).toBeUndefined();
    });

    it('should return undefined on error', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockRejectedValue(
        new Error('Failed')
      );

      const result = await BiometricAuth.getPrimaryBiometricType();

      expect(result).toBeUndefined();
    });
  });

  describe('isFaceIdAvailable', () => {
    it('should return true when Face ID available', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockResolvedValue(
        [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]
      );

      const result = await BiometricAuth.isFaceIdAvailable();

      expect(result).toBe(true);
    });

    it('should return false when Face ID not available', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockResolvedValue(
        [LocalAuthentication.AuthenticationType.FINGERPRINT]
      );

      const result = await BiometricAuth.isFaceIdAvailable();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockRejectedValue(
        new Error('Failed')
      );

      const result = await BiometricAuth.isFaceIdAvailable();

      expect(result).toBe(false);
    });
  });

  describe('isFingerprintAvailable', () => {
    it('should return true when fingerprint available', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockResolvedValue(
        [LocalAuthentication.AuthenticationType.FINGERPRINT]
      );

      const result = await BiometricAuth.isFingerprintAvailable();

      expect(result).toBe(true);
    });

    it('should return false when fingerprint not available', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockResolvedValue(
        [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]
      );

      const result = await BiometricAuth.isFingerprintAvailable();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockRejectedValue(
        new Error('Failed')
      );

      const result = await BiometricAuth.isFingerprintAvailable();

      expect(result).toBe(false);
    });
  });

  describe('isDeviceSecure', () => {
    it('should return true when device is secure', async () => {
      vi.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(true);
      vi.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);

      const result = await BiometricAuth.isDeviceSecure();

      expect(result).toBe(true);
    });

    it('should return false when device is not secure', async () => {
      vi.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(false);
      vi.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(false);

      const result = await BiometricAuth.isDeviceSecure();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      vi.mocked(LocalAuthentication.hasHardwareAsync).mockRejectedValue(
        new Error('Check failed')
      );

      const result = await BiometricAuth.isDeviceSecure();

      expect(result).toBe(false);
    });
  });

  describe('biometricTypeToString', () => {
    it('should convert FACE to "Face ID"', () => {
      const result = BiometricAuth.biometricTypeToString(BiometricType.FACE);
      expect(result).toBe('Face ID');
    });

    it('should convert FINGERPRINT to "Fingerprint"', () => {
      const result = BiometricAuth.biometricTypeToString(BiometricType.FINGERPRINT);
      expect(result).toBe('Fingerprint');
    });

    it('should convert IRIS to "Iris"', () => {
      const result = BiometricAuth.biometricTypeToString(BiometricType.IRIS);
      expect(result).toBe('Iris');
    });

    it('should convert UNKNOWN to "Biometric"', () => {
      const result = BiometricAuth.biometricTypeToString(BiometricType.UNKNOWN);
      expect(result).toBe('Biometric');
    });
  });
});

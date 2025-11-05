/**
 * BiometricAuth
 * 生体認証（Face ID/Touch ID/Fingerprint）を使用したセキュアな認証
 *
 * iOS: Face ID, Touch ID
 * Android: Fingerprint, Face Unlock
 */

import * as LocalAuthentication from 'expo-local-authentication';

export enum BiometricType {
  FACE = 'face',
  FINGERPRINT = 'fingerprint',
  IRIS = 'iris',
  UNKNOWN = 'unknown',
}

export interface BiometricAuthResult {
  success: boolean;
  type?: BiometricType;
  error?: string;
}

/**
 * BiometricAuth クラス
 */
export class BiometricAuth {
  /**
   * 生体認証が利用可能か確認
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
      return false;
    }
  }

  /**
   * サポートされている生体認証タイプを取得
   */
  static async getSupportedTypes(): Promise<BiometricType[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types.map(this.mapAuthenticationTypeToBiometricType);
    } catch (error) {
      console.error('Failed to get supported biometric types:', error);
      return [];
    }
  }

  /**
   * LocalAuthentication.AuthenticationType を BiometricType にマップ
   */
  private static mapAuthenticationTypeToBiometricType(
    type: LocalAuthentication.AuthenticationType
  ): BiometricType {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return BiometricType.FACE;
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return BiometricType.FINGERPRINT;
      case LocalAuthentication.AuthenticationType.IRIS:
        return BiometricType.IRIS;
      default:
        return BiometricType.UNKNOWN;
    }
  }

  /**
   * 生体認証を実行
   */
  static async authenticate(): Promise<BiometricAuthResult> {
    try {
      // 生体認証が利用可能か確認
      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Biometric authentication is not available',
        };
      }

      console.log('Starting biometric authentication');

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'ログインするには生体認証が必要です',
        fallbackLabel: 'パスコードを使用',
        disableDeviceFallback: false,
        requireConfirmation: true,
      });

      if (result.success) {
        console.log('Biometric authentication successful');
        return {
          success: true,
          type: await this.getPrimaryBiometricType(),
        };
      } else {
        console.log('Biometric authentication cancelled');
        return {
          success: false,
          error: 'Biometric authentication cancelled by user',
        };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: `Biometric authentication error: ${error}`,
      };
    }
  }

  /**
   * プライマリ生体認証タイプを取得
   */
  static async getPrimaryBiometricType(): Promise<BiometricType | undefined> {
    try {
      const types = await this.getSupportedTypes();
      // Face が優先、次に Fingerprint
      if (types.includes(BiometricType.FACE)) {
        return BiometricType.FACE;
      } else if (types.includes(BiometricType.FINGERPRINT)) {
        return BiometricType.FINGERPRINT;
      }
      return types[0];
    } catch (error) {
      console.error('Failed to get primary biometric type:', error);
      return undefined;
    }
  }

  /**
   * 生体認証が Face ID か確認
   */
  static async isFaceIdAvailable(): Promise<boolean> {
    try {
      const types = await this.getSupportedTypes();
      return types.includes(BiometricType.FACE);
    } catch (error) {
      console.error('Failed to check Face ID availability:', error);
      return false;
    }
  }

  /**
   * 生体認証が Touch ID / Fingerprint か確認
   */
  static async isFingerprintAvailable(): Promise<boolean> {
    try {
      const types = await this.getSupportedTypes();
      return types.includes(BiometricType.FINGERPRINT);
    } catch (error) {
      console.error('Failed to check fingerprint availability:', error);
      return false;
    }
  }

  /**
   * デバイスがセキュアか確認
   * （例：画面ロック有効化など）
   */
  static async isDeviceSecure(): Promise<boolean> {
    try {
      // expo-local-authentication では直接確認できないため、
      // 生体認証が利用可能か確認することで代替
      return await this.isAvailable();
    } catch (error) {
      console.error('Failed to check device security:', error);
      return false;
    }
  }

  /**
   * 生体認証情報を表示用文字列に変換
   */
  static biometricTypeToString(type: BiometricType): string {
    switch (type) {
      case BiometricType.FACE:
        return 'Face ID';
      case BiometricType.FINGERPRINT:
        return 'Fingerprint';
      case BiometricType.IRIS:
        return 'Iris';
      default:
        return 'Biometric';
    }
  }
}

/**
 * Apple Sign In Implementation
 * Sign in with Apple フロー実装（iOS専用）
 *
 * Apple の推奨認証方法で、以下の機能をサポート：
 * - Face ID / Touch ID による生体認証
 * - プライベートリレー（メールマスキング）
 * - 2段階認証連携
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { AuthToken, User, AuthProvider } from '@/core/domain/entities';
import { ENV } from '@/config/env';

export interface AppleSignInConfig {
  teamId: string;
  bundleId: string;
  keyId: string;
}

export interface AppleAuthResponse {
  identityToken: string;
  authorizationCode?: string;
  user?: AppleUser;
  realUserStatus?: number;
  state?: string;
}

export interface AppleUser {
  name: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    namePrefix?: string;
    nameSuffix?: string;
    nickname?: string;
  };
  email?: string;
  phoneNumber?: string;
}

/**
 * Sign in with Apple クラス
 */
export class AppleSignIn {
  private config: AppleSignInConfig;

  constructor(config: AppleSignInConfig) {
    this.config = config;
  }

  /**
   * Sign in with Apple が利用可能か確認
   */
  static async isAvailable(): Promise<boolean> {
    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch (error) {
      console.error('Failed to check Apple Sign-In availability:', error);
      return false;
    }
  }

  /**
   * Sign in with Apple フロー開始
   */
  async startSignIn(): Promise<AppleAuthResponse> {
    try {
      // Apple Sign-In が利用可能か確認
      const available = await AppleSignIn.isAvailable();
      if (!available) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      console.log('Starting Apple Sign-In flow');

      // Apple認証を開始
      const result = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        operationMode: AppleAuthentication.AppleAuthenticationOperationMode.SIGNIN,
      });

      console.log('Apple Sign-In successful');

      return {
        identityToken: result.identityToken || '',
        authorizationCode: result.authorizationCode,
        user: this.parseAppleUser(result.user),
        realUserStatus: result.realUserStatus,
        state: result.state,
      };
    } catch (error) {
      if (error instanceof AppleAuthentication.AppleAuthenticationMissingResponseError) {
        console.error('Apple Sign-In cancelled by user');
        throw new Error('Apple Sign-In cancelled by user');
      } else if (
        error instanceof AppleAuthentication.AppleAuthenticationError
      ) {
        console.error('Apple Sign-In error:', error.code);
        throw new Error(`Apple Sign-In error: ${error.code}`);
      }
      console.error('Unknown Apple Sign-In error:', error);
      throw error;
    }
  }

  /**
   * Sign up with Apple フロー開始（新規登録用）
   */
  async startSignUp(): Promise<AppleAuthResponse> {
    try {
      const available = await AppleSignIn.isAvailable();
      if (!available) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      console.log('Starting Apple Sign-Up flow');

      const result = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        operationMode: AppleAuthentication.AppleAuthenticationOperationMode.SIGNUP,
      });

      console.log('Apple Sign-Up successful');

      return {
        identityToken: result.identityToken || '',
        authorizationCode: result.authorizationCode,
        user: this.parseAppleUser(result.user),
        realUserStatus: result.realUserStatus,
        state: result.state,
      };
    } catch (error) {
      console.error('Apple Sign-Up error:', error);
      throw error;
    }
  }

  /**
   * Identity Token を検証してユーザー情報を取得
   *
   * 注: このメソッドはバックエンドで実装すべき
   * クライアントで JWT トークンを検証することは推奨されない
   */
  async verifyIdentityToken(
    identityToken: string
  ): Promise<{ sub: string; email?: string; name?: string }> {
    try {
      // バックエンドの検証エンドポイントを呼び出し
      // クライアントでは JWT 署名検証をしない
      const response = await fetch(`${ENV.AUTH_API_URL}/auth/apple/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Identity token verification failed');
      }

      const verified = await response.json();
      return verified;
    } catch (error) {
      console.error('Identity token verification error:', error);
      throw error;
    }
  }

  /**
   * Apple ユーザー情報を解析
   */
  private parseAppleUser(user: any): AppleUser | undefined {
    if (!user) return undefined;

    return {
      name: {
        firstName: user.name?.givenName,
        lastName: user.name?.familyName,
        middleName: user.name?.middleName,
        namePrefix: user.name?.namePrefix,
        nameSuffix: user.name?.nameSuffix,
        nickname: user.name?.nickname,
      },
      email: user.email,
      phoneNumber: user.phoneNumber,
    };
  }

  /**
   * ユーザー情報をアプリの User エンティティに変換
   */
  convertToUser(
    appleResponse: AppleAuthResponse,
    userId: string
  ): User {
    const fullName = this.buildFullName(appleResponse.user?.name);

    return {
      id: userId,
      email: appleResponse.user?.email,
      displayName: fullName || 'Apple User',
      provider: AuthProvider.APPLE,
      providerId: appleResponse.identityToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * フルネームを構築
   */
  private buildFullName(
    name: AppleUser['name'] | undefined
  ): string | undefined {
    if (!name) return undefined;

    const parts = [];
    if (name.namePrefix) parts.push(name.namePrefix);
    if (name.givenName) parts.push(name.givenName);
    if (name.middleName) parts.push(name.middleName);
    if (name.familyName) parts.push(name.familyName);
    if (name.nameSuffix) parts.push(name.nameSuffix);

    return parts.length > 0 ? parts.join(' ') : undefined;
  }

  /**
   * Real User Indicator をチェック
   * Apple は真のユーザーか疑わしいアカウントか判定する
   */
  static getRealUserStatus(
    realUserStatus: number | undefined
  ): 'likely' | 'unsupported' | 'unknown' {
    if (realUserStatus === AppleAuthentication.AppleAuthenticationUserDetectionStatus.LIKELY_REAL) {
      return 'likely';
    } else if (
      realUserStatus ===
      AppleAuthentication.AppleAuthenticationUserDetectionStatus.UNSUPPORTED
    ) {
      return 'unsupported';
    }
    return 'unknown';
  }
}

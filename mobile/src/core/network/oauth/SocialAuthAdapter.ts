/**
 * Social Auth Adapter Pattern
 * プロバイダー別の認証を統一インターフェースで提供
 *
 * アダプタパターンで、異なるプロバイダー（Apple, Google, OAuth）を
 * 統一されたインターフェースで操作可能にする
 */

import { AuthProvider, AuthToken, User } from '@/core/domain/entities';
import { AppleSignIn } from './AppleSignIn';
import { GoogleSignIn } from './GoogleSignIn';
import { OAuth2Client } from './OAuth2Client';
import { ENV } from '@/config/env';

/**
 * Social Auth Provider のインターフェース
 */
export interface ISocialAuthProvider {
  signIn(): Promise<AuthToken>;
  signOut(): Promise<void>;
  isAvailable(): Promise<boolean>;
}

/**
 * Social Auth Adapter
 * 複数のプロバイダーを統一インターフェースで提供
 */
export class SocialAuthAdapter {
  private appleSignIn: AppleSignIn | null = null;
  private googleSignIn: GoogleSignIn | null = null;
  private oauth2Client: OAuth2Client | null = null;

  constructor(
    appleConfig?: any,
    googleConfig?: any,
    oauth2Config?: any
  ) {
    if (appleConfig) {
      this.appleSignIn = new AppleSignIn(appleConfig);
    }
    if (googleConfig) {
      this.googleSignIn = new GoogleSignIn(googleConfig);
    }
    if (oauth2Config) {
      this.oauth2Client = new OAuth2Client(oauth2Config);
    }
  }

  /**
   * Apple でサインイン
   */
  async signInWithApple(): Promise<User> {
    if (!this.appleSignIn) {
      throw new Error('Apple Sign-In is not configured');
    }

    try {
      const available = await AppleSignIn.isAvailable();
      if (!available) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      console.log('Signing in with Apple...');

      const appleResponse = await this.appleSignIn.startSignIn();

      // ここでバックエンドに identity token を送信して、
      // ユーザー ID を取得し、ユーザーを作成または更新
      const userId = await this.verifyWithBackend(
        AuthProvider.APPLE,
        appleResponse.identityToken
      );

      const user = this.appleSignIn.convertToUser(appleResponse, userId);

      console.log('Apple Sign-In successful');
      return user;
    } catch (error) {
      console.error('Apple Sign-In failed:', error);
      throw error;
    }
  }

  /**
   * Google でサインイン
   */
  async signInWithGoogle(): Promise<User> {
    if (!this.googleSignIn) {
      throw new Error('Google Sign-In is not configured');
    }

    try {
      const available = await this.googleSignIn.isAvailable();
      if (!available) {
        throw new Error('Google Sign-In is not available on this device');
      }

      console.log('Signing in with Google...');

      const googleResponse = await this.googleSignIn.startSignIn();

      // ここでバックエンドに ID token を送信して、
      // ユーザー ID を取得し、ユーザーを作成または更新
      const userId = await this.verifyWithBackend(
        AuthProvider.GOOGLE,
        googleResponse.idToken
      );

      const user = this.googleSignIn.convertToUser(googleResponse.user, userId);

      console.log('Google Sign-In successful');
      return user;
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  }

  /**
   * OAuth 2.1 (汎用) でサインイン
   */
  async signInWithOAuth(): Promise<any> {
    if (!this.oauth2Client) {
      throw new Error('OAuth 2.1 is not configured');
    }

    try {
      console.log('Signing in with OAuth 2.1...');

      const authCode = await this.oauth2Client.startLogin();
      const token = await this.oauth2Client.exchangeCodeForToken(authCode.code);

      console.log('OAuth 2.1 Sign-In successful');
      return token;
    } catch (error) {
      console.error('OAuth 2.1 Sign-In failed:', error);
      throw error;
    }
  }

  /**
   * バックエンドでトークンを検証してユーザーを取得
   */
  private async verifyWithBackend(
    provider: AuthProvider,
    token: string
  ): Promise<string> {
    try {
      const response = await fetch(`${ENV.AUTH_API_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          token,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token verification failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.userId;
    } catch (error) {
      console.error('Backend verification failed:', error);
      throw error;
    }
  }

  /**
   * サインアウト
   */
  async signOut(provider: AuthProvider): Promise<void> {
    try {
      console.log(`Signing out from ${provider}...`);

      switch (provider) {
        case AuthProvider.APPLE:
          // Apple では明示的なサインアウトは不要だが、トークンを無効化
          break;

        case AuthProvider.GOOGLE:
          if (this.googleSignIn) {
            await this.googleSignIn.signOut();
          }
          break;

        case AuthProvider.OAUTH:
          // OAuth 2.1 では別途実装が必要
          break;

        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      console.log(`Signed out from ${provider}`);
    } catch (error) {
      console.error(`Sign-out from ${provider} failed:`, error);
      throw error;
    }
  }

  /**
   * プロバイダーが利用可能か確認
   */
  async isProviderAvailable(provider: AuthProvider): Promise<boolean> {
    try {
      switch (provider) {
        case AuthProvider.APPLE:
          return this.appleSignIn ? await AppleSignIn.isAvailable() : false;

        case AuthProvider.GOOGLE:
          return this.googleSignIn ? await this.googleSignIn.isAvailable() : false;

        case AuthProvider.OAUTH:
          return !!this.oauth2Client;

        default:
          return false;
      }
    } catch (error) {
      console.error(`Failed to check availability for ${provider}:`, error);
      return false;
    }
  }

  /**
   * 利用可能なプロバイダーを取得
   */
  async getAvailableProviders(): Promise<AuthProvider[]> {
    const available: AuthProvider[] = [];

    if (await this.isProviderAvailable(AuthProvider.APPLE)) {
      available.push(AuthProvider.APPLE);
    }

    if (await this.isProviderAvailable(AuthProvider.GOOGLE)) {
      available.push(AuthProvider.GOOGLE);
    }

    if (await this.isProviderAvailable(AuthProvider.OAUTH)) {
      available.push(AuthProvider.OAUTH);
    }

    return available;
  }
}

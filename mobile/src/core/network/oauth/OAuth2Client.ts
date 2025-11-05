/**
 * OAuth2Client
 * OAuth 2.1 Proof Key for Code Exchange (PKCE) フロー実装
 * モバイルアプリのセキュアな認証を実現
 */

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { PKCEFlow } from './PKCEFlow';
import {
  OAuthConfig,
  PKCEChallenge,
  AuthToken,
  AuthCode,
  OAuthErrorResponse,
  OAuthTokenResponse,
} from '@/core/domain/entities';

export class OAuth2Client {
  private config: OAuthConfig;
  private pkceChallenge: PKCEChallenge | null = null;
  private state: string | null = null;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * 認可エンドポイントの URL を構築
   */
  private buildAuthorizeUrl(codeChallenge: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUrl,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: state,
    });

    return `${this.config.authorizeUrl}?${params.toString()}`;
  }

  /**
   * ログインフロー開始
   */
  async startLogin(): Promise<AuthCode> {
    try {
      // 1. PKCE チャレンジを生成
      this.pkceChallenge = await PKCEFlow.generateChallenge();

      // 2. State パラメータを生成（CSRF対策）
      this.state = this.generateState();

      // 3. 認可エンドポイント URL を構築
      const authorizeUrl = this.buildAuthorizeUrl(
        this.pkceChallenge.codeChallenge,
        this.state
      );

      console.log('Starting OAuth login flow');

      // 4. ブラウザで認可エンドポイントを開く
      const result = await WebBrowser.openBrowserAsync(authorizeUrl);

      if (result.type !== 'success') {
        throw new Error('Authorization cancelled by user');
      }

      // 5. リダイレクト URL から認可コードを抽出
      const url = result.url;
      const code = this.extractAuthorizationCode(url);
      const returnedState = this.extractState(url);

      // 6. State パラメータの検証（CSRF攻撃対策）
      if (returnedState !== this.state) {
        throw new Error('State parameter mismatch');
      }

      console.log('Authorization code received');

      return {
        code,
        state: returnedState,
      };
    } catch (error) {
      console.error('Login flow error:', error);
      throw error;
    }
  }

  /**
   * 認可コードをトークンに交換
   */
  async exchangeCodeForToken(code: string): Promise<AuthToken> {
    if (!this.pkceChallenge) {
      throw new Error('PKCE challenge not initialized');
    }

    try {
      console.log('Exchanging authorization code for token');

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        ...(this.config.clientSecret && {
          client_secret: this.config.clientSecret,
        }),
        redirect_uri: this.config.redirectUrl,
        code_verifier: this.pkceChallenge.codeVerifier,
      });

      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const error: OAuthErrorResponse = await response.json();
        throw new Error(
          `Token exchange failed: ${error.error} - ${error.error_description}`
        );
      }

      const tokenResponse: OAuthTokenResponse = await response.json();

      return this.parseTokenResponse(tokenResponse);
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  /**
   * リフレッシュトークンを使用してアクセストークンを更新
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthToken> {
    try {
      console.log('Refreshing access token');

      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        ...(this.config.clientSecret && {
          client_secret: this.config.clientSecret,
        }),
      });

      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const error: OAuthErrorResponse = await response.json();
        throw new Error(
          `Token refresh failed: ${error.error} - ${error.error_description}`
        );
      }

      const tokenResponse: OAuthTokenResponse = await response.json();

      return this.parseTokenResponse(tokenResponse);
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * トークンを無効化（ログアウト）
   */
  async revokeToken(token: string): Promise<void> {
    if (!this.config.revokeUrl) {
      console.warn('Revoke URL not configured');
      return;
    }

    try {
      console.log('Revoking token');

      const body = new URLSearchParams({
        token,
        client_id: this.config.clientId,
        ...(this.config.clientSecret && {
          client_secret: this.config.clientSecret,
        }),
      });

      const response = await fetch(this.config.revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        console.warn(`Token revocation failed with status ${response.status}`);
      }

      console.log('Token revoked successfully');
    } catch (error) {
      console.error('Token revocation error:', error);
      throw error;
    }
  }

  /**
   * State パラメータを生成（CSRF攻撃対策）
   */
  private generateState(): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let state = '';
    for (let i = 0; i < 32; i++) {
      state += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return state;
  }

  /**
   * URL から認可コードを抽出
   */
  private extractAuthorizationCode(url: string): string {
    const match = url.match(/[?&]code=([^&]+)/);
    if (!match || !match[1]) {
      throw new Error('Authorization code not found in redirect URL');
    }
    return decodeURIComponent(match[1]);
  }

  /**
   * URL から State パラメータを抽出
   */
  private extractState(url: string): string {
    const match = url.match(/[?&]state=([^&]+)/);
    if (!match || !match[1]) {
      throw new Error('State parameter not found in redirect URL');
    }
    return decodeURIComponent(match[1]);
  }

  /**
   * トークンレスポンスを解析
   */
  private parseTokenResponse(response: OAuthTokenResponse): AuthToken {
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresIn: response.expires_in || 3600,
      tokenType: response.token_type,
      scope: response.scope,
      issuedAt: Math.floor(Date.now() / 1000),
    };
  }
}

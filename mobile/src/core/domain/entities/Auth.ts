/**
 * Auth Entities
 * 認証関連のエンティティ定義
 */

export enum AuthProvider {
  OAUTH = 'oauth',
  APPLE = 'apple',
  GOOGLE = 'google',
}

export interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUrl: string;
  authorizeUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  scopes: string[];
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  method: 'S256' | 'plain';
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
  issuedAt: number;
}

export interface AuthCode {
  code: string;
  state: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  isLoading: boolean;
}

export interface User {
  id: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  provider: AuthProvider;
  providerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OAuthErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

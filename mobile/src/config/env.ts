/**
 * Environment Configuration
 * 環境変数の型安全なアクセスを提供
 */

export const ENV = {
  // OAuth 2.1
  OAUTH_CLIENT_ID: process.env.EXPO_OAUTH_CLIENT_ID || '',
  OAUTH_CLIENT_SECRET: process.env.EXPO_OAUTH_CLIENT_SECRET || '',
  OAUTH_AUTHORIZE_URL: process.env.EXPO_OAUTH_AUTHORIZE_URL || '',
  OAUTH_TOKEN_URL: process.env.EXPO_OAUTH_TOKEN_URL || '',
  OAUTH_REVOKE_URL: process.env.EXPO_OAUTH_REVOKE_URL || '',

  // Apple Sign-In
  APPLE_TEAM_ID: process.env.EXPO_APPLE_TEAM_ID || '',
  APPLE_KEY_ID: process.env.EXPO_APPLE_KEY_ID || '',
  APPLE_BUNDLE_ID: process.env.EXPO_APPLE_BUNDLE_ID || 'com.climbYou.mobile',

  // Google Sign-In
  GOOGLE_CLIENT_ID: process.env.EXPO_GOOGLE_CLIENT_ID || '',
  GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_GOOGLE_ANDROID_CLIENT_ID || '',
  GOOGLE_IOS_CLIENT_ID: process.env.EXPO_GOOGLE_IOS_CLIENT_ID || '',

  // Backend API
  AUTH_API_URL: process.env.EXPO_AUTH_API_URL || 'http://localhost:3000',
  MCP_API_URL: process.env.EXPO_MCP_API_URL || 'http://localhost:3000/mcp',

  // App
  APP_ENV: process.env.EXPO_APP_ENV || 'development',
  APP_VERSION: process.env.EXPO_APP_VERSION || '1.0.0',

  // Firebase
  FIREBASE_API_KEY: process.env.EXPO_FIREBASE_API_KEY || '',
  FIREBASE_PROJECT_ID: process.env.EXPO_FIREBASE_PROJECT_ID || '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: process.env.EXPO_FIREBASE_APP_ID || '',

  // Sentry
  SENTRY_DSN: process.env.EXPO_SENTRY_DSN || '',

  // Debug
  DEBUG_MODE: process.env.EXPO_DEBUG_MODE === 'true',
} as const;

/**
 * 必須環境変数の検証
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  const requiredVars = [
    'OAUTH_CLIENT_ID',
    'OAUTH_AUTHORIZE_URL',
    'OAUTH_TOKEN_URL',
    'AUTH_API_URL',
  ] as const;

  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!ENV[varName]) {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * 環境変数の検証（開発時のみ）
 */
if (__DEV__) {
  const validation = validateEnv();
  if (!validation.valid) {
    console.warn(
      '⚠️ Missing required environment variables:',
      validation.missing.join(', ')
    );
    console.warn('Please check your .env file');
  }
}

/**
 * LoginScreen
 * ログイン画面：OAuth 2.1、生体認証、ソーシャル認証をサポート
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BiometricAuth, SecureTokenStore } from '@/services/auth';
import { SocialAuthAdapter } from '@/core/network/oauth';
import { AuthProvider, User } from '@/core/domain/entities';
import { ENV } from '@/config/env';

// Types
type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  onLoginSuccess?: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Initialize
  useEffect(() => {
    initializeBiometric();
    checkExistingSession();
  }, []);

  /**
   * 生体認証の初期化
   */
  const initializeBiometric = async () => {
    try {
      const available = await BiometricAuth.isAvailable();
      if (available) {
        const types = await BiometricAuth.getSupportedTypes();
        const primary = await BiometricAuth.getPrimaryBiometricType();

        setBiometricAvailable(true);
        setBiometricType(BiometricAuth.biometricTypeToString(primary!));
      }
    } catch (error) {
      console.error('Failed to initialize biometric:', error);
    }
  };

  /**
   * 既存セッションの確認
   */
  const checkExistingSession = async () => {
    try {
      const token = await SecureTokenStore.getToken();
      if (token && (await SecureTokenStore.isTokenValid())) {
        // 有効なトークンがある場合、ホーム画面へ
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Failed to check existing session:', error);
    }
  };

  /**
   * 生体認証によるログイン
   */
  const handleBiometricLogin = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. 生体認証を実行
      const result = await BiometricAuth.authenticate();

      if (!result.success) {
        setError(result.error || '生体認証に失敗しました');
        return;
      }

      // 2. 保存されたトークンを取得
      const token = await SecureTokenStore.getToken();
      if (!token) {
        setError('トークンが見つかりません。パスワードでログインしてください。');
        return;
      }

      // 3. トークンの有効性確認
      const isValid = await SecureTokenStore.isTokenValid();
      if (!isValid) {
        // リフレッシュが必要な場合は、パスワードログインフローへ
        setError('セッションが期限切れです。パスワードで再ログインしてください。');
        return;
      }

      console.log('Biometric login successful');

      // 4. ホーム画面へ遷移
      navigation.replace('Home');
    } catch (error) {
      console.error('Biometric login error:', error);
      setError('ログイン処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Appleでサインイン
   */
  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      const socialAuth = new SocialAuthAdapter({
        teamId: ENV.APPLE_TEAM_ID,
        bundleId: ENV.APPLE_BUNDLE_ID,
        keyId: ENV.APPLE_KEY_ID,
      });

      // Apple Sign-In が利用可能か確認
      const available = await socialAuth.isProviderAvailable(AuthProvider.APPLE);
      if (!available) {
        setError('お使いのデバイスではApple Sign-Inが利用できません');
        return;
      }

      // Sign-In フロー
      const user = await socialAuth.signInWithApple();
      if (!user) {
        setError('Appleでのサインインが失敗しました');
        return;
      }

      console.log('Apple Sign-In successful:', user.email);

      // トークン保存
      const token = await SecureTokenStore.getToken();
      if (token) {
        // ホーム画面へ遷移
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Apple Sign-In error:', error);
      setError('Appleでのサインイン中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Googleでサインイン
   */
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      const socialAuth = new SocialAuthAdapter({
        clientId: ENV.GOOGLE_CLIENT_ID,
        androidClientId: ENV.GOOGLE_ANDROID_CLIENT_ID,
      });

      // Google Sign-In が利用可能か確認
      const available = await socialAuth.isProviderAvailable(AuthProvider.GOOGLE);
      if (!available) {
        setError('お使いのデバイスではGoogle Sign-Inが利用できません');
        return;
      }

      // Sign-In フロー
      const user = await socialAuth.signInWithGoogle();
      if (!user) {
        setError('Googleでのサインインが失敗しました');
        return;
      }

      console.log('Google Sign-In successful:', user.email);

      // トークン保存
      const token = await SecureTokenStore.getToken();
      if (token) {
        // ホーム画面へ遷移
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      setError('Googleでのサインイン中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  /**
   * パスワードでサインイン（別画面へ遷移）
   */
  const handlePasswordSignIn = () => {
    navigation.navigate('SignUp');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>climb-you</Text>
          <Text style={styles.subtitle}>目標を山登りに変える</Text>
        </View>

        {/* エラーメッセージ */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ボタングループ */}
        <View style={styles.buttonGroup}>
          {/* 生体認証ボタン */}
          {biometricAvailable && (
            <TouchableOpacity
              style={[styles.button, styles.biometricButton]}
              onPress={handleBiometricLogin}
              disabled={loading}
              accessibilityLabel={`${biometricType}でログイン`}
              accessibilityHint="生体認証を使用してログインします"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>{biometricType}でログイン</Text>
                  <Text style={styles.buttonDescription}>最も簡単な方法</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Apple Sign-In ボタン */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.button, styles.appleButton]}
              onPress={handleAppleSignIn}
              disabled={loading}
              accessibilityLabel="Appleでサインイン"
              accessibilityHint="Appleアカウントを使用してサインインします"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Appleでサインイン</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Google Sign-In ボタン */}
          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            accessibilityLabel="Googleでサインイン"
            accessibilityHint="Googleアカウントを使用してサインインします"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Googleでサインイン</Text>
            )}
          </TouchableOpacity>

          {/* パスワードでサインイン */}
          <TouchableOpacity
            style={[styles.button, styles.passwordButton]}
            onPress={handlePasswordSignIn}
            disabled={loading}
            accessibilityLabel="パスワードでサインイン"
            accessibilityHint="メールアドレスとパスワードを使用してサインインします"
          >
            {loading ? (
              <ActivityIndicator color="#3C507D" />
            ) : (
              <Text style={[styles.buttonText, styles.passwordButtonText]}>
                パスワードでサインイン
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 利用規約 */}
        <View style={styles.footer}>
          <Text style={styles.termsText}>
            サインインすることで、{' '}
            <Text
              style={styles.link}
              onPress={() => {
                /* 利用規約を開く */
              }}
            >
              利用規約
            </Text>
            と{' '}
            <Text
              style={styles.link}
              onPress={() => {
                /* プライバシーポリシーを開く */
              }}
            >
              プライバシーポリシー
            </Text>
            に同意したものとみなされます
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#112250',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#c62828',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 40,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  biometricButton: {
    backgroundColor: '#E0C58F',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  passwordButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  passwordButtonText: {
    color: '#3C507D',
  },
  buttonDescription: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    opacity: 0.8,
  },
  footer: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: '#3C507D',
    textDecorationLine: 'underline',
  },
});

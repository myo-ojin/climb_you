/**
 * SignUpScreen
 * サインアップ画面：メール/パスワードによる新規登録とログイン
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { OAuth2Client } from '@/core/network/oauth';
import { SecureTokenStore, BiometricAuth } from '@/services/auth';
import { AuthToken } from '@/core/domain/entities';
import { ENV } from '@/config/env';

type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
};

type SignUpScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

interface SignUpScreenProps {
  onSignUpSuccess?: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSignUpSuccess }) => {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  /**
   * メール形式の検証
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * パスワードの検証
   */
  const validatePassword = (password: string): boolean => {
    // 最小8文字、大文字・小文字・数字を含む
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  };

  /**
   * 入力値の検証
   */
  const validateInputs = (): boolean => {
    setError('');

    if (!email.trim()) {
      setError('メールアドレスを入力してください');
      emailRef.current?.focus();
      return false;
    }

    if (!validateEmail(email)) {
      setError('有効なメールアドレスを入力してください');
      emailRef.current?.focus();
      return false;
    }

    if (!password) {
      setError('パスワードを入力してください');
      passwordRef.current?.focus();
      return false;
    }

    if (mode === 'signup') {
      if (!validatePassword(password)) {
        setError('パスワードは8文字以上で、大文字・小文字・数字を含む必要があります');
        passwordRef.current?.focus();
        return false;
      }

      if (password !== confirmPassword) {
        setError('パスワードが一致しません');
        return false;
      }
    }

    return true;
  };

  /**
   * ログイン処理
   */
  const handleLogin = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      // 1. OAuth 2.1 + PKCE フロー
      const oauthClient = new OAuth2Client({
        clientId: ENV.OAUTH_CLIENT_ID,
        redirectUrl: 'com.climbYou://oauth-callback',
        authorizeUrl: ENV.OAUTH_AUTHORIZE_URL,
        tokenUrl: ENV.OAUTH_TOKEN_URL,
        scopes: ['openid', 'profile', 'email'],
      });

      // 2. ログイン開始
      const authResponse = await oauthClient.startLogin();

      // 3. トークン交換
      const token = await oauthClient.exchangeCodeForToken(
        authResponse.code,
        authResponse.state
      );

      // 4. トークンを保存
      await SecureTokenStore.storeToken(token);

      console.log('Login successful');

      // 5. 生体認証の登録を提案
      const biometricAvailable = await BiometricAuth.isAvailable();
      if (biometricAvailable) {
        Alert.alert(
          '生体認証を登録',
          'セキュリティを強化するため、生体認証（Face ID/Touch ID）の登録をお勧めします。',
          [
            {
              text: 'スキップ',
              onPress: () => {
                navigation.replace('Home');
              },
            },
            {
              text: '登録する',
              onPress: async () => {
                const result = await BiometricAuth.authenticate();
                if (result.success) {
                  Alert.alert('登録完了', '生体認証が登録されました');
                }
                navigation.replace('Home');
              },
            },
          ]
        );
      } else {
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('ログインに失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  /**
   * サインアップ処理
   */
  const handleSignUp = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      // 1. ユーザー登録 API を呼び出し（バックエンド実装予定）
      const response = await fetch(ENV.AUTH_API_URL + '/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'サインアップに失敗しました');
      }

      const data = await response.json();

      // 2. トークンを保存
      const authToken: AuthToken = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        tokenType: 'Bearer',
        scope: data.scope,
        issuedAt: Math.floor(Date.now() / 1000),
      };

      await SecureTokenStore.storeToken(authToken);

      console.log('Sign up successful');

      // 3. ホーム画面へ遷移
      navigation.replace('Home');
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error instanceof Error ? error.message : 'サインアップに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{mode === 'login' ? 'ログイン' : 'アカウント作成'}</Text>
        </View>

        {/* エラーメッセージ */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* フォーム */}
        <View style={styles.form}>
          {/* メールアドレス入力 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>メールアドレス</Text>
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="user@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              value={email}
              onChangeText={setEmail}
              accessibilityLabel="メールアドレス入力フィールド"
              accessibilityHint="メールアドレスを入力します"
            />
          </View>

          {/* パスワード入力 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>パスワード</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                ref={passwordRef}
                style={styles.passwordInput}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
                value={password}
                onChangeText={setPassword}
                accessibilityLabel="パスワード入力フィールド"
                accessibilityHint="パスワードを入力します"
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
                accessible
                accessibilityLabel={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
              >
                <Text style={styles.showPasswordText}>{showPassword ? '非表示' : '表示'}</Text>
              </TouchableOpacity>
            </View>
            {mode === 'signup' && (
              <Text style={styles.passwordHint}>
                8文字以上で、大文字・小文字・数字を含める必要があります
              </Text>
            )}
          </View>

          {/* パスワード確認入力（サインアップ時のみ） */}
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード確認</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                accessibilityLabel="パスワード確認入力フィールド"
                accessibilityHint="パスワードを再度入力します"
              />
            </View>
          )}
        </View>

        {/* ボタン */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={mode === 'login' ? handleLogin : handleSignUp}
            disabled={loading}
            accessible
            accessibilityLabel={mode === 'login' ? 'ログイン' : 'アカウントを作成'}
            accessibilityHint="認証情報でログイン/サインアップします"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{mode === 'login' ? 'ログイン' : '作成'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* モード切替 */}
        <View style={styles.modeSwitch}>
          <Text style={styles.modeSwitchText}>
            {mode === 'login' ? 'アカウントをお持ちでない方？ ' : 'すでにアカウントをお持ちの方？ '}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
            disabled={loading}
          >
            <Text style={styles.modeSwitchLink}>
              {mode === 'login' ? 'サインアップ' : 'ログイン'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* パスワード忘却 */}
        {mode === 'login' && (
          <TouchableOpacity
            style={styles.forgotPassword}
            disabled={loading}
            onPress={() => {
              Alert.alert(
                'パスワード忘却',
                '登録したメールアドレスを入力してください。リセットリンクを送信します。'
              );
            }}
          >
            <Text style={styles.forgotPasswordText}>パスワードを忘れた場合</Text>
          </TouchableOpacity>
        )}
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
    paddingVertical: 20,
  },
  header: {
    marginBottom: 30,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3C507D',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#112250',
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
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  showPasswordButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  showPasswordText: {
    fontSize: 12,
    color: '#3C507D',
    fontWeight: '600',
  },
  passwordHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#3C507D',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modeSwitch: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modeSwitchText: {
    fontSize: 14,
    color: '#666',
  },
  modeSwitchLink: {
    fontSize: 14,
    color: '#3C507D',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#3C507D',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

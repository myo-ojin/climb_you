/**
 * Auth Navigator
 * 認証関連画面のナビゲーション
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { LoginScreen, SignUpScreen } from '@/features/auth/screens';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Auth Navigator
 */
export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
};

/**
 * Root Navigator
 * アプリケーションのルートナビゲーター
 * 認証状態に応じてAuthNavigatorまたはMainNavigatorを表示
 */

import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingScreen } from '@/features/onboarding/screens';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectIsAuthenticated, selectAuthLoading, restoreSession } from '@/store/slices';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root Navigator
 */
export const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);

  /**
   * アプリ起動時にセッションを復元
   */
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  /**
   * ローディング中は Loading Indicator を表示
   */
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3C507D" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {isAuthenticated ? (
        <>
          {/* Authenticated Screens */}
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
        </>
      ) : (
        <>
          {/* Unauthenticated Screens */}
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
});

/**
 * Main application navigation
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { UserRepository } from '../repositories/userRepository';

const Stack = createNativeStackNavigator();

export type RootStackParamList = {
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Home: undefined;
  Input: undefined;
  Output: undefined;
  ItensPossiveis: undefined;
};

// Authentication stack (Login and Register)
const AuthStack = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen
            {...(props as NativeStackScreenProps<RootStackParamList, 'Login'>)}
            onLoginSuccess={onLoginSuccess}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {(props) => (
          <RegisterScreen
            {...(props as NativeStackScreenProps<RootStackParamList, 'Register'>)}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

// Main stack (Home and other authenticated screens)
const MainStack = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Home"
    >
      <Stack.Screen name="Home">
        {(props) => (
          <HomeScreen
            {...(props as NativeStackScreenProps<RootStackParamList, 'Home'>)}
            onLogout={onLogout}
          />
        )}
      </Stack.Screen>
      {/* Other screens will be added here */}
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  // RF-004: Check currentUser when opening the app
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check authentication when component mounts
    const currentUser = UserRepository.getCurrentUser();
    setIsAuthenticated(!!currentUser);
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    UserRepository.clearCurrentUser();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    // Can show a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainStack onLogout={handleLogout} />
      ) : (
        <AuthStack onLoginSuccess={handleLoginSuccess} />
      )}
    </NavigationContainer>
  );
};



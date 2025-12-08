/**
 * Main application navigation
 */

import { NavigationContainer } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { UserRepository } from "../repositories/userRepository";
import { HomeScreen } from "../screens/HomeScreen";
import { InputScreen } from "../screens/InputScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { OutputScreen } from "../screens/OutputScreen";
import { PossibleItemsScreen } from "../screens/PossibleItemsScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { StockScreen } from "../screens/StockScreen";

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
	Stock: undefined;
};

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
						{...(props as NativeStackScreenProps<RootStackParamList, "Login">)}
						onLoginSuccess={onLoginSuccess}
					/>
				)}
			</Stack.Screen>
			<Stack.Screen name="Register">
				{(props) => (
					<RegisterScreen
						{...(props as NativeStackScreenProps<
							RootStackParamList,
							"Register"
						>)}
					/>
				)}
			</Stack.Screen>
		</Stack.Navigator>
	);
};

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
						{...(props as NativeStackScreenProps<RootStackParamList, "Home">)}
						onLogout={onLogout}
					/>
				)}
			</Stack.Screen>
			<Stack.Screen name="Input">
				{(props) => (
					<InputScreen
						{...(props as NativeStackScreenProps<RootStackParamList, "Input">)}
					/>
				)}
			</Stack.Screen>
			<Stack.Screen name="Stock">
				{(props) => (
					<StockScreen
						{...(props as NativeStackScreenProps<RootStackParamList, "Stock">)}
					/>
				)}
			</Stack.Screen>
			<Stack.Screen name="Output">
				{(props) => (
					<OutputScreen
						{...(props as NativeStackScreenProps<RootStackParamList, "Output">)}
					/>
				)}
			</Stack.Screen>
			<Stack.Screen name="ItensPossiveis">
				{(props) => (
					<PossibleItemsScreen
						{...(props as NativeStackScreenProps<
							RootStackParamList,
							"ItensPossiveis"
						>)}
					/>
				)}
			</Stack.Screen>
		</Stack.Navigator>
	);
};

export const AppNavigator = () => {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
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

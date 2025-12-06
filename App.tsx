/**
 * FlashCookie App
 * Stock Management with AI
 *
 * @format
 */

import { config } from "@gluestack-ui/config";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { useEffect } from "react";
import { StatusBar, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SplashScreen from "react-native-splash-screen";
import { AppNavigator } from "./src/navigation/AppNavigator";

function App() {
	const isDarkMode = useColorScheme() === "dark";

	useEffect(() => {
		// Hide splash screen after app loads
		SplashScreen.hide();
	}, []);

	return (
		<GluestackUIProvider config={config}>
			<SafeAreaProvider>
				<StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
				<AppNavigator />
			</SafeAreaProvider>
		</GluestackUIProvider>
	);
}

export default App;

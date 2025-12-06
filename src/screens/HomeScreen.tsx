/**
 * Home Screen
 * RF-006: Main screen after login
 */

import {
	Button,
	ButtonText,
	Heading,
	Text,
	VStack,
} from "@gluestack-ui/themed";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { UserRepository } from "../repositories/userRepository";

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, "Home"> & {
	onLogout?: () => void;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
	navigation,
	onLogout,
}) => {
	const handleLogout = () => {
		// RF-005: Remove currentUser from MMKV and redirect to Login
		UserRepository.clearCurrentUser();
		if (onLogout) {
			onLogout();
		}
	};

	const currentUser = UserRepository.getCurrentUser();

	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			<View style={styles.content}>
				<VStack space="xl" width="100%" padding={24}>
					<VStack space="md">
						<Heading size="2xl" color="$primary500">
							FlashCookie
						</Heading>
						{currentUser && (
							<Text size="md" color="$gray600">
								Bem-vindo, {currentUser.email}!
							</Text>
						)}
					</VStack>

					<VStack space="md" width="100%">
						<Button
							onPress={() => navigation.navigate("Input")}
							size="lg"
							variant="solid"
						>
							<ButtonText>Entrada de Estoque</ButtonText>
						</Button>

						<Button
							onPress={() => navigation.navigate("Stock")}
							size="lg"
							variant="solid"
						>
							<ButtonText>Ver Estoque</ButtonText>
						</Button>

						<Button
							onPress={() => navigation.navigate("Output")}
							size="lg"
							variant="solid"
						>
							<ButtonText>Saída de Estoque</ButtonText>
						</Button>

						<Button
							onPress={() => {
								console.log('🏠 [HOME] Navegando para tela de Itens Possíveis');
								navigation.navigate("ItensPossiveis");
							}}
							size="lg"
							variant="solid"
						>
							<ButtonText>Itens Possíveis</ButtonText>
						</Button>

						<Button
							onPress={handleLogout}
							size="md"
							variant="outline"
							marginTop={24}
						>
							<ButtonText>Sair</ButtonText>
						</Button>
					</VStack>
				</VStack>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	content: {
		flex: 1,
		paddingTop: 20,
	},
});

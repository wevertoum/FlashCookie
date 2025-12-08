/**
 * Login Screen
 * RF-003: Screen for user authentication
 */

import {
	Button,
	ButtonText,
	FormControl,
	FormControlError,
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
	Input,
	InputField,
	Text,
	VStack,
} from "@gluestack-ui/themed";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { UserRepository } from "../repositories/userRepository";
import { validateEmail } from "../utils/validation";

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, "Login"> & {
	onLoginSuccess: () => void;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({
	navigation,
	onLoginSuccess,
}) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [emailError, setEmailError] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	const validateForm = (): boolean => {
		let isValid = true;

		// RF-003: Validations - Email and password required
		if (!email.trim()) {
			setEmailError("Email é obrigatório");
			isValid = false;
		} else if (!validateEmail(email)) {
			setEmailError("Email inválido");
			isValid = false;
		} else {
			setEmailError("");
		}

		if (!password.trim()) {
			setPasswordError("Senha é obrigatória");
			isValid = false;
		} else {
			setPasswordError("");
		}

		return isValid;
	};

	const handleLogin = async () => {
		if (!validateForm()) {
			return;
		}

		setIsLoading(true);

		try {
			// RF-003: Search user in MMKV by email and validate password
			const user = UserRepository.validateCredentials(email.trim(), password);

			if (!user) {
				// RF-003: If invalid: display error message
				setIsLoading(false);
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						setTimeout(() => {
							if (isMountedRef.current) {
								try {
									Alert.alert("Erro", "Email ou senha incorretos");
								} catch (error) {
									console.warn("Failed to show alert:", error);
								}
							}
						}, 800);
					});
				});
				return;
			}

			// RF-004: Save currentUser in MMKV after successful login
			UserRepository.setCurrentUser(user);

			// RF-003: If valid: redirect to Home screen
			setIsLoading(false);
			onLoginSuccess();
		} catch {
			setIsLoading(false);
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setTimeout(() => {
						if (isMountedRef.current) {
							try {
								Alert.alert(
									"Erro",
									"Ocorreu um erro ao fazer login. Tente novamente.",
								);
							} catch (error) {
								console.warn("Failed to show alert:", error);
							}
						}
					}, 800);
				});
			});
		}
	};

	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<View style={styles.content}>
					<VStack space="xl" width="100%" paddingHorizontal={24}>
						<VStack space="md" alignItems="center">
							<Image
								source={require("../assets/FlashCookie_logotipo_cropped.png")}
								style={styles.logo}
								resizeMode="contain"
							/>
							<Text size="lg" color="$gray600">
								Faça login para continuar
							</Text>
						</VStack>

						<VStack space="lg" width="100%">
							<FormControl isInvalid={!!emailError}>
								<FormControlLabel>
									<FormControlLabelText>Email</FormControlLabelText>
								</FormControlLabel>
								<Input>
									<InputField
										placeholder="seu@email.com"
										value={email}
										onChangeText={setEmail}
										keyboardType="email-address"
										autoCapitalize="none"
										autoCorrect={false}
									/>
								</Input>
								{emailError && (
									<FormControlError>
										<FormControlErrorText>{emailError}</FormControlErrorText>
									</FormControlError>
								)}
							</FormControl>

							<FormControl isInvalid={!!passwordError}>
								<FormControlLabel>
									<FormControlLabelText>Senha</FormControlLabelText>
								</FormControlLabel>
								<Input>
									<InputField
										placeholder="Digite sua senha"
										value={password}
										onChangeText={setPassword}
										secureTextEntry
										autoCapitalize="none"
									/>
								</Input>
								{passwordError && (
									<FormControlError>
										<FormControlErrorText>{passwordError}</FormControlErrorText>
									</FormControlError>
								)}
							</FormControl>

							<Button
								onPress={handleLogin}
								isDisabled={isLoading}
								size="lg"
								variant="solid"
							>
								<ButtonText>Entrar</ButtonText>
							</Button>

							<Button
								onPress={() => navigation.navigate("Register")}
								variant="link"
								size="sm"
							>
								<ButtonText>Não tem uma conta? Cadastre-se</ButtonText>
							</Button>
						</VStack>
					</VStack>
				</View>
			</KeyboardAvoidingView>
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
		justifyContent: "center",
		alignItems: "center",
	},
	logo: {
		width: 200,
		height: 80,
		marginBottom: 8,
	},
});

/**
 * Registration Screen
 * RF-001: Initial screen for new user registration
 */

import {
	Button,
	ButtonText,
	FormControl,
	FormControlError,
	FormControlErrorText,
	FormControlLabel,
	FormControlLabelText,
	Heading,
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
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { UserRepository } from "../repositories/userRepository";
import {
	validateEmail,
	validatePassword,
	validatePasswordConfirmation,
} from "../utils/validation";

type RegisterScreenProps = NativeStackScreenProps<
	RootStackParamList,
	"Register"
>;

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
	navigation,
}) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [emailError, setEmailError] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [confirmPasswordError, setConfirmPasswordError] = useState("");
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

		// RF-001: Valid email validation
		if (!email.trim()) {
			setEmailError("Email é obrigatório");
			isValid = false;
		} else if (!validateEmail(email)) {
			setEmailError("Email inválido");
			isValid = false;
		} else {
			setEmailError("");
		}

		// RF-001: Password validation (minimum characters)
		if (!password.trim()) {
			setPasswordError("Senha é obrigatória");
			isValid = false;
		} else if (!validatePassword(password)) {
			setPasswordError("Senha deve ter no mínimo 6 caracteres");
			isValid = false;
		} else {
			setPasswordError("");
		}

		// RF-001: Validate password and password confirmation are equal
		if (!confirmPassword.trim()) {
			setConfirmPasswordError("Confirmação de senha é obrigatória");
			isValid = false;
		} else if (!validatePasswordConfirmation(password, confirmPassword)) {
			setConfirmPasswordError("As senhas não coincidem");
			isValid = false;
		} else {
			setConfirmPasswordError("");
		}

		return isValid;
	};

	const handleRegister = async () => {
		if (!validateForm()) {
			return;
		}

		setIsLoading(true);

		try {
			// RF-001: Check if user already exists
			const existingUser = UserRepository.getUserByEmail(email.trim());
			if (existingUser) {
				setIsLoading(false);
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						setTimeout(() => {
							if (isMountedRef.current) {
								try {
									Alert.alert("Erro", "Este email já está cadastrado");
								} catch (error) {
									console.warn("Failed to show alert:", error);
								}
							}
						}, 800);
					});
				});
				return;
			}

			// RF-001, RF-002: Save data in MMKV users table
			UserRepository.createUser(email.trim(), password);

			setIsLoading(false);
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setTimeout(() => {
						if (isMountedRef.current) {
							try {
								Alert.alert(
									"Sucesso",
									"Cadastro realizado com sucesso! Faça login para continuar.",
									[
										{
											text: "OK",
											onPress: () => {
												// RF-001: After successful registration, redirect to login screen
												navigation.navigate("Login");
											},
										},
									],
								);
							} catch (error) {
								console.warn("Failed to show alert:", error);
							}
						}
					}, 800);
				});
			});
		} catch {
			setIsLoading(false);
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setTimeout(() => {
						if (isMountedRef.current) {
							try {
								Alert.alert(
									"Erro",
									"Ocorreu um erro ao realizar o cadastro. Tente novamente.",
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
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.content}>
						<VStack space="xl" width="100%" paddingHorizontal={24}>
							<VStack space="md" alignItems="center">
								<Heading size="2xl" color="$primary500">
									Criar Conta
								</Heading>
								<Text size="lg" color="$gray600">
									Preencha os dados para se cadastrar
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
											placeholder="Mínimo 6 caracteres"
											value={password}
											onChangeText={setPassword}
											secureTextEntry
											autoCapitalize="none"
										/>
									</Input>
									{passwordError && (
										<FormControlError>
											<FormControlErrorText>
												{passwordError}
											</FormControlErrorText>
										</FormControlError>
									)}
								</FormControl>

								<FormControl isInvalid={!!confirmPasswordError}>
									<FormControlLabel>
										<FormControlLabelText>Confirmar Senha</FormControlLabelText>
									</FormControlLabel>
									<Input>
										<InputField
											placeholder="Digite a senha novamente"
											value={confirmPassword}
											onChangeText={setConfirmPassword}
											secureTextEntry
											autoCapitalize="none"
										/>
									</Input>
									{confirmPasswordError && (
										<FormControlError>
											<FormControlErrorText>
												{confirmPasswordError}
											</FormControlErrorText>
										</FormControlError>
									)}
								</FormControl>

								<Button
									onPress={handleRegister}
									isDisabled={isLoading}
									size="lg"
									variant="solid"
								>
									<ButtonText>Cadastrar</ButtonText>
								</Button>

								<Button
									onPress={() => navigation.navigate("Login")}
									variant="link"
									size="sm"
								>
									<ButtonText>Já tem uma conta? Faça login</ButtonText>
								</Button>
							</VStack>
						</VStack>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	scrollContent: {
		flexGrow: 1,
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 40,
	},
});

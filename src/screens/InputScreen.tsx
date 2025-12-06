/**
 * Input Screen (Stock Entry)
 * RF-007 to RF-014: Invoice reading and stock entry
 */

import {
	Button,
	ButtonText,
	FormControl,
	FormControlLabel,
	FormControlLabelText,
	Heading,
	Input,
	InputField,
	Select,
	SelectBackdrop,
	SelectContent,
	SelectDragIndicator,
	SelectDragIndicatorWrapper,
	SelectInput,
	SelectItem,
	SelectPortal,
	SelectTrigger,
	Text,
	VStack,
} from "@gluestack-ui/themed";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type React from "react";
import { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet } from "react-native";
import {
	type ImagePickerResponse,
	launchCamera,
	launchImageLibrary,
} from "react-native-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/AppNavigator";
import {
	createStockItem,
	getAllStockItems,
	updateStockItemQuantity,
} from "../repositories/stockRepository";
import { extractInvoiceItems } from "../services/openaiGateway";
import { Unit } from "../types";
import { findBestMatch } from "../utils/fuzzySearch";
import {
	getOptimalImagePickerOptions,
	prepareImageForOpenAI,
} from "../utils/imageCompression";
import { convertUnit, normalizeUnit } from "../utils/unitConversion";

type InputScreenProps = NativeStackScreenProps<RootStackParamList, "Input">;

interface EditableItem {
	id: string;
	nome: string;
	quantidade: number;
	unidade: Unit;
}

const UNITS: Array<{ label: string; value: Unit }> = [
	{ label: "kg", value: Unit.KG },
	{ label: "g", value: Unit.G },
	{ label: "L", value: Unit.L },
	{ label: "mL", value: Unit.ML },
	{ label: "un", value: Unit.UN },
	{ label: "duzia", value: Unit.DUZIA },
];

export const InputScreen: React.FC<InputScreenProps> = ({ navigation }) => {
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [imageBase64, setImageBase64] = useState<string | null>(null);
	const [items, setItems] = useState<EditableItem[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleCaptureImage = () => {
		try {
			Alert.alert("Capturar Nota Fiscal", "Escolha uma opção", [
				{
					text: "Câmera",
					onPress: () => {
						try {
							launchCamera(
								getOptimalImagePickerOptions(),
								(response: ImagePickerResponse) => {
									console.log(
										"Camera response:",
										JSON.stringify(response, null, 2),
									);

									if (response.didCancel) {
										console.log("User cancelled camera");
										return;
									}

									if (response.errorCode) {
										console.error(
											"Camera error:",
											response.errorCode,
											response.errorMessage,
										);
										Alert.alert(
											"Erro",
											`Erro ao capturar imagem: ${response.errorMessage || response.errorCode}`,
										);
										return;
									}

									const asset = response.assets?.[0];
									if (asset) {
										console.log("Asset selected:", {
											uri: asset.uri,
											type: asset.type,
											fileName: asset.fileName,
											fileSize: asset.fileSize,
											hasBase64: !!asset.base64,
										});

										setImageUri(asset.uri || null);
										setImageBase64(
											asset.base64
												? `data:image/jpeg;base64,${asset.base64}`
												: null,
										);
									} else {
										console.warn("No assets in camera response");
										Alert.alert("Erro", "Nenhuma imagem foi capturada");
									}
								},
							);
						} catch (error) {
							console.error("Error launching camera:", error);
							Alert.alert(
								"Erro",
								"Erro ao abrir a câmera. Verifique se o módulo está instalado corretamente.",
							);
						}
					},
				},
				{
					text: "Galeria",
					onPress: () => {
						try {
							launchImageLibrary(
								getOptimalImagePickerOptions(),
								(response: ImagePickerResponse) => {
									console.log(
										"Gallery response:",
										JSON.stringify(response, null, 2),
									);

									if (response.didCancel) {
										console.log("User cancelled gallery");
										return;
									}

									if (response.errorCode) {
										console.error(
											"Gallery error:",
											response.errorCode,
											response.errorMessage,
										);
										Alert.alert(
											"Erro",
											`Erro ao selecionar imagem: ${response.errorMessage || response.errorCode}`,
										);
										return;
									}

									const asset = response.assets?.[0];
									if (asset) {
										console.log("Asset selected:", {
											uri: asset.uri,
											type: asset.type,
											fileName: asset.fileName,
											fileSize: asset.fileSize,
											hasBase64: !!asset.base64,
										});

										setImageUri(asset.uri || null);
										setImageBase64(
											asset.base64
												? `data:image/jpeg;base64,${asset.base64}`
												: null,
										);
									} else {
										console.warn("No assets in gallery response");
										Alert.alert("Erro", "Nenhuma imagem foi selecionada");
									}
								},
							);
						} catch (error) {
							console.error("Error launching image library:", error);
							Alert.alert(
								"Erro",
								"Erro ao abrir a galeria. Verifique se o módulo está instalado corretamente.",
							);
						}
					},
				},
				{
					text: "Cancelar",
					style: "cancel",
				},
			]);
		} catch (error) {
			console.error("Error in handleCaptureImage:", error);
			Alert.alert(
				"Erro",
				"Erro ao abrir seletor de imagem. O módulo react-native-image-picker pode não estar instalado corretamente. Por favor, faça rebuild do app.",
			);
		}
	};

	const handleProcessImage = async () => {
		if (!imageBase64) {
			Alert.alert("Erro", "Nenhuma imagem selecionada");
			return;
		}

		setIsProcessing(true);

		try {
			const compressedImage = await prepareImageForOpenAI(imageBase64);
			const extractedItems = await extractInvoiceItems(compressedImage);

			if (extractedItems.length === 0) {
				Alert.alert(
					"Erro",
					"Não foi possível extrair os dados automaticamente. Deseja inserir manualmente?",
					[
						{
							text: "Inserir manualmente",
							onPress: () => {
								setItems([
									{
										id: Date.now().toString(),
										nome: "",
										quantidade: 0,
										unidade: Unit.KG,
									},
								]);
							},
						},
						{
							text: "Tentar novamente",
							style: "cancel",
						},
					],
				);
				setIsProcessing(false);
				return;
			}

			const editableItems: EditableItem[] = extractedItems.map(
				(item, index) => ({
					id: `${Date.now()}-${index}`,
					nome: item.nome,
					quantidade: item.quantidade,
					unidade: normalizeUnit(item.unidade),
				}),
			);

			setItems(editableItems);
		} catch (error) {
			console.error("Error processing image:", error);
			Alert.alert(
				"Erro",
				"Não foi possível extrair os dados automaticamente. Deseja inserir manualmente?",
				[
					{
						text: "Inserir manualmente",
						onPress: () => {
							setItems([
								{
									id: Date.now().toString(),
									nome: "",
									quantidade: 0,
									unidade: Unit.KG,
								},
							]);
						},
					},
					{
						text: "Tentar novamente",
						style: "cancel",
					},
				],
			);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleAddManualItem = () => {
		setItems([
			...items,
			{
				id: Date.now().toString(),
				nome: "",
				quantidade: 0,
				unidade: Unit.KG,
			},
		]);
	};

	const handleRemoveItem = (itemId: string) => {
		setItems(items.filter((item) => item.id !== itemId));
	};

	const handleUpdateItem = (
		itemId: string,
		field: keyof EditableItem,
		value: string | number | Unit,
	) => {
		setItems(
			items.map((item) =>
				item.id === itemId ? { ...item, [field]: value } : item,
			),
		);
	};

	const handleConfirmItems = async () => {
		const invalidItems = items.filter(
			(item) => !item.nome.trim() || item.quantidade <= 0,
		);

		if (invalidItems.length > 0) {
			Alert.alert("Erro", "Preencha todos os campos corretamente");
			return;
		}

		setIsLoading(true);

		try {
			const stockItems = getAllStockItems();

			for (const item of items) {
				const similarItem = findBestMatch(item.nome, stockItems, 0.7);

				if (similarItem) {
					const sourceUnit = item.unidade;
					const targetUnit = similarItem.unidade;

					let quantityToAdd = item.quantidade;

					if (sourceUnit !== targetUnit) {
						quantityToAdd = convertUnit(
							item.quantidade,
							sourceUnit,
							targetUnit,
						);
					}

					updateStockItemQuantity(similarItem.id, quantityToAdd);
				} else {
					createStockItem(item.nome.trim(), item.quantidade, item.unidade);
				}
			}

			Alert.alert("Sucesso", "Estoque atualizado com sucesso!", [
				{
					text: "OK",
					onPress: () => {
						navigation.navigate("Home");
					},
				},
			]);
		} catch (error) {
			console.error("Error updating stock:", error);
			Alert.alert("Erro", "Ocorreu um erro ao atualizar o estoque");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<VStack space="xl" width="100%" padding={24}>
					<Heading size="2xl" color="$primary500">
						Entrada de Estoque
					</Heading>

					{!imageUri && items.length === 0 && (
						<VStack space="md" width="100%">
							<Button onPress={handleCaptureImage} size="lg" variant="solid">
								<ButtonText>Capturar Nota Fiscal</ButtonText>
							</Button>

							<Button onPress={handleAddManualItem} size="lg" variant="outline">
								<ButtonText>Inserir Manualmente</ButtonText>
							</Button>
						</VStack>
					)}

					{imageUri && (
						<VStack space="md" width="100%">
							<Image
								source={{ uri: imageUri }}
								style={styles.previewImage}
								resizeMode="contain"
							/>

							{items.length === 0 && (
								<VStack space="md" width="100%">
									<Button
										onPress={handleProcessImage}
										isDisabled={isProcessing}
										size="lg"
										variant="solid"
									>
										<ButtonText>
											{isProcessing ? "Processando..." : "Usar esta foto"}
										</ButtonText>
									</Button>

									<Button
										onPress={handleCaptureImage}
										size="md"
										variant="outline"
									>
										<ButtonText>Tirar novamente</ButtonText>
									</Button>
								</VStack>
							)}
						</VStack>
					)}

					{items.length > 0 && (
						<VStack space="lg" width="100%">
							<Text size="lg" fontWeight="$bold">
								Itens Extraídos ({items.length})
							</Text>

							{items.map((item, index) => (
								<VStack
									key={item.id}
									space="md"
									width="100%"
									padding={16}
									backgroundColor="$gray100"
									borderRadius={8}
								>
									<Text size="sm" color="$gray600">
										Item {index + 1}
									</Text>

									<FormControl>
										<FormControlLabel>
											<FormControlLabelText>
												Nome do Produto
											</FormControlLabelText>
										</FormControlLabel>
										<Input>
											<InputField
												placeholder="Nome do produto"
												value={item.nome}
												onChangeText={(value) =>
													handleUpdateItem(item.id, "nome", value)
												}
											/>
										</Input>
									</FormControl>

									<FormControl>
										<FormControlLabel>
											<FormControlLabelText>Quantidade</FormControlLabelText>
										</FormControlLabel>
										<Input>
											<InputField
												placeholder="0"
												value={item.quantidade.toString()}
												onChangeText={(value) => {
													const num = parseFloat(value) || 0;
													handleUpdateItem(item.id, "quantidade", num);
												}}
												keyboardType="numeric"
											/>
										</Input>
									</FormControl>

									<FormControl>
										<FormControlLabel>
											<FormControlLabelText>
												Unidade de Medida
											</FormControlLabelText>
										</FormControlLabel>
										<Select
											selectedValue={item.unidade}
											onValueChange={(value) =>
												handleUpdateItem(item.id, "unidade", value as Unit)
											}
										>
											<SelectTrigger variant="outline" size="md">
												<SelectInput placeholder="Selecione a unidade" />
											</SelectTrigger>
											<SelectPortal>
												<SelectBackdrop />
												<SelectContent>
													<SelectDragIndicatorWrapper>
														<SelectDragIndicator />
													</SelectDragIndicatorWrapper>
													{UNITS.map((unit) => (
														<SelectItem
															key={unit.value}
															label={unit.label}
															value={unit.value}
														/>
													))}
												</SelectContent>
											</SelectPortal>
										</Select>
									</FormControl>

									<Button
										onPress={() => handleRemoveItem(item.id)}
										size="sm"
										variant="outline"
									>
										<ButtonText>Remover Item</ButtonText>
									</Button>
								</VStack>
							))}

							<VStack space="md" width="100%">
								<Button
									onPress={handleAddManualItem}
									size="md"
									variant="outline"
								>
									<ButtonText>Adicionar Item</ButtonText>
								</Button>

								<Button
									onPress={handleConfirmItems}
									isDisabled={isLoading}
									size="lg"
									variant="solid"
								>
									<ButtonText>
										{isLoading ? "Processando..." : "Confirmar"}
									</ButtonText>
								</Button>

								<Button
									onPress={() => {
										setItems([]);
										setImageUri(null);
										setImageBase64(null);
									}}
									size="md"
									variant="outline"
								>
									<ButtonText>Cancelar</ButtonText>
								</Button>
							</VStack>
						</VStack>
					)}
				</VStack>
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	scrollContent: {
		paddingVertical: 20,
	},
	previewImage: {
		width: "100%",
		height: 300,
		borderRadius: 8,
		backgroundColor: "#F5F5F5",
	},
});

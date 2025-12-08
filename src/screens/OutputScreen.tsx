/**
 * Output Screen (Stock Removal)
 * RF-015 to RF-023: Audio processing and stock removal
 */

import {
	Button,
	ButtonText,
	FormControl,
	FormControlLabel,
	FormControlLabelText,
	Heading,
	HStack,
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
import { useEffect, useRef, useState } from "react";
import {
	Alert,
	PermissionsAndroid,
	Platform,
	ScrollView,
	StyleSheet,
} from "react-native";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import { SafeAreaView } from "react-native-safe-area-context";
import { ItemToRemoveCard } from "../components/ItemToRemoveCard";
import type { RootStackParamList } from "../navigation/AppNavigator";
import {
	getAllStockItems,
	removeStockItemQuantity,
} from "../repositories/stockRepository";
import { extractItemsFromAudio } from "../services/openaiGateway";
import { Unit } from "../types";
import { findBestMatch } from "../utils/fuzzySearch";
import { convertUnit } from "../utils/unitConversion";

type OutputScreenProps = NativeStackScreenProps<RootStackParamList, "Output">;

interface ItemToRemove {
	id: string;
	nome: string;
	quantidadeRemover: number;
	unidadeRemover: Unit;
	quantidadeAtual: number;
	unidadeAtual: Unit;
	quantidadeRestante: number;
	confirmed: boolean;
}

const UNIT_LABELS: Record<Unit, string> = {
	[Unit.KG]: "kg",
	[Unit.G]: "g",
	[Unit.L]: "L",
	[Unit.ML]: "mL",
	[Unit.UN]: "un",
	[Unit.DUZIA]: "duzia",
};

const ALL_UNITS: Unit[] = [
	Unit.KG,
	Unit.G,
	Unit.L,
	Unit.ML,
	Unit.UN,
	Unit.DUZIA,
];

const getCompatibleUnitsForStockUnit = (stockUnit?: Unit): Unit[] => {
	if (!stockUnit) {
		return ALL_UNITS;
	}

	if (stockUnit === Unit.KG || stockUnit === Unit.G) {
		return [Unit.KG, Unit.G];
	}

	if (stockUnit === Unit.L || stockUnit === Unit.ML) {
		return [Unit.L, Unit.ML];
	}

	return [stockUnit];
};

const areUnitsCompatible = (fromUnit: Unit, toUnit: Unit): boolean => {
	if (fromUnit === toUnit) {
		return true;
	}

	if (
		(fromUnit === Unit.KG || fromUnit === Unit.G) &&
		(toUnit === Unit.KG || toUnit === Unit.G)
	) {
		return true;
	}

	if (
		(fromUnit === Unit.L || fromUnit === Unit.ML) &&
		(toUnit === Unit.L || toUnit === Unit.ML)
	) {
		return true;
	}

	return false;
};

export const OutputScreen: React.FC<OutputScreenProps> = ({ navigation }) => {
	const audioRecorderPlayerRef = useRef(AudioRecorderPlayer);
	const [isRecording, setIsRecording] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [showManualEntry, setShowManualEntry] = useState(false);
	const [itemsToRemove, setItemsToRemove] = useState<ItemToRemove[]>([]);
	const [recordingPath, setRecordingPath] = useState<string | null>(null);
	const [recordTime, setRecordTime] = useState("00:00");
	const recordTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const [manualItem, setManualItem] = useState({
		nome: "",
		quantidade: "",
		unidade: Unit.KG as Unit,
	});

	const [stockItems] = useState(() => getAllStockItems());
	const [filteredStockItems, setFilteredStockItems] = useState(stockItems);
	const [hasShownSuccessAlert, setHasShownSuccessAlert] = useState(false);

	const selectedStockItem = stockItems.find(
		(item) => item.nome.toLowerCase() === manualItem.nome.toLowerCase(),
	);
	const allowedUnitsForSelectedItem = getCompatibleUnitsForStockUnit(
		selectedStockItem?.unidade,
	);

	useEffect(() => {
		const audioRecorderPlayer = audioRecorderPlayerRef.current;
		const intervalRef = recordTimeIntervalRef.current;
		return () => {
			if (intervalRef) {
				clearInterval(intervalRef);
			}
			audioRecorderPlayer.stopRecorder();
		};
	}, []);

	const requestMicrophonePermission = async (): Promise<boolean> => {
		if (Platform.OS !== "android") {
			return true;
		}

		try {
			const granted = await PermissionsAndroid.request(
				PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
				{
					title: "Permissão de Microfone",
					message:
						"Este app precisa acessar o microfone para gravar comandos de voz.",
					buttonNeutral: "Perguntar depois",
					buttonNegative: "Cancelar",
					buttonPositive: "OK",
				},
			);

			return granted === PermissionsAndroid.RESULTS.GRANTED;
		} catch (err) {
			console.error("Error requesting microphone permission:", err);
			return false;
		}
	};

	const handleStartRecording = async () => {
		try {
			const hasPermission = await requestMicrophonePermission();
			if (!hasPermission) {
				setTimeout(() => {
					Alert.alert(
						"Permissão Negada",
						"É necessário conceder permissão de microfone para gravar áudio.",
					);
				}, 100);
				return;
			}

			const audioRecorderPlayer = audioRecorderPlayerRef.current;
			const result = await audioRecorderPlayer.startRecorder();
			const path = typeof result === "string" ? result : result;
			setRecordingPath(path);
			setIsRecording(true);
			setRecordTime("00:00");

			audioRecorderPlayer.addRecordBackListener(
				(e: { currentPosition: number }) => {
					const minutes = Math.floor(e.currentPosition / 1000 / 60);
					const seconds = Math.floor((e.currentPosition / 1000) % 60);
					setRecordTime(
						`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
					);
					return;
				},
			);
		} catch (error) {
			console.error("Error starting recording:", error);
			Alert.alert(
				"Erro",
				"Não foi possível iniciar a gravação. Verifique se o microfone está disponível e se a permissão foi concedida.",
			);
		}
	};

	const handleStopRecording = async () => {
		try {
			const audioRecorderPlayer = audioRecorderPlayerRef.current;
			const result = await audioRecorderPlayer.stopRecorder();
			audioRecorderPlayer.removeRecordBackListener();
			setIsRecording(false);
			if (recordTimeIntervalRef.current) {
				clearInterval(recordTimeIntervalRef.current);
			}

			if (result && recordingPath) {
				await handleProcessAudio(recordingPath);
			}
		} catch (error) {
			console.error("Error stopping recording:", error);
			Alert.alert("Erro", "Não foi possível parar a gravação");
		}
	};

	const handleCancelRecording = async () => {
		try {
			const audioRecorderPlayer = audioRecorderPlayerRef.current;
			await audioRecorderPlayer.stopRecorder();
			audioRecorderPlayer.removeRecordBackListener();
			setIsRecording(false);
			setRecordingPath(null);
			setRecordTime("00:00");
			if (recordTimeIntervalRef.current) {
				clearInterval(recordTimeIntervalRef.current);
			}
		} catch (error) {
			console.error("Error canceling recording:", error);
		}
	};

	const handleProcessAudio = async (audioUri: string) => {
		setIsProcessing(true);

		try {
			console.log("🎙️ [OUTPUT SCREEN] Processando áudio...");
			const extractedItems = await extractItemsFromAudio(
				audioUri,
				undefined,
				"stock_output",
			);

			console.log(
				"📋 [OUTPUT SCREEN] Itens extraídos da IA:",
				extractedItems.length,
			);
			extractedItems.forEach((item, index) => {
				console.log(
					`  ${index + 1}. ${item.nome} - ${item.quantidade} ${item.unidade}`,
				);
			});

			if (extractedItems.length === 0) {
				Alert.alert(
					"Nenhum item encontrado",
					"Não foi possível extrair itens do áudio. Deseja gravar novamente ou inserir manualmente?",
					[
						{ text: "Cancelar", style: "cancel" },
						{
							text: "Gravar novamente",
							onPress: () => {
								setRecordingPath(null);
								setRecordTime("00:00");
							},
						},
						{
							text: "Inserir manualmente",
							onPress: () => setShowManualEntry(true),
						},
					],
				);
				setIsProcessing(false);
				return;
			}

			const itemsToProcess: ItemToRemove[] = [];

			console.log("🔎 [OUTPUT SCREEN] Buscando itens no estoque...");
			console.log(
				"📦 [OUTPUT SCREEN] Itens disponíveis no estoque:",
				stockItems.map((i) => `${i.nome} (${i.quantidade} ${i.unidade})`),
			);

			for (const extractedItem of extractedItems) {
				console.log(
					`\n🔍 [OUTPUT SCREEN] Processando item extraído: "${extractedItem.nome}"`,
				);
				const similarItem = findBestMatch(extractedItem.nome, stockItems, 0.7);

				if (!similarItem) {
					console.log(
						`❌ [OUTPUT SCREEN] Item "${extractedItem.nome}" não encontrado no estoque`,
					);
					Alert.alert(
						"Item não encontrado",
						`Item "${extractedItem.nome}" não encontrado no estoque. Deseja continuar com os outros itens?`,
						[
							{ text: "Cancelar", style: "cancel" },
							{
								text: "Continuar",
								onPress: () => {},
							},
						],
					);
					continue;
				}

				console.log(
					`✅ [OUTPUT SCREEN] Item encontrado: "${similarItem.nome}"`,
				);

				const sourceUnit = extractedItem.unidade;
				const targetUnit = similarItem.unidade;

				let quantidadeRemover = extractedItem.quantidade;

				if (sourceUnit !== targetUnit) {
					console.log(
						`🔄 [OUTPUT SCREEN] Convertendo unidade: ${extractedItem.quantidade} ${sourceUnit} -> ${targetUnit}`,
					);
					quantidadeRemover = convertUnit(
						extractedItem.quantidade,
						sourceUnit,
						targetUnit,
					);
					console.log(
						`🔄 [OUTPUT SCREEN] Quantidade convertida: ${quantidadeRemover} ${targetUnit}`,
					);
				}

				const quantidadeRestante = similarItem.quantidade - quantidadeRemover;
				console.log(
					`📊 [OUTPUT SCREEN] Quantidade atual: ${similarItem.quantidade} ${targetUnit}, Remover: ${quantidadeRemover} ${targetUnit}, Restante: ${quantidadeRestante} ${targetUnit}`,
				);

				itemsToProcess.push({
					id: similarItem.id,
					nome: similarItem.nome,
					quantidadeRemover,
					unidadeRemover: targetUnit,
					quantidadeAtual: similarItem.quantidade,
					unidadeAtual: targetUnit,
					quantidadeRestante: quantidadeRestante < 0 ? 0 : quantidadeRestante,
					confirmed: false,
				});
			}

			setItemsToRemove(itemsToProcess);
		} catch (error) {
			console.error("Error processing audio:", error);
			Alert.alert(
				"Erro",
				"Não foi possível entender o áudio. Deseja gravar novamente ou inserir manualmente?",
				[
					{ text: "Cancelar", style: "cancel" },
					{
						text: "Gravar novamente",
						onPress: () => {
							setRecordingPath(null);
							setRecordTime("00:00");
						},
					},
					{
						text: "Inserir manualmente",
						onPress: () => setShowManualEntry(true),
					},
				],
			);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleConfirmItem = (itemId: string) => {
		const item = itemsToRemove.find((i) => i.id === itemId);
		if (!item) return;

		if (item.quantidadeRemover > item.quantidadeAtual) {
			Alert.alert(
				"Estoque insuficiente",
				`Você tem apenas ${item.quantidadeAtual.toFixed(2)} ${UNIT_LABELS[item.unidadeAtual]} de ${item.nome} em estoque. Isso vai zerar o estoque. Deseja continuar?`,
				[
					{ text: "Cancelar", style: "cancel" },
					{
						text: "Sim, zerar estoque",
						style: "destructive",
						onPress: () => {
							try {
								removeStockItemQuantity(item.id, item.quantidadeRemover);
								setItemsToRemove((prev) =>
									prev.map((i) =>
										i.id === itemId ? { ...i, confirmed: true } : i,
									),
								);
							} catch (error) {
								console.error("Error removing item:", error);
								Alert.alert("Erro", "Não foi possível atualizar o estoque");
							}
						},
					},
				],
			);
		} else {
			Alert.alert(
				"Confirmar remoção",
				`Confirmar remoção de ${item.quantidadeRemover.toFixed(2)} ${UNIT_LABELS[item.unidadeRemover]} de ${item.nome}?`,
				[
					{ text: "Cancelar", style: "cancel" },
					{
						text: "Confirmar",
						onPress: () => {
							try {
								removeStockItemQuantity(item.id, item.quantidadeRemover);
								setItemsToRemove((prev) =>
									prev.map((i) =>
										i.id === itemId ? { ...i, confirmed: true } : i,
									),
								);
							} catch (error) {
								console.error("Error removing item:", error);
								Alert.alert("Erro", "Não foi possível atualizar o estoque");
							}
						},
					},
				],
			);
		}
	};

	const handleAbortItem = (itemId: string) => {
		setItemsToRemove((prev) => prev.filter((i) => i.id !== itemId));
	};

	useEffect(() => {
		const allConfirmed =
			itemsToRemove.length > 0 &&
			itemsToRemove.every((i) => i.confirmed) &&
			!hasShownSuccessAlert;

		if (allConfirmed) {
			setHasShownSuccessAlert(true);
			Alert.alert("Sucesso", "Estoque atualizado!", [
				{
					text: "OK",
					onPress: () => {
						setItemsToRemove([]);
						setRecordingPath(null);
						setRecordTime("00:00");
						setHasShownSuccessAlert(false);
						navigation.navigate("Home");
					},
				},
			]);
		}
	}, [itemsToRemove, hasShownSuccessAlert, navigation]);

	const handleManualItemSearch = (searchText: string) => {
		setManualItem({ ...manualItem, nome: searchText });

		if (searchText.trim() === "") {
			setFilteredStockItems(stockItems);
			return;
		}

		const filtered = stockItems.filter((item) =>
			item.nome.toLowerCase().includes(searchText.toLowerCase()),
		);
		setFilteredStockItems(filtered);
	};

	const handleSelectManualItem = (item: (typeof stockItems)[0]) => {
		setManualItem({
			nome: item.nome,
			quantidade: "",
			unidade: item.unidade,
		});
		setFilteredStockItems(stockItems);
	};

	const handleAddManualItem = () => {
		if (!manualItem.nome.trim() || !manualItem.quantidade) {
			Alert.alert("Erro", "Preencha todos os campos");
			return;
		}

		const quantidade = parseFloat(manualItem.quantidade);
		if (Number.isNaN(quantidade) || quantidade <= 0) {
			Alert.alert("Erro", "Quantidade deve ser um número positivo");
			return;
		}

		const selectedItem = stockItems.find(
			(item) => item.nome.toLowerCase() === manualItem.nome.toLowerCase(),
		);

		if (!selectedItem) {
			Alert.alert("Erro", "Item não encontrado no estoque");
			return;
		}

		const sourceUnit = manualItem.unidade;
		const targetUnit = selectedItem.unidade;

		if (!areUnitsCompatible(sourceUnit, targetUnit)) {
			Alert.alert(
				"Unidade incompatível",
				`O item "${selectedItem.nome}" está cadastrado em ${UNIT_LABELS[targetUnit]} e você está tentando remover em ${UNIT_LABELS[sourceUnit]}.\n\nUse apenas unidades compatíveis (por exemplo, g ou kg para peso, mL ou L para volume).`,
			);
			return;
		}

		let quantidadeRemover = quantidade;

		if (sourceUnit !== targetUnit) {
			quantidadeRemover = convertUnit(quantidade, sourceUnit, targetUnit);
		}

		const quantidadeRestante = selectedItem.quantidade - quantidadeRemover;

		const newItem: ItemToRemove = {
			id: selectedItem.id,
			nome: selectedItem.nome,
			quantidadeRemover,
			unidadeRemover: targetUnit,
			quantidadeAtual: selectedItem.quantidade,
			unidadeAtual: targetUnit,
			quantidadeRestante: quantidadeRestante < 0 ? 0 : quantidadeRestante,
			confirmed: false,
		};

		setItemsToRemove([...itemsToRemove, newItem]);
		setManualItem({ nome: "", quantidade: "", unidade: Unit.KG });
		setShowManualEntry(false);
	};

	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<VStack space="xl" width="100%" padding={24}>
					<VStack space="md">
						<HStack justifyContent="space-between" alignItems="center">
							<Heading size="2xl" color="$primary500">
								Saída de Estoque
							</Heading>
							<Button
								onPress={() => navigation.navigate("Home")}
								size="sm"
								variant="outline"
							>
								<ButtonText>Voltar</ButtonText>
							</Button>
						</HStack>
						<Text size="md" color="$gray600">
							Fale o que vai usar ou insira manualmente
						</Text>
					</VStack>

					{itemsToRemove.length === 0 && !showManualEntry && (
						<VStack space="md" width="100%">
							{!isRecording && !isProcessing && (
								<>
									<Button
										onPress={handleStartRecording}
										size="lg"
										variant="solid"
									>
										<ButtonText>Falar os itens que vão sair</ButtonText>
									</Button>

									<Button
										onPress={() => setShowManualEntry(true)}
										size="lg"
										variant="outline"
									>
										<ButtonText>Inserir manualmente</ButtonText>
									</Button>
								</>
							)}

							{isRecording && (
								<VStack space="md" width="100%" alignItems="center">
									<Text size="xl" fontWeight="$bold" color="$error500">
										Gravando...
									</Text>
									<Text size="lg" color="$gray600">
										{recordTime}
									</Text>
									<HStack space="md">
										<Button
											onPress={handleStopRecording}
											size="lg"
											variant="solid"
											backgroundColor="$error500"
										>
											<ButtonText>Parar gravação</ButtonText>
										</Button>
										<Button
											onPress={handleCancelRecording}
											size="lg"
											variant="outline"
										>
											<ButtonText>Cancelar</ButtonText>
										</Button>
									</HStack>
								</VStack>
							)}

							{isProcessing && (
								<VStack space="md" width="100%" alignItems="center">
									<Text size="lg" color="$gray600">
										Processando áudio...
									</Text>
								</VStack>
							)}
						</VStack>
					)}

					{showManualEntry && itemsToRemove.length === 0 && (
						<VStack space="md" width="100%">
							<FormControl>
								<FormControlLabel>
									<FormControlLabelText>Nome do produto</FormControlLabelText>
								</FormControlLabel>
								<Input>
									<InputField
										value={manualItem.nome}
										onChangeText={handleManualItemSearch}
										placeholder="Digite o nome do produto"
									/>
								</Input>
								{filteredStockItems.length > 0 &&
									filteredStockItems.length < stockItems.length && (
										<VStack space="xs" marginTop={8}>
											{filteredStockItems.slice(0, 5).map((item) => (
												<Button
													key={item.id}
													onPress={() => handleSelectManualItem(item)}
													variant="link"
													size="sm"
													alignSelf="flex-start"
												>
													<ButtonText>{item.nome}</ButtonText>
												</Button>
											))}
										</VStack>
									)}
							</FormControl>

							<FormControl>
								<FormControlLabel>
									<FormControlLabelText>Quantidade</FormControlLabelText>
								</FormControlLabel>
								<Input>
									<InputField
										value={manualItem.quantidade}
										onChangeText={(text) =>
											setManualItem({ ...manualItem, quantidade: text })
										}
										placeholder="0.0"
										keyboardType="numeric"
									/>
								</Input>
							</FormControl>

							<FormControl>
								<FormControlLabel>
									<FormControlLabelText>Unidade</FormControlLabelText>
								</FormControlLabel>
								<Select
									selectedValue={manualItem.unidade}
									onValueChange={(value) =>
										setManualItem({
											...manualItem,
											unidade: value as Unit,
										})
									}
								>
									<SelectTrigger>
										<SelectInput
											placeholder="Selecione a unidade"
											value={UNIT_LABELS[manualItem.unidade]}
										/>
									</SelectTrigger>
									<SelectPortal>
										<SelectBackdrop />
										<SelectContent>
											<SelectDragIndicatorWrapper>
												<SelectDragIndicator />
											</SelectDragIndicatorWrapper>
											{allowedUnitsForSelectedItem.map((unit) => (
												<SelectItem
													key={unit}
													label={UNIT_LABELS[unit]}
													value={unit}
												/>
											))}
										</SelectContent>
									</SelectPortal>
								</Select>
							</FormControl>

							<HStack space="md">
								<Button
									onPress={handleAddManualItem}
									size="lg"
									variant="solid"
									flex={1}
								>
									<ButtonText>Dar baixa</ButtonText>
								</Button>
								<Button
									onPress={() => {
										setShowManualEntry(false);
										setManualItem({
											nome: "",
											quantidade: "",
											unidade: Unit.KG,
										});
									}}
									size="lg"
									variant="outline"
									flex={1}
								>
									<ButtonText>Cancelar</ButtonText>
								</Button>
							</HStack>
						</VStack>
					)}

					{itemsToRemove.length > 0 && (
						<VStack space="md" width="100%">
							<Heading size="lg" color="$gray900">
								Itens a serem removidos
							</Heading>

							{itemsToRemove.map((item) => (
								<ItemToRemoveCard
									key={item.id}
									item={item}
									unitLabels={UNIT_LABELS}
									onConfirm={handleConfirmItem}
									onAbort={handleAbortItem}
								/>
							))}
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
});

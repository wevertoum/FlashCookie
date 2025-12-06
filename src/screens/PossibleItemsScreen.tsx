/**
 * Possible Items Screen
 * RF-024 to RF-034: Recipe management and production potential calculation
 */

import {
	Box,
	Button,
	ButtonText,
	FormControl,
	FormControlError,
	FormControlErrorText,
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
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	PermissionsAndroid,
	Platform,
	RefreshControl,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
} from "react-native";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/AppNavigator";
import {
	clearPossibleItemsData,
	getAIOutput,
	saveAIOutput,
	setSelectedRecipeIds,
	validateSelectedRecipes,
} from "../repositories/possibleItemsRepository";
import {
	createRecipe,
	deleteRecipe,
	getAllRecipes,
	getRecipesByIds,
	updateRecipe,
} from "../repositories/recipeRepository";
import {
	getAllStockItems,
	getStockItemById,
} from "../repositories/stockRepository";
import {
	calculateProductionPotential,
	extractItemsFromAudio,
} from "../services/openaiGateway";
import type { Recipe, RecipeIngredient, Unit } from "../types";
import { Unit as UnitEnum } from "../types";
import { findBestMatch } from "../utils/fuzzySearch";
import { convertUnit } from "../utils/unitConversion";

type PossibleItemsScreenProps = NativeStackScreenProps<
	RootStackParamList,
	"ItensPossiveis"
>;

interface EditableIngredient {
	id: string;
	itemEstoqueId: string;
	nome: string;
	quantidade: string;
	unidade: Unit;
}

const UNIT_LABELS: Record<Unit, string> = {
	[UnitEnum.KG]: "kg",
	[UnitEnum.G]: "g",
	[UnitEnum.L]: "L",
	[UnitEnum.ML]: "mL",
	[UnitEnum.UN]: "un",
	[UnitEnum.DUZIA]: "duzia",
};

/**
 * Get compatible units for a given unit (kg↔g, L↔mL)
 */
const getCompatibleUnits = (unit: Unit): Unit[] => {
	if (unit === UnitEnum.KG || unit === UnitEnum.G) {
		return [UnitEnum.KG, UnitEnum.G];
	}
	if (unit === UnitEnum.L || unit === UnitEnum.ML) {
		return [UnitEnum.L, UnitEnum.ML];
	}
	return [unit]; // un, duzia - no conversion
};

const formatNumber = (value: number): string => {
	if (Number.isNaN(value) || !Number.isFinite(value)) {
		return "0";
	}

	if (Number.isInteger(value)) {
		return value.toString();
	}

	const rounded = Math.round(value * 1000000) / 1000000;
	const formatted = rounded.toString();

	if (formatted.includes(".")) {
		return formatted.replace(/\.?0+$/, "");
	}

	return formatted;
};

export const PossibleItemsScreen: React.FC<PossibleItemsScreenProps> = ({
	navigation,
}) => {
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [selectedRecipeIds, setSelectedRecipeIdsState] = useState<string[]>([]);
	const [aiOutput, setAIOutput] = useState<
		Array<{
			receita: string;
			quantidadePossivel: number;
			unidade: Unit;
			alertas?: Array<{
				tipo: "ingrediente_faltando" | "ingrediente_insuficiente";
				ingrediente: string;
				quantidadeNecessaria: number;
				unidadeNecessaria: Unit;
				quantidadeDisponivel: number;
				unidadeDisponivel: Unit;
				mensagem: string;
			}>;
		}>
	>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	// Recipe form state
	const [showRecipeForm, setShowRecipeForm] = useState(false);
	const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
	const [recipeFormData, setRecipeFormData] = useState({
		nome: "",
		rendimento: "",
	});
	const [recipeIngredients, setRecipeIngredients] = useState<
		EditableIngredient[]
	>([]);
	const [recipeFormErrors, setRecipeFormErrors] = useState<{
		nome?: string;
		rendimento?: string;
		ingredientes?: string;
	}>({});

	// Audio recording state
	const audioRecorderPlayerRef = useRef(AudioRecorderPlayer);
	const [isRecording, setIsRecording] = useState(false);
	const [isProcessingAudio, setIsProcessingAudio] = useState(false);
	const [recordingPath, setRecordingPath] = useState<string | null>(null);
	const [recordTime, setRecordTime] = useState("00:00");
	const recordTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		console.log("🚀 [POSSIBLE ITEMS] Tela de Itens Possíveis montada");

		const audioRecorderPlayer = audioRecorderPlayerRef.current;
		const intervalRef = recordTimeIntervalRef.current;

		return () => {
			if (intervalRef) {
				clearInterval(intervalRef);
			}
			audioRecorderPlayer.stopRecorder();
		};
	}, []);

	const loadData = useCallback(() => {
		console.log("🔄 [POSSIBLE ITEMS] Carregando dados...");

		// RF-029: Load all recipes
		const allRecipes = getAllRecipes();
		console.log("📚 [POSSIBLE ITEMS] Receitas carregadas:", allRecipes.length);
		console.log(
			"📚 [POSSIBLE ITEMS] Lista de receitas:",
			allRecipes.map((r) => ({
				id: r.id,
				nome: r.nome,
				ingredientes: r.ingredientes.length,
			})),
		);
		setRecipes(allRecipes);

		// RF-029: Validate and restore selected recipes
		const validatedIds = validateSelectedRecipes();
		console.log(
			"✅ [POSSIBLE ITEMS] IDs de receitas selecionadas (validados):",
			validatedIds,
		);
		setSelectedRecipeIdsState(validatedIds);

		// RF-033: Restore AI output
		const savedOutput = getAIOutput();
		if (savedOutput?.resultado) {
			console.log(
				"💾 [POSSIBLE ITEMS] Output da IA restaurado:",
				JSON.stringify(savedOutput, null, 2),
			);
			setAIOutput(savedOutput.resultado);
		} else {
			console.log("💾 [POSSIBLE ITEMS] Nenhum output da IA salvo encontrado");
		}

		console.log("✅ [POSSIBLE ITEMS] Dados carregados com sucesso");
	}, []);

	useFocusEffect(
		useCallback(() => {
			console.log("🎯 [POSSIBLE ITEMS] Tela de Itens Possíveis recebeu foco");
			loadData();
		}, [loadData]),
	);

	const handleRefresh = useCallback(() => {
		setIsRefreshing(true);
		loadData();
		setIsRefreshing(false);
	}, [loadData]);

	const handleToggleRecipeSelection = (recipeId: string) => {
		const recipe = recipes.find((r) => r.id === recipeId);
		const isCurrentlySelected = selectedRecipeIds.includes(recipeId);

		console.log(
			`${isCurrentlySelected ? "➖" : "➕"} [POSSIBLE ITEMS] ${isCurrentlySelected ? "Deselecionando" : "Selecionando"} receita:`,
			recipe?.nome || recipeId,
		);

		const newSelection = isCurrentlySelected
			? selectedRecipeIds.filter((id) => id !== recipeId)
			: [...selectedRecipeIds, recipeId];

		console.log("📋 [POSSIBLE ITEMS] Nova seleção:", newSelection);
		setSelectedRecipeIdsState(newSelection);
		// RF-029: Save selection immediately
		setSelectedRecipeIds(newSelection);
		console.log("💾 [POSSIBLE ITEMS] Seleção salva no storage");
	};

	const handleClearSelection = () => {
		setSelectedRecipeIdsState([]);
		setSelectedRecipeIds([]);
	};

	const handleStartNewRecipe = () => {
		setEditingRecipe(null);
		setRecipeFormData({ nome: "", rendimento: "" });
		setRecipeIngredients([]);
		setRecipeFormErrors({});
		setShowRecipeForm(true);
	};

	// Audio recording functions
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
						"Este app precisa acessar o microfone para gravar ingredientes da receita.",
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

			console.log("🎤 [RECIPE AUDIO] Iniciando gravação de áudio...");
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
			console.log("🎤 [RECIPE AUDIO] Gravação iniciada");
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
			console.log("⏹️ [RECIPE AUDIO] Parando gravação...");
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
			console.log("❌ [RECIPE AUDIO] Cancelando gravação...");
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
		setIsProcessingAudio(true);
		console.log("🎙️ [RECIPE AUDIO] Processando áudio de receita...");

		try {
			const extractedItems = await extractItemsFromAudio(audioUri);
			console.log("📋 [RECIPE AUDIO] Itens extraídos:", extractedItems.length);
			console.log(
				"📋 [RECIPE AUDIO] Detalhes:",
				JSON.stringify(extractedItems, null, 2),
			);

			if (extractedItems.length === 0) {
				Alert.alert(
					"Nenhum ingrediente encontrado",
					"Não foi possível extrair ingredientes do áudio. Deseja gravar novamente?",
					[
						{ text: "Cancelar", style: "cancel" },
						{
							text: "Gravar novamente",
							onPress: () => {
								setRecordingPath(null);
								setRecordTime("00:00");
							},
						},
					],
				);
				setIsProcessingAudio(false);
				return;
			}

			// Buscar itens no estoque e criar ingredientes editáveis
			const stockItems = getAllStockItems();
			console.log("🔍 [RECIPE AUDIO] Buscando itens no estoque...");

			const newIngredients: EditableIngredient[] = [];

			for (const extractedItem of extractedItems) {
				console.log(`🔍 [RECIPE AUDIO] Processando: "${extractedItem.nome}"`);

				// Buscar item similar no estoque
				const similarItem = findBestMatch(extractedItem.nome, stockItems, 0.7);

				if (similarItem) {
					console.log(
						`✅ [RECIPE AUDIO] Item encontrado no estoque: "${similarItem.nome}"`,
					);

					// Converter unidade se necessário
					let quantidade = extractedItem.quantidade;
					let unidade = extractedItem.unidade;

					if (extractedItem.unidade !== similarItem.unidade) {
						// Verificar se são unidades compatíveis
						const compatibleUnits = getCompatibleUnits(similarItem.unidade);
						if (compatibleUnits.includes(extractedItem.unidade)) {
							const convertedQty = convertUnit(
								extractedItem.quantidade,
								extractedItem.unidade,
								similarItem.unidade,
							);
							quantidade = convertedQty;
							unidade = similarItem.unidade;
							console.log(
								`🔄 [RECIPE AUDIO] Convertido: ${extractedItem.quantidade} ${extractedItem.unidade} → ${quantidade} ${unidade}`,
							);
						}
					}

					newIngredients.push({
						id: `${Date.now()}-${Math.random()}`,
						itemEstoqueId: similarItem.id,
						nome: similarItem.nome,
						quantidade: quantidade.toString(),
						unidade: unidade,
					});
				} else {
					console.log(
						`⚠️ [RECIPE AUDIO] Item não encontrado no estoque: "${extractedItem.nome}"`,
					);
					Alert.alert(
						"Ingrediente não encontrado",
						`O ingrediente "${extractedItem.nome}" não foi encontrado no estoque. Ele será adicionado como novo item, mas você precisará selecioná-lo manualmente depois.`,
						[{ text: "OK" }],
					);
					// Adicionar como novo ingrediente (sem itemEstoqueId, usuário precisará selecionar depois)
					newIngredients.push({
						id: `${Date.now()}-${Math.random()}`,
						itemEstoqueId: "",
						nome: extractedItem.nome,
						quantidade: extractedItem.quantidade.toString(),
						unidade: extractedItem.unidade,
					});
				}
			}

			console.log(
				`✅ [RECIPE AUDIO] ${newIngredients.length} ingredientes processados`,
			);

			// Adicionar aos ingredientes existentes
			setRecipeIngredients([...recipeIngredients, ...newIngredients]);

			Alert.alert(
				"Ingredientes extraídos",
				`${newIngredients.length} ingrediente(s) foram extraídos do áudio. Revise e ajuste antes de salvar.`,
			);
		} catch (error) {
			console.error("Error processing audio:", error);
			Alert.alert(
				"Erro",
				"Não foi possível processar o áudio. Deseja gravar novamente ou adicionar ingredientes manualmente?",
				[
					{ text: "Cancelar", style: "cancel" },
					{
						text: "Gravar novamente",
						onPress: () => {
							setRecordingPath(null);
							setRecordTime("00:00");
						},
					},
				],
			);
		} finally {
			setIsProcessingAudio(false);
		}
	};

	const handleEditRecipe = (recipe: Recipe) => {
		setEditingRecipe(recipe);
		setRecipeFormData({
			nome: recipe.nome,
			rendimento: recipe.rendimento.toString(),
		});
		setRecipeIngredients(
			recipe.ingredientes.map((ing) => ({
				id: `${Date.now()}-${Math.random()}`,
				itemEstoqueId: ing.itemEstoqueId,
				nome: ing.nome,
				quantidade: ing.quantidade.toString(),
				unidade: ing.unidade,
			})),
		);
		setRecipeFormErrors({});
		setShowRecipeForm(true);
	};

	const handleDeleteRecipe = (recipe: Recipe) => {
		Alert.alert(
			"Excluir Receita",
			`Tem certeza que deseja excluir a receita "${recipe.nome}"?`,
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Excluir",
					style: "destructive",
					onPress: () => {
						deleteRecipe(recipe.id);
						loadData();
					},
				},
			],
		);
	};

	const handleAddIngredient = () => {
		const stockItems = getAllStockItems();
		if (stockItems.length === 0) {
			Alert.alert(
				"Estoque vazio",
				"Não há itens cadastrados no estoque. Cadastre itens primeiro na tela de Entrada de Estoque.",
			);
			return;
		}

		setRecipeIngredients([
			...recipeIngredients,
			{
				id: `${Date.now()}-${Math.random()}`,
				itemEstoqueId: "",
				nome: "",
				quantidade: "",
				unidade: UnitEnum.KG,
			},
		]);
	};

	const handleRemoveIngredient = (ingredientId: string) => {
		setRecipeIngredients(
			recipeIngredients.filter((ing) => ing.id !== ingredientId),
		);
	};

	const handleIngredientStockItemChange = (
		ingredientId: string,
		stockItemId: string,
	) => {
		const stockItem = getStockItemById(stockItemId);
		if (!stockItem) {
			console.warn(
				"⚠️ [POSSIBLE ITEMS] Item do estoque não encontrado:",
				stockItemId,
			);
			return;
		}

		console.log(
			`🔧 [POSSIBLE ITEMS] Alterando ingrediente ${ingredientId}: selecionado "${stockItem.nome}" (${stockItem.quantidade} ${UNIT_LABELS[stockItem.unidade]})`,
		);

		// Get current ingredient
		const currentIngredient = recipeIngredients.find(
			(ing) => ing.id === ingredientId,
		);

		// Convert quantity if unit changed
		let quantidade = currentIngredient?.quantidade || "";
		if (currentIngredient && currentIngredient.unidade !== stockItem.unidade) {
			const qty = parseFloat(currentIngredient.quantidade);
			if (!Number.isNaN(qty)) {
				const convertedQty = convertUnit(
					qty,
					currentIngredient.unidade,
					stockItem.unidade,
				);
				quantidade = convertedQty.toString();
				console.log(
					`🔄 [POSSIBLE ITEMS] Convertido: ${qty} ${currentIngredient.unidade} → ${convertedQty} ${stockItem.unidade}`,
				);
			}
		}

		setRecipeIngredients(
			recipeIngredients.map((ing) =>
				ing.id === ingredientId
					? {
							...ing,
							itemEstoqueId: stockItemId,
							nome: stockItem.nome,
							unidade: stockItem.unidade, // RF-024: Auto-fill unit from stock item
							quantidade: quantidade,
						}
					: ing,
			),
		);
	};

	/**
	 * Handle unit change for an ingredient with automatic conversion
	 */
	const handleIngredientUnitChange = (ingredientId: string, newUnit: Unit) => {
		const ingredient = recipeIngredients.find((ing) => ing.id === ingredientId);
		if (!ingredient) return;

		const currentQty = parseFloat(ingredient.quantidade);
		if (Number.isNaN(currentQty)) return;

		// Check if units are compatible
		const compatibleUnits = getCompatibleUnits(ingredient.unidade);
		if (!compatibleUnits.includes(newUnit)) {
			console.warn(
				`⚠️ [POSSIBLE ITEMS] Unidades não compatíveis: ${ingredient.unidade} → ${newUnit}`,
			);
			return;
		}

		// Convert quantity
		const convertedQty = convertUnit(currentQty, ingredient.unidade, newUnit);
		console.log(
			`🔄 [POSSIBLE ITEMS] Convertendo ${currentQty} ${ingredient.unidade} → ${convertedQty} ${newUnit}`,
		);

		setRecipeIngredients(
			recipeIngredients.map((ing) =>
				ing.id === ingredientId
					? {
							...ing,
							unidade: newUnit,
							quantidade: convertedQty.toString(),
						}
					: ing,
			),
		);
	};

	const validateRecipeForm = (): boolean => {
		const errors: typeof recipeFormErrors = {};

		if (!recipeFormData.nome.trim()) {
			errors.nome = "Nome da receita é obrigatório";
		}

		const rendimento = parseFloat(recipeFormData.rendimento);
		if (
			!recipeFormData.rendimento ||
			Number.isNaN(rendimento) ||
			rendimento <= 0
		) {
			errors.rendimento = "Rendimento deve ser um número positivo";
		}

		if (recipeIngredients.length === 0) {
			errors.ingredientes = "Adicione pelo menos um ingrediente";
		}

		// Validate all ingredients
		for (const ing of recipeIngredients) {
			if (!ing.itemEstoqueId) {
				errors.ingredientes =
					"Selecione um item do estoque para cada ingrediente";
				break;
			}
			const qty = parseFloat(ing.quantidade);
			if (!ing.quantidade || Number.isNaN(qty) || qty <= 0) {
				errors.ingredientes = "Quantidade deve ser um número positivo";
				break;
			}
		}

		// Check for duplicate ingredients
		const itemIds = recipeIngredients.map((ing) => ing.itemEstoqueId);
		const uniqueItemIds = new Set(itemIds);
		if (itemIds.length !== uniqueItemIds.size) {
			errors.ingredientes =
				"Não é permitido adicionar o mesmo ingrediente duas vezes";
		}

		setRecipeFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSaveRecipe = () => {
		console.log("💾 [POSSIBLE ITEMS] Tentando salvar receita...");
		console.log("📝 [POSSIBLE ITEMS] Dados do formulário:", {
			nome: recipeFormData.nome,
			rendimento: recipeFormData.rendimento,
			ingredientes: recipeIngredients.length,
		});

		if (!validateRecipeForm()) {
			console.error("❌ [POSSIBLE ITEMS] Validação falhou:", recipeFormErrors);
			return;
		}

		try {
			const ingredientes: RecipeIngredient[] = recipeIngredients.map((ing) => ({
				itemEstoqueId: ing.itemEstoqueId,
				nome: ing.nome,
				quantidade: parseFloat(ing.quantidade),
				unidade: ing.unidade,
			}));

			console.log(
				"🍰 [POSSIBLE ITEMS] Ingredientes processados:",
				JSON.stringify(ingredientes, null, 2),
			);

			if (editingRecipe) {
				console.log(
					"✏️ [POSSIBLE ITEMS] Editando receita existente:",
					editingRecipe.id,
				);
				const updatedRecipe = {
					...editingRecipe,
					nome: recipeFormData.nome.trim(),
					rendimento: parseFloat(recipeFormData.rendimento),
					ingredientes,
				};
				console.log(
					"📝 [POSSIBLE ITEMS] Receita atualizada:",
					JSON.stringify(updatedRecipe, null, 2),
				);
				updateRecipe(updatedRecipe);
			} else {
				console.log("➕ [POSSIBLE ITEMS] Criando nova receita");
				const newRecipe = createRecipe(
					recipeFormData.nome.trim(),
					parseFloat(recipeFormData.rendimento),
					ingredientes,
				);
				console.log(
					"✅ [POSSIBLE ITEMS] Nova receita criada:",
					JSON.stringify(newRecipe, null, 2),
				);
			}

			setShowRecipeForm(false);
			loadData();
			console.log("✅ [POSSIBLE ITEMS] Receita salva com sucesso!");
		} catch (error) {
			console.error("❌ [POSSIBLE ITEMS] Erro ao salvar receita:", error);
			Alert.alert("Erro", (error as Error).message);
		}
	};

	const handleGenerateReport = async () => {
		if (selectedRecipeIds.length === 0) {
			Alert.alert("Erro", "Selecione pelo menos uma receita");
			return;
		}

		console.log("🚀 [POSSIBLE ITEMS] Iniciando geração de relatório");
		console.log(
			"📝 [POSSIBLE ITEMS] Receitas selecionadas (IDs):",
			selectedRecipeIds,
		);

		setIsGenerating(true);

		try {
			// RF-030: Generate stock report
			const stockItems = getAllStockItems();
			console.log("📦 [POSSIBLE ITEMS] Itens no estoque:", stockItems.length);
			console.log(
				"📦 [POSSIBLE ITEMS] Detalhes do estoque:",
				JSON.stringify(stockItems, null, 2),
			);

			const stockReport = stockItems.map((item) => ({
				nome: item.nome,
				quantidade: item.quantidade,
				unidade: item.unidade,
			}));
			console.log(
				"📊 [POSSIBLE ITEMS] Relatório de estoque preparado:",
				JSON.stringify(stockReport, null, 2),
			);

			// RF-030: Get selected recipes with current stock quantities
			const selectedRecipes = getRecipesByIds(selectedRecipeIds);
			console.log(
				"📋 [POSSIBLE ITEMS] Receitas selecionadas carregadas:",
				selectedRecipes.length,
			);
			console.log(
				"📋 [POSSIBLE ITEMS] Detalhes das receitas:",
				JSON.stringify(selectedRecipes, null, 2),
			);

			const recipesWithStock = selectedRecipes.map((recipe) => {
				const recipeWithStock = {
					nome: recipe.nome,
					rendimento: recipe.rendimento,
					ingredientes: recipe.ingredientes.map((ing) => {
						const stockItem = getStockItemById(ing.itemEstoqueId);
						const quantidadeDisponivel = stockItem?.quantidade || 0;

						console.log(
							`🔍 [POSSIBLE ITEMS] Ingrediente "${ing.nome}": necessário ${ing.quantidade} ${ing.unidade}, disponível ${quantidadeDisponivel} ${stockItem?.unidade || ing.unidade}`,
						);

						return {
							nome: ing.nome,
							quantidade: ing.quantidade,
							unidade: ing.unidade,
							quantidadeDisponivel,
						};
					}),
				};
				console.log(
					`📝 [POSSIBLE ITEMS] Receita "${recipe.nome}": rendimento ${recipe.rendimento}, ${recipe.ingredientes.length} ingredientes`,
				);
				return recipeWithStock;
			});

			console.log(
				"🍰 [POSSIBLE ITEMS] Receitas com dados de estoque preparadas:",
				JSON.stringify(recipesWithStock, null, 2),
			);

			// RF-031: Send to OpenAI
			console.log("🤖 [POSSIBLE ITEMS] Enviando dados para OpenAI...");
			const result = await calculateProductionPotential(
				recipesWithStock,
				stockReport,
			);

			console.log(
				"✅ [POSSIBLE ITEMS] Resultado recebido da IA:",
				JSON.stringify(result, null, 2),
			);
			console.log(
				"📊 [POSSIBLE ITEMS] Total de receitas no resultado:",
				result.length,
			);

			// RF-032: Validate completeness
			const resultRecipeNames = result.map((r) => r.receita);
			const missingRecipes = selectedRecipes.filter(
				(r) => !resultRecipeNames.includes(r.nome),
			);

			console.log(
				"🔍 [POSSIBLE ITEMS] Receitas enviadas:",
				selectedRecipes.map((r) => r.nome),
			);
			console.log(
				"🔍 [POSSIBLE ITEMS] Receitas retornadas:",
				resultRecipeNames,
			);
			console.log(
				"⚠️ [POSSIBLE ITEMS] Receitas faltando:",
				missingRecipes.map((r) => r.nome),
			);

			if (missingRecipes.length > 0) {
				const missingNames = missingRecipes.map((r) => r.nome).join(", ");
				console.warn(
					"⚠️ [POSSIBLE ITEMS] Algumas receitas não foram retornadas:",
					missingNames,
				);
				Alert.alert(
					"Aviso",
					`Não foi possível calcular o potencial produtivo para: ${missingNames}`,
				);
			}

			// RF-033: Save output
			const output = {
				timestamp: new Date().toISOString(),
				resultado: result,
			};
			console.log(
				"💾 [POSSIBLE ITEMS] Salvando output:",
				JSON.stringify(output, null, 2),
			);
			saveAIOutput(output);
			setAIOutput(result);

			// Sort by quantity (highest first)
			result.sort((a, b) => b.quantidadePossivel - a.quantidadePossivel);
			console.log(
				"📊 [POSSIBLE ITEMS] Resultado ordenado:",
				JSON.stringify(result, null, 2),
			);
			console.log("✅ [POSSIBLE ITEMS] Relatório gerado com sucesso!");
		} catch (error) {
			console.error("❌ [POSSIBLE ITEMS] Erro ao gerar relatório:", error);
			console.error("❌ [POSSIBLE ITEMS] Stack trace:", (error as Error).stack);
			Alert.alert(
				"Erro",
				"Não foi possível calcular o potencial produtivo. Verifique se há receitas selecionadas e estoque disponível. Tente novamente.",
			);
		} finally {
			setIsGenerating(false);
			console.log(
				"🏁 [POSSIBLE ITEMS] Processo de geração de relatório finalizado",
			);
		}
	};

	const handleClearHistory = () => {
		Alert.alert(
			"Limpar Histórico",
			"Tem certeza que deseja limpar a seleção e o histórico?",
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Limpar",
					style: "destructive",
					onPress: () => {
						clearPossibleItemsData();
						setSelectedRecipeIdsState([]);
						setAIOutput([]);
					},
				},
			],
		);
	};

	const stockItems = getAllStockItems();

	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			{!showRecipeForm ? (
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={handleRefresh}
						/>
					}
				>
					<VStack space="xl" width="100%" padding={24}>
						<VStack space="md">
							<HStack justifyContent="space-between" alignItems="center">
								<Heading size="2xl" color="$primary500">
									Itens Possíveis
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
								Gerencie receitas e calcule o potencial produtivo
							</Text>
						</VStack>

						{recipes.length === 0 ? (
							<VStack space="md" alignItems="center" paddingTop={48}>
								<Text size="lg" color="$gray500" textAlign="center">
									Nenhuma receita cadastrada
								</Text>
								<Text size="sm" color="$gray400" textAlign="center">
									Cadastre receitas para calcular o potencial produtivo
								</Text>
								<Button
									onPress={handleStartNewRecipe}
									size="md"
									variant="solid"
									marginTop={16}
								>
									<ButtonText>Cadastrar Primeira Receita</ButtonText>
								</Button>
							</VStack>
						) : (
							<VStack space="lg" width="100%">
								<HStack
									justifyContent="space-between"
									alignItems="center"
									width="100%"
								>
									<Button
										onPress={handleStartNewRecipe}
										size="md"
										variant="solid"
									>
										<ButtonText>Nova Receita</ButtonText>
									</Button>
									{selectedRecipeIds.length > 0 && (
										<Button
											onPress={handleClearSelection}
											size="sm"
											variant="outline"
										>
											<ButtonText>Limpar Seleção</ButtonText>
										</Button>
									)}
								</HStack>

								{selectedRecipeIds.length > 0 && (
									<Box
										backgroundColor="$blue50"
										borderRadius={8}
										padding={12}
										borderWidth={1}
										borderColor="$blue200"
									>
										<Text size="sm" color="$blue900">
											{selectedRecipeIds.length}{" "}
											{selectedRecipeIds.length === 1
												? "receita selecionada"
												: "receitas selecionadas"}
										</Text>
									</Box>
								)}

								<VStack space="md" width="100%">
									{recipes.map((recipe) => {
										const isSelected = selectedRecipeIds.includes(recipe.id);
										return (
											<Box
												key={recipe.id}
												backgroundColor={isSelected ? "$primary50" : "$gray100"}
												borderRadius={8}
												padding={16}
												borderWidth={1}
												borderColor={isSelected ? "$primary300" : "$gray200"}
											>
												<VStack space="sm">
													<HStack
														justifyContent="space-between"
														alignItems="flex-start"
													>
														<TouchableOpacity
															style={styles.recipeRow}
															onPress={() =>
																handleToggleRecipeSelection(recipe.id)
															}
															activeOpacity={0.7}
														>
															<VStack flex={1} space="xs">
																<Text
																	size="lg"
																	fontWeight="$bold"
																	color="$gray900"
																>
																	{recipe.nome}
																</Text>
																<Text size="sm" color="$gray600">
																	Rendimento: {recipe.rendimento} unidades
																</Text>
																<Text size="sm" color="$gray600">
																	{recipe.ingredientes.length}{" "}
																	{recipe.ingredientes.length === 1
																		? "ingrediente"
																		: "ingredientes"}
																</Text>
															</VStack>
															<Box
																width={24}
																height={24}
																borderRadius={4}
																borderWidth={2}
																borderColor={
																	isSelected ? "$primary500" : "$gray400"
																}
																backgroundColor={
																	isSelected ? "$primary500" : "transparent"
																}
																justifyContent="center"
																alignItems="center"
															>
																{isSelected && (
																	<Text
																		color="white"
																		fontSize={16}
																		fontWeight="bold"
																	>
																		✓
																	</Text>
																)}
															</Box>
														</TouchableOpacity>
													</HStack>
													<HStack space="sm">
														<Button
															onPress={() => handleEditRecipe(recipe)}
															size="sm"
															variant="outline"
															flex={1}
														>
															<ButtonText>Editar</ButtonText>
														</Button>
														<Button
															onPress={() => handleDeleteRecipe(recipe)}
															size="sm"
															variant="outline"
															action="negative"
															flex={1}
														>
															<ButtonText>Excluir</ButtonText>
														</Button>
													</HStack>
												</VStack>
											</Box>
										);
									})}
								</VStack>

								{selectedRecipeIds.length > 0 && (
									<Button
										onPress={handleGenerateReport}
										isDisabled={isGenerating}
										size="lg"
										variant="solid"
									>
										<ButtonText>
											{isGenerating
												? "Gerando Relatório..."
												: "Gerar Relatório de Potencial Produtivo"}
										</ButtonText>
									</Button>
								)}

								{aiOutput.length > 0 && (
									<VStack space="md" width="100%">
										<HStack justifyContent="space-between" alignItems="center">
											<Heading size="lg" color="$primary500">
												Potencial Produtivo
											</Heading>
											<Button
												onPress={handleClearHistory}
												size="sm"
												variant="outline"
											>
												<ButtonText>Limpar Histórico</ButtonText>
											</Button>
										</HStack>
										{aiOutput
											.sort(
												(a, b) => b.quantidadePossivel - a.quantidadePossivel,
											)
											.map((result) => (
												<Box
													key={`${result.receita}-${result.quantidadePossivel}`}
													backgroundColor={
														result.alertas && result.alertas.length > 0
															? "$yellow50"
															: "$green50"
													}
													borderRadius={8}
													padding={16}
													borderWidth={1}
													borderColor={
														result.alertas && result.alertas.length > 0
															? "$yellow200"
															: "$green200"
													}
												>
													<VStack space="md">
														<VStack space="xs">
															<Text
																size="lg"
																fontWeight="$bold"
																color="$gray900"
															>
																{result.receita}
															</Text>
															<Text
																size="md"
																color={
																	result.alertas && result.alertas.length > 0
																		? "$yellow900"
																		: "$green900"
																}
															>
																Potencial produtivo:{" "}
																{formatNumber(result.quantidadePossivel)}{" "}
																{UNIT_LABELS[result.unidade]}
															</Text>
														</VStack>
														{result.alertas && result.alertas.length > 0 && (
															<VStack space="sm">
																{result.alertas.map((alerta, index) => (
																	<Box
																		key={`${result.receita}-alerta-${alerta.ingrediente}-${index}`}
																		backgroundColor={
																			alerta.tipo === "ingrediente_faltando"
																				? "$red50"
																				: "$orange50"
																		}
																		borderRadius={6}
																		padding={12}
																		borderWidth={1}
																		borderColor={
																			alerta.tipo === "ingrediente_faltando"
																				? "$red200"
																				: "$orange200"
																		}
																	>
																		<VStack space="xs">
																			<HStack alignItems="center" space="xs">
																				<Text
																					size="sm"
																					fontWeight="$bold"
																					color={
																						alerta.tipo ===
																						"ingrediente_faltando"
																							? "$red900"
																							: "$orange900"
																					}
																				>
																					{alerta.tipo ===
																					"ingrediente_faltando"
																						? "⚠️"
																						: "🔔"}
																				</Text>
																				<Text
																					size="sm"
																					fontWeight="$semibold"
																					color={
																						alerta.tipo ===
																						"ingrediente_faltando"
																							? "$red900"
																							: "$orange900"
																					}
																				>
																					{alerta.ingrediente}
																				</Text>
																			</HStack>
																			<Text
																				size="xs"
																				color={
																					alerta.tipo === "ingrediente_faltando"
																						? "$red700"
																						: "$orange700"
																				}
																			>
																				{alerta.mensagem}
																			</Text>
																			<Text
																				size="xs"
																				color={
																					alerta.tipo === "ingrediente_faltando"
																						? "$red600"
																						: "$orange600"
																				}
																			>
																				Necessário:{" "}
																				{formatNumber(
																					alerta.quantidadeNecessaria,
																				)}{" "}
																				{UNIT_LABELS[alerta.unidadeNecessaria]}{" "}
																				• Disponível:{" "}
																				{formatNumber(
																					alerta.quantidadeDisponivel,
																				)}{" "}
																				{UNIT_LABELS[alerta.unidadeDisponivel]}
																			</Text>
																		</VStack>
																	</Box>
																))}
															</VStack>
														)}
													</VStack>
												</Box>
											))}
									</VStack>
								)}
							</VStack>
						)}
					</VStack>
				</ScrollView>
			) : (
				<KeyboardAvoidingView
					style={styles.container}
					behavior={Platform.OS === "ios" ? "padding" : "height"}
				>
					<ScrollView
						contentContainerStyle={styles.scrollContent}
						keyboardShouldPersistTaps="handled"
					>
						<VStack space="xl" width="100%" padding={24}>
							<VStack space="md">
								<Heading size="2xl" color="$primary500">
									{editingRecipe ? "Editar Receita" : "Nova Receita"}
								</Heading>
								<Button
									onPress={() => {
										setShowRecipeForm(false);
										setRecipeFormErrors({});
									}}
									size="sm"
									variant="outline"
									alignSelf="flex-start"
								>
									<ButtonText>Voltar</ButtonText>
								</Button>
							</VStack>

							<VStack space="lg" width="100%">
								<FormControl isInvalid={!!recipeFormErrors.nome}>
									<FormControlLabel>
										<FormControlLabelText>Nome da Receita</FormControlLabelText>
									</FormControlLabel>
									<Input>
										<InputField
											placeholder="Ex: Cookie de Chocolate"
											value={recipeFormData.nome}
											onChangeText={(text) =>
												setRecipeFormData({ ...recipeFormData, nome: text })
											}
										/>
									</Input>
									{recipeFormErrors.nome && (
										<FormControlError>
											<FormControlErrorText>
												{recipeFormErrors.nome}
											</FormControlErrorText>
										</FormControlError>
									)}
								</FormControl>

								<FormControl isInvalid={!!recipeFormErrors.rendimento}>
									<FormControlLabel>
										<FormControlLabelText>Rendimento</FormControlLabelText>
									</FormControlLabel>
									<Input>
										<InputField
											placeholder="Quantidade de unidades produzidas"
											value={recipeFormData.rendimento}
											onChangeText={(text) =>
												setRecipeFormData({
													...recipeFormData,
													rendimento: text,
												})
											}
											keyboardType="numeric"
										/>
									</Input>
									{recipeFormErrors.rendimento && (
										<FormControlError>
											<FormControlErrorText>
												{recipeFormErrors.rendimento}
											</FormControlErrorText>
										</FormControlError>
									)}
								</FormControl>

								<VStack space="md" width="100%">
									<HStack
										justifyContent="space-between"
										alignItems="center"
										flexWrap="wrap"
									>
										<Text size="lg" fontWeight="$semibold">
											Ingredientes
										</Text>
										<HStack space="sm">
											<Button
												onPress={
													isRecording
														? handleStopRecording
														: handleStartRecording
												}
												isDisabled={isProcessingAudio}
												size="sm"
												variant={isRecording ? "solid" : "outline"}
												action={isRecording ? "negative" : "primary"}
											>
												<ButtonText>
													{isRecording
														? `⏹️ Parar (${recordTime})`
														: isProcessingAudio
															? "🎙️ Processando..."
															: "🎙️ Gravar por Áudio"}
												</ButtonText>
											</Button>
											<Button
												onPress={handleAddIngredient}
												size="sm"
												variant="outline"
											>
												<ButtonText>➕ Adicionar</ButtonText>
											</Button>
										</HStack>
									</HStack>
									{isRecording && (
										<Box
											backgroundColor="$red50"
											borderRadius={8}
											padding={12}
											borderWidth={1}
											borderColor="$red200"
										>
											<HStack
												justifyContent="space-between"
												alignItems="center"
											>
												<Text size="sm" color="$red900">
													🎤 Gravando... {recordTime}
												</Text>
												<Button
													onPress={handleCancelRecording}
													size="xs"
													variant="outline"
													action="negative"
												>
													<ButtonText>Cancelar</ButtonText>
												</Button>
											</HStack>
										</Box>
									)}

									{recipeFormErrors.ingredientes && (
										<Text size="sm" color="$error500">
											{recipeFormErrors.ingredientes}
										</Text>
									)}

									{recipeIngredients.map((ingredient, index) => {
										// Find selected stock item to display its name
										const selectedStockItem = ingredient.itemEstoqueId
											? stockItems.find(
													(item) => item.id === ingredient.itemEstoqueId,
												)
											: null;

										console.log(`🔍 [RECIPE FORM] Ingrediente ${index + 1}:`, {
											id: ingredient.id,
											itemEstoqueId: ingredient.itemEstoqueId,
											nome: ingredient.nome,
											selectedStockItem:
												selectedStockItem?.nome || "não encontrado",
										});

										// Available items: exclude items used in OTHER ingredients, but always include the current selected item
										let availableStockItems = stockItems.filter((item) => {
											// Always include the currently selected item for this ingredient
											if (item.id === ingredient.itemEstoqueId) {
												return true;
											}
											// Exclude items used in other ingredients
											return !recipeIngredients.some(
												(ing) =>
													ing.itemEstoqueId === item.id &&
													ing.id !== ingredient.id,
											);
										});

										// Sort: selected item first, then alphabetically
										if (ingredient.itemEstoqueId) {
											availableStockItems = [
												...availableStockItems.filter(
													(item) => item.id === ingredient.itemEstoqueId,
												),
												...availableStockItems
													.filter(
														(item) => item.id !== ingredient.itemEstoqueId,
													)
													.sort((a, b) => a.nome.localeCompare(b.nome)),
											];
										} else {
											availableStockItems.sort((a, b) =>
												a.nome.localeCompare(b.nome),
											);
										}

										// Display value: use ingredient name if no stock item found (fallback), otherwise use stock item name
										const displayValue = selectedStockItem
											? `${selectedStockItem.nome} (${selectedStockItem.quantidade} ${UNIT_LABELS[selectedStockItem.unidade]})`
											: ingredient.nome || undefined;

										console.log(
											`📝 [RECIPE FORM] Ingrediente ${index + 1} - Display value:`,
											displayValue,
										);
										console.log(
											`📝 [RECIPE FORM] Ingrediente ${index + 1} - Item selecionado:`,
											selectedStockItem?.nome,
										);

										return (
											<Box
												key={ingredient.id}
												backgroundColor="$gray50"
												borderRadius={8}
												padding={16}
												borderWidth={1}
												borderColor="$gray200"
											>
												<VStack space="md">
													<HStack
														justifyContent="space-between"
														alignItems="center"
													>
														<Text size="sm" fontWeight="$semibold">
															Ingrediente {index + 1}
														</Text>
														{recipeIngredients.length > 1 && (
															<Button
																onPress={() =>
																	handleRemoveIngredient(ingredient.id)
																}
																size="xs"
																variant="outline"
																action="negative"
															>
																<ButtonText>Remover</ButtonText>
															</Button>
														)}
													</HStack>

													<FormControl>
														<FormControlLabel>
															<FormControlLabelText>
																Ingrediente
															</FormControlLabelText>
														</FormControlLabel>
														<Select
															selectedValue={
																ingredient.itemEstoqueId || undefined
															}
															onValueChange={(value) =>
																handleIngredientStockItemChange(
																	ingredient.id,
																	value,
																)
															}
														>
															<SelectTrigger variant="outline" size="md">
																<SelectInput
																	placeholder="Selecione um item do estoque"
																	value={displayValue}
																/>
															</SelectTrigger>
															<SelectPortal>
																<SelectBackdrop />
																<SelectContent>
																	<SelectDragIndicatorWrapper>
																		<SelectDragIndicator />
																	</SelectDragIndicatorWrapper>
																	{availableStockItems.map((item) => (
																		<SelectItem
																			key={item.id}
																			label={`${item.nome} (${item.quantidade} ${UNIT_LABELS[item.unidade]})`}
																			value={item.id}
																		/>
																	))}
																	{/* Always include selected item if not in available list (for display) */}
																	{selectedStockItem &&
																		!availableStockItems.some(
																			(item) =>
																				item.id === selectedStockItem.id,
																		) && (
																			<SelectItem
																				key={selectedStockItem.id}
																				label={`${selectedStockItem.nome} (${selectedStockItem.quantidade} ${UNIT_LABELS[selectedStockItem.unidade]})`}
																				value={selectedStockItem.id}
																			/>
																		)}
																</SelectContent>
															</SelectPortal>
														</Select>
													</FormControl>

													{ingredient.itemEstoqueId && (
														<>
															<FormControl>
																<FormControlLabel>
																	<FormControlLabelText>
																		Quantidade Necessária
																	</FormControlLabelText>
																</FormControlLabel>
																<Input>
																	<InputField
																		placeholder="0.0"
																		value={ingredient.quantidade}
																		onChangeText={(text) => {
																			setRecipeIngredients(
																				recipeIngredients.map((ing) =>
																					ing.id === ingredient.id
																						? { ...ing, quantidade: text }
																						: ing,
																				),
																			);
																		}}
																		keyboardType="numeric"
																	/>
																</Input>
															</FormControl>

															<FormControl>
																<FormControlLabel>
																	<FormControlLabelText>
																		Unidade de Medida
																		{getCompatibleUnits(ingredient.unidade)
																			.length > 1
																			? " (pode alterar)"
																			: ""}
																	</FormControlLabelText>
																</FormControlLabel>
																<Select
																	selectedValue={ingredient.unidade}
																	onValueChange={(value) =>
																		handleIngredientUnitChange(
																			ingredient.id,
																			value as Unit,
																		)
																	}
																	isDisabled={
																		getCompatibleUnits(ingredient.unidade)
																			.length === 1
																	}
																>
																	<SelectTrigger variant="outline" size="md">
																		<SelectInput
																			placeholder="Selecione a unidade"
																			value={UNIT_LABELS[ingredient.unidade]}
																		/>
																	</SelectTrigger>
																	<SelectPortal>
																		<SelectBackdrop />
																		<SelectContent>
																			<SelectDragIndicatorWrapper>
																				<SelectDragIndicator />
																			</SelectDragIndicatorWrapper>
																			{getCompatibleUnits(
																				ingredient.unidade,
																			).map((unit) => (
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
														</>
													)}
												</VStack>
											</Box>
										);
									})}
								</VStack>

								<Button onPress={handleSaveRecipe} size="lg" variant="solid">
									<ButtonText>
										{editingRecipe ? "Salvar Alterações" : "Salvar Receita"}
									</ButtonText>
								</Button>
							</VStack>
						</VStack>
					</ScrollView>
				</KeyboardAvoidingView>
			)}
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
	recipeRow: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
});

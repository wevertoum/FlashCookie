/**
 * Stock listing screen
 */

import {
	Box,
	Button,
	ButtonText,
	Heading,
	HStack,
	Text,
	VStack,
} from "@gluestack-ui/themed";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type React from "react";
import { useEffect, useState } from "react";
import {
	Alert,
	RefreshControl,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/AppNavigator";
import {
	deleteStockItem,
	getAllStockItems,
} from "../repositories/stockRepository";
import { type StockItem, Unit } from "../types";

type StockScreenProps = NativeStackScreenProps<RootStackParamList, "Stock">;

const UNIT_LABELS: Record<Unit, string> = {
	[Unit.KG]: "kg",
	[Unit.G]: "g",
	[Unit.L]: "L",
	[Unit.ML]: "mL",
	[Unit.UN]: "un",
	[Unit.DUZIA]: "duzia",
};

export const StockScreen: React.FC<StockScreenProps> = ({ navigation }) => {
	const [stockItems, setStockItems] = useState<StockItem[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);

	useEffect(() => {
		const loadStockItems = () => {
			const items = getAllStockItems();
			const sortedItems = [...items].sort((a, b) =>
				a.nome.localeCompare(b.nome),
			);
			setStockItems(sortedItems);
		};

		loadStockItems();
	}, []);

	const handleRefresh = () => {
		setIsRefreshing(true);
		const items = getAllStockItems();
		const sortedItems = [...items].sort((a, b) => a.nome.localeCompare(b.nome));
		setStockItems(sortedItems);
		setIsRefreshing(false);
	};

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	const handleDeleteItem = (item: StockItem) => {
		Alert.alert(
			"Remover Item",
			`Deseja realmente remover "${item.nome}" do estoque?`,
			[
				{
					text: "Cancelar",
					style: "cancel",
				},
				{
					text: "Remover",
					style: "destructive",
					onPress: () => {
						deleteStockItem(item.id);
						const items = getAllStockItems();
						const sortedItems = [...items].sort((a, b) =>
							a.nome.localeCompare(b.nome),
						);
						setStockItems(sortedItems);
					},
				},
			],
		);
	};

	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				refreshControl={
					<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
				}
			>
				<VStack space="xl" width="100%" padding={24}>
					<VStack space="md">
						<HStack justifyContent="space-between" alignItems="center">
							<Heading size="2xl" color="$primary500">
								Estoque
							</Heading>
							<Button
								onPress={() => navigation.goBack()}
								size="sm"
								variant="outline"
							>
								<ButtonText>Voltar</ButtonText>
							</Button>
						</HStack>
						<Text size="md" color="$gray600">
							{stockItems.length === 0
								? "Nenhum item no estoque"
								: `${stockItems.length} ${stockItems.length === 1 ? "item" : "itens"}`}
						</Text>
					</VStack>

					{stockItems.length === 0 ? (
						<VStack space="md" alignItems="center" paddingTop={48}>
							<Text size="lg" color="$gray500" textAlign="center">
								Estoque vazio
							</Text>
							<Text size="sm" color="$gray400" textAlign="center">
								Adicione itens através da entrada de estoque
							</Text>
							<Button
								onPress={() => navigation.navigate("Input")}
								size="md"
								variant="solid"
								marginTop={16}
							>
								<ButtonText>Adicionar Itens</ButtonText>
							</Button>
						</VStack>
					) : (
						<VStack space="md" width="100%">
							{stockItems.map((item) => (
								<Box
									key={item.id}
									backgroundColor="$gray100"
									borderRadius={8}
									padding={16}
									borderWidth={1}
									borderColor="$gray200"
								>
									<VStack space="sm">
										<HStack
											justifyContent="space-between"
											alignItems="flex-start"
										>
											<VStack flex={1} space="xs">
												<Text size="lg" fontWeight="$bold" color="$gray900">
													{item.nome}
												</Text>
												<HStack space="sm" alignItems="center">
													<Text size="md" color="$gray700">
														Quantidade:
													</Text>
													<Text
														size="md"
														fontWeight="$semibold"
														color="$primary600"
													>
														{item.quantidade.toFixed(2)}{" "}
														{UNIT_LABELS[item.unidade]}
													</Text>
												</HStack>
											</VStack>
											<TouchableOpacity
												onPress={() => handleDeleteItem(item)}
												style={styles.deleteButton}
											>
												<Text style={styles.deleteButtonText}>×</Text>
											</TouchableOpacity>
										</HStack>
										<HStack space="md" alignItems="center">
											<Text size="xs" color="$gray500">
												Criado em: {formatDate(item.createdAt)}
											</Text>
											{item.updatedAt !== item.createdAt && (
												<Text size="xs" color="$gray500">
													Atualizado em: {formatDate(item.updatedAt)}
												</Text>
											)}
										</HStack>
									</VStack>
								</Box>
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
	deleteButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#EF4444",
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 8,
	},
	deleteButtonText: {
		color: "#FFFFFF",
		fontSize: 24,
		fontWeight: "bold",
		lineHeight: 28,
	},
});

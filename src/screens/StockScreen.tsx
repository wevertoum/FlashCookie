/**
 * Stock listing screen
 */

import {
	Button,
	ButtonText,
	Heading,
	HStack,
	Text,
	VStack,
} from "@gluestack-ui/themed";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
	Alert,
	RefreshControl,
	ScrollView,
	StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StockItemCard } from "../components/StockItemCard";
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

	const loadStockItems = useCallback(() => {
		const items = getAllStockItems();
		const sortedItems = [...items].sort((a, b) => a.nome.localeCompare(b.nome));
		setStockItems(sortedItems);
	}, []);

	useEffect(() => {
		loadStockItems();
	}, [loadStockItems]);

	useFocusEffect(
		useCallback(() => {
			loadStockItems();
		}, [loadStockItems]),
	);

	const handleRefresh = () => {
		setIsRefreshing(true);
		loadStockItems();
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
								onPress={() => navigation.navigate("Home")}
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
								<StockItemCard
									key={item.id}
									item={item}
									unitLabels={UNIT_LABELS}
									formatDate={formatDate}
									onDelete={handleDeleteItem}
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

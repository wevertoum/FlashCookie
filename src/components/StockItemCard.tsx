import { Box, HStack, Text, VStack } from "@gluestack-ui/themed";
import type React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import type { StockItem, Unit } from "../types";

interface StockItemCardProps {
	item: StockItem;
	unitLabels: Record<Unit, string>;
	formatDate: (dateString: string) => string;
	onDelete: (item: StockItem) => void;
}

export const StockItemCard: React.FC<StockItemCardProps> = ({
	item,
	unitLabels,
	formatDate,
	onDelete,
}) => {
	return (
		<Box
			backgroundColor="$gray100"
			borderRadius={8}
			padding={16}
			borderWidth={1}
			borderColor="$gray200"
		>
			<VStack space="sm">
				<HStack justifyContent="space-between" alignItems="flex-start">
					<VStack flex={1} space="xs">
						<Text size="lg" fontWeight="$bold" color="$gray900">
							{item.nome}
						</Text>
						<HStack space="sm" alignItems="center">
							<Text size="md" color="$gray700">
								Quantidade:
							</Text>
							<Text size="md" fontWeight="$semibold" color="$primary600">
								{item.quantidade.toFixed(2)} {unitLabels[item.unidade]}
							</Text>
						</HStack>
					</VStack>
					<TouchableOpacity onPress={() => onDelete(item)} style={styles.deleteButton}>
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
	);
};

const styles = StyleSheet.create({
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


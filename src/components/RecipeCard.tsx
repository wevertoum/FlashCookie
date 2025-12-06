import {
	Box,
	Button,
	ButtonText,
	HStack,
	Text,
	VStack,
} from "@gluestack-ui/themed";
import type React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import type { Recipe } from "../types";

interface RecipeCardProps {
	recipe: Recipe;
	isSelected: boolean;
	onToggleSelection: (recipeId: string) => void;
	onEdit: (recipe: Recipe) => void;
	onDelete: (recipe: Recipe) => void;
	onViewDetails?: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
	recipe,
	isSelected,
	onToggleSelection,
	onEdit,
	onDelete,
	onViewDetails,
}) => {
	return (
		<Box
			backgroundColor={isSelected ? "$primary50" : "$gray100"}
			borderRadius={8}
			padding={16}
			borderWidth={1}
			borderColor={isSelected ? "$primary300" : "$gray200"}
		>
			<VStack space="sm">
				<HStack justifyContent="space-between" alignItems="flex-start">
					<TouchableOpacity
						style={styles.recipeRow}
						onPress={() => onToggleSelection(recipe.id)}
						activeOpacity={0.7}
					>
						<VStack flex={1} space="xs">
							<TouchableOpacity
								onPress={() => onViewDetails?.(recipe)}
								activeOpacity={0.7}
							>
								<Text size="lg" fontWeight="$bold" color="$gray900">
									{recipe.nome}
								</Text>
							</TouchableOpacity>
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
							borderColor={isSelected ? "$primary500" : "$gray400"}
							backgroundColor={isSelected ? "$primary500" : "transparent"}
							justifyContent="center"
							alignItems="center"
						>
							{isSelected && (
								<Text color="white" fontSize={16} fontWeight="bold">
									✓
								</Text>
							)}
						</Box>
					</TouchableOpacity>
				</HStack>
				<HStack space="sm">
					{onViewDetails && (
						<Button
							onPress={() => onViewDetails(recipe)}
							size="sm"
							variant="outline"
							flex={1}
						>
							<ButtonText>Ver Detalhes</ButtonText>
						</Button>
					)}
					<Button
						onPress={() => onEdit(recipe)}
						size="sm"
						variant="outline"
						flex={1}
					>
						<ButtonText>Editar</ButtonText>
					</Button>
					<Button
						onPress={() => onDelete(recipe)}
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
};

const styles = StyleSheet.create({
	recipeRow: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
});

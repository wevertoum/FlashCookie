import {
	Box,
	Button,
	ButtonText,
	FormControl,
	FormControlLabel,
	FormControlLabelText,
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
import type React from "react";
import type { StockItem, Unit } from "../types";
import { getCompatibleUnits } from "../utils/possibleItemsHelpers";

interface EditableIngredient {
	id: string;
	itemEstoqueId: string;
	nome: string;
	quantidade: string;
	unidade: Unit;
}

interface IngredientFormItemProps {
	ingredient: EditableIngredient;
	index: number;
	stockItems: StockItem[];
	allIngredients: EditableIngredient[];
	unitLabels: Record<Unit, string>;
	onStockItemChange: (ingredientId: string, stockItemId: string) => void;
	onQuantityChange: (ingredientId: string, quantity: string) => void;
	onUnitChange: (ingredientId: string, unit: Unit) => void;
	onRemove: (ingredientId: string) => void;
	canRemove: boolean;
}

export const IngredientFormItem: React.FC<IngredientFormItemProps> = ({
	ingredient,
	index,
	stockItems,
	allIngredients,
	unitLabels,
	onStockItemChange,
	onQuantityChange,
	onUnitChange,
	onRemove,
	canRemove,
}) => {
	const selectedStockItem = ingredient.itemEstoqueId
		? stockItems.find((item) => item.id === ingredient.itemEstoqueId)
		: null;

	let availableStockItems = stockItems.filter((item) => {
		if (item.id === ingredient.itemEstoqueId) {
			return true;
		}
		return !allIngredients.some(
			(ing) => ing.itemEstoqueId === item.id && ing.id !== ingredient.id,
		);
	});

	if (ingredient.itemEstoqueId) {
		availableStockItems = [
			...availableStockItems.filter((item) => item.id === ingredient.itemEstoqueId),
			...availableStockItems
				.filter((item) => item.id !== ingredient.itemEstoqueId)
				.sort((a, b) => a.nome.localeCompare(b.nome)),
		];
	} else {
		availableStockItems.sort((a, b) => a.nome.localeCompare(b.nome));
	}

	const displayValue = selectedStockItem
		? `${selectedStockItem.nome} (${selectedStockItem.quantidade} ${unitLabels[selectedStockItem.unidade]})`
		: ingredient.nome || undefined;

	const compatibleUnits = getCompatibleUnits(ingredient.unidade);

	return (
		<Box
			backgroundColor="$gray50"
			borderRadius={8}
			padding={16}
			borderWidth={1}
			borderColor="$gray200"
		>
			<VStack space="md">
				<HStack justifyContent="space-between" alignItems="center">
					<Text size="sm" fontWeight="$semibold">
						Ingrediente {index + 1}
					</Text>
					{canRemove && (
						<Button
							onPress={() => onRemove(ingredient.id)}
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
						<FormControlLabelText>Ingrediente</FormControlLabelText>
					</FormControlLabel>
					<Select
						selectedValue={ingredient.itemEstoqueId || undefined}
						onValueChange={(value) => onStockItemChange(ingredient.id, value)}
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
										label={`${item.nome} (${item.quantidade} ${unitLabels[item.unidade]})`}
										value={item.id}
									/>
								))}
								{selectedStockItem &&
									!availableStockItems.some(
										(item) => item.id === selectedStockItem.id,
									) && (
										<SelectItem
											key={selectedStockItem.id}
											label={`${selectedStockItem.nome} (${selectedStockItem.quantidade} ${unitLabels[selectedStockItem.unidade]})`}
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
								<FormControlLabelText>Quantidade Necessária</FormControlLabelText>
							</FormControlLabel>
							<Input>
								<InputField
									placeholder="0.0"
									value={ingredient.quantidade}
									onChangeText={(text) => onQuantityChange(ingredient.id, text)}
									keyboardType="numeric"
								/>
							</Input>
						</FormControl>

						<FormControl>
							<FormControlLabel>
								<FormControlLabelText>
									Unidade de Medida
									{compatibleUnits.length > 1 ? " (pode alterar)" : ""}
								</FormControlLabelText>
							</FormControlLabel>
							<Select
								selectedValue={ingredient.unidade}
								onValueChange={(value) => onUnitChange(ingredient.id, value as Unit)}
								isDisabled={compatibleUnits.length === 1}
							>
								<SelectTrigger variant="outline" size="md">
									<SelectInput
										placeholder="Selecione a unidade"
										value={unitLabels[ingredient.unidade]}
									/>
								</SelectTrigger>
								<SelectPortal>
									<SelectBackdrop />
									<SelectContent>
										<SelectDragIndicatorWrapper>
											<SelectDragIndicator />
										</SelectDragIndicatorWrapper>
										{compatibleUnits.map((unit) => (
											<SelectItem key={unit} label={unitLabels[unit]} value={unit} />
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
};


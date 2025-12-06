import {
	Button,
	ButtonText,
	FormControl,
	FormControlLabel,
	FormControlLabelText,
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
import type { Unit } from "../types";

interface EditableItem {
	id: string;
	nome: string;
	quantidade: number;
	unidade: Unit;
}

interface ItemFormCardProps {
	item: EditableItem;
	index: number;
	units: Array<{ label: string; value: Unit }>;
	onUpdate: (itemId: string, field: keyof EditableItem, value: string | number | Unit) => void;
	onRemove: (itemId: string) => void;
}

export const ItemFormCard: React.FC<ItemFormCardProps> = ({
	item,
	index,
	units,
	onUpdate,
	onRemove,
}) => {
	return (
		<VStack
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
					<FormControlLabelText>Nome do Produto</FormControlLabelText>
				</FormControlLabel>
				<Input>
					<InputField
						placeholder="Nome do produto"
						value={item.nome}
						onChangeText={(value) => onUpdate(item.id, "nome", value)}
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
							onUpdate(item.id, "quantidade", num);
						}}
						keyboardType="numeric"
					/>
				</Input>
			</FormControl>

			<FormControl>
				<FormControlLabel>
					<FormControlLabelText>Unidade de Medida</FormControlLabelText>
				</FormControlLabel>
				<Select
					selectedValue={item.unidade}
					onValueChange={(value) => onUpdate(item.id, "unidade", value as Unit)}
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
							{units.map((unit) => (
								<SelectItem key={unit.value} label={unit.label} value={unit.value} />
							))}
						</SelectContent>
					</SelectPortal>
				</Select>
			</FormControl>

			<Button onPress={() => onRemove(item.id)} size="sm" variant="outline" action="negative">
				<ButtonText>Remover</ButtonText>
			</Button>
		</VStack>
	);
};


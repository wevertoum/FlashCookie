import { Box, Button, ButtonText, HStack, Text, VStack } from "@gluestack-ui/themed";
import type React from "react";
import type { Unit } from "../types";

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

interface ItemToRemoveCardProps {
	item: ItemToRemove;
	unitLabels: Record<Unit, string>;
	onConfirm: (itemId: string) => void;
	onAbort: (itemId: string) => void;
}

export const ItemToRemoveCard: React.FC<ItemToRemoveCardProps> = ({
	item,
	unitLabels,
	onConfirm,
	onAbort,
}) => {
	const isNegative = item.quantidadeRestante < 0;

	return (
		<Box
			backgroundColor={item.confirmed ? "$green50" : "$gray100"}
			borderRadius={8}
			padding={16}
			borderWidth={1}
			borderColor={item.confirmed ? "$green200" : "$gray200"}
		>
			<VStack space="md">
				<VStack space="xs">
					<Text size="lg" fontWeight="$bold" color="$gray900">
						{item.nome}
					</Text>
					<HStack space="md" flexWrap="wrap">
						<VStack space="xs" flex={1}>
							<Text size="sm" color="$gray600">
								Quantidade atual:
							</Text>
							<Text size="md" fontWeight="$semibold" color="$primary600">
								{item.quantidadeAtual.toFixed(2)} {unitLabels[item.unidadeAtual]}
							</Text>
						</VStack>
						<VStack space="xs" flex={1}>
							<Text size="sm" color="$gray600">
								Quantidade a remover:
							</Text>
							<Text size="md" fontWeight="$semibold" color="$error600">
								{item.quantidadeRemover.toFixed(2)} {unitLabels[item.unidadeRemover]}
							</Text>
						</VStack>
					</HStack>
					<VStack space="xs">
						<Text size="sm" color="$gray600">
							Quantidade restante:
						</Text>
						<Text
							size="md"
							fontWeight="$semibold"
							color={isNegative ? "$error600" : "$green600"}
						>
							{isNegative ? "0.00" : item.quantidadeRestante.toFixed(2)}{" "}
							{unitLabels[item.unidadeAtual]}
							{isNegative && (
								<Text size="sm" color="$error600">
									{" "}
									(insuficiente)
								</Text>
							)}
						</Text>
					</VStack>
				</VStack>
				{item.confirmed ? (
					<Box backgroundColor="$green100" borderRadius={6} padding={8}>
						<Text size="sm" color="$green900" textAlign="center">
							✓ Confirmado
						</Text>
					</Box>
				) : (
					<HStack space="sm">
						<Button
							onPress={() => onConfirm(item.id)}
							size="md"
							variant="solid"
							flex={1}
						>
							<ButtonText>Confirmar</ButtonText>
						</Button>
						<Button onPress={() => onAbort(item.id)} size="md" variant="outline" flex={1}>
							<ButtonText>Cancelar</ButtonText>
						</Button>
					</HStack>
				)}
			</VStack>
		</Box>
	);
};


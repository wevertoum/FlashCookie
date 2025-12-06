import { Box, Text, VStack } from "@gluestack-ui/themed";
import type React from "react";
import type { Unit } from "../types";
import { AlertCard } from "./AlertCard";

interface ProductionPotentialResult {
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
}

interface ProductionPotentialResultCardProps {
	result: ProductionPotentialResult;
	formatNumber: (value: number) => string;
	unitLabels: Record<Unit, string>;
}

export const ProductionPotentialResultCard: React.FC<ProductionPotentialResultCardProps> = ({
	result,
	formatNumber,
	unitLabels,
}) => {
	const hasAlerts = result.alertas && result.alertas.length > 0;

	return (
		<Box
			backgroundColor={hasAlerts ? "$yellow50" : "$green50"}
			borderRadius={8}
			padding={16}
			borderWidth={1}
			borderColor={hasAlerts ? "$yellow200" : "$green200"}
		>
			<VStack space="md">
				<VStack space="xs">
					<Text size="lg" fontWeight="$bold" color="$gray900">
						{result.receita}
					</Text>
					<Text size="md" color={hasAlerts ? "$yellow900" : "$green900"}>
						Potencial produtivo: {formatNumber(result.quantidadePossivel)}{" "}
						{unitLabels[result.unidade]}
					</Text>
				</VStack>
				{hasAlerts && (
					<VStack space="sm">
						{result.alertas!.map((alerta, index) => (
							<AlertCard
								key={`${result.receita}-alerta-${alerta.ingrediente}-${index}`}
								alerta={alerta}
								index={index}
								recipeName={result.receita}
								formatNumber={formatNumber}
								unitLabels={unitLabels}
							/>
						))}
					</VStack>
				)}
			</VStack>
		</Box>
	);
};


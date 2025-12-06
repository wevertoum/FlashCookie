import { Box, HStack, Text, VStack } from "@gluestack-ui/themed";
import type React from "react";
import type { Unit } from "../types";

interface Alert {
	tipo: "ingrediente_faltando" | "ingrediente_insuficiente";
	ingrediente: string;
	quantidadeNecessaria: number;
	unidadeNecessaria: Unit;
	quantidadeDisponivel: number;
	unidadeDisponivel: Unit;
	mensagem: string;
}

interface AlertCardProps {
	alerta: Alert;
	index: number;
	recipeName: string;
	formatNumber: (value: number) => string;
	unitLabels: Record<Unit, string>;
}

export const AlertCard: React.FC<AlertCardProps> = ({
	alerta,
	index,
	recipeName,
	formatNumber,
	unitLabels,
}) => {
	return (
		<Box
			key={`${recipeName}-alerta-${alerta.ingrediente}-${index}`}
			backgroundColor={
				alerta.tipo === "ingrediente_faltando" ? "$red50" : "$orange50"
			}
			borderRadius={6}
			padding={12}
			borderWidth={1}
			borderColor={alerta.tipo === "ingrediente_faltando" ? "$red200" : "$orange200"}
		>
			<VStack space="xs">
				<HStack alignItems="center" space="xs">
					<Text
						size="sm"
						fontWeight="$bold"
						color={alerta.tipo === "ingrediente_faltando" ? "$red900" : "$orange900"}
					>
						{alerta.tipo === "ingrediente_faltando" ? "⚠️" : "🔔"}
					</Text>
					<Text
						size="sm"
						fontWeight="$semibold"
						color={alerta.tipo === "ingrediente_faltando" ? "$red900" : "$orange900"}
					>
						{alerta.ingrediente}
					</Text>
				</HStack>
				<Text
					size="xs"
					color={alerta.tipo === "ingrediente_faltando" ? "$red700" : "$orange700"}
				>
					{alerta.mensagem}
				</Text>
				<Text
					size="xs"
					color={alerta.tipo === "ingrediente_faltando" ? "$red600" : "$orange600"}
				>
					Necessário: {formatNumber(alerta.quantidadeNecessaria)}{" "}
					{unitLabels[alerta.unidadeNecessaria]} • Disponível:{" "}
					{formatNumber(alerta.quantidadeDisponivel)}{" "}
					{unitLabels[alerta.unidadeDisponivel]}
				</Text>
			</VStack>
		</Box>
	);
};


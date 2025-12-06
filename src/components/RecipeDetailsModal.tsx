/**
 * Recipe Details Modal
 * RF-034: Display recipe details when clicking/tapping on recipe
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
import type React from "react";
import {
	Modal,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
import type { ProductionPotentialResult, Recipe } from "../types";
import { formatNumber, UNIT_LABELS } from "../utils/possibleItemsHelpers";
import { AlertCard } from "./AlertCard";

interface RecipeDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	recipe: Recipe | null;
	productionPotential?: ProductionPotentialResult;
}

export const RecipeDetailsModal: React.FC<RecipeDetailsModalProps> = ({
	isOpen,
	onClose,
	recipe,
	productionPotential,
}) => {
	if (!recipe) {
		return null;
	}

	const hasProductionPotential = productionPotential !== undefined;
	const hasAlerts =
		productionPotential?.alertas && productionPotential.alertas.length > 0;

	return (
		<Modal
			visible={isOpen}
			transparent={true}
			animationType="slide"
			onRequestClose={onClose}
		>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					{/* Header */}
					<View style={styles.modalHeader}>
						<VStack space="xs" flex={1}>
							<Heading size="lg" color="$gray900">
								{recipe.nome}
							</Heading>
							<Text size="sm" color="$gray600">
								Detalhes da receita
							</Text>
						</VStack>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<Text style={styles.closeButtonText}>✕</Text>
						</TouchableOpacity>
					</View>

					{/* Body */}
					<ScrollView
						style={styles.scrollView}
						showsVerticalScrollIndicator={true}
					>
						<VStack space="lg" width="100%" padding={16}>
							{/* Rendimento */}
							<Box
								backgroundColor="$blue50"
								borderRadius={8}
								padding={12}
								borderWidth={1}
								borderColor="$blue200"
							>
								<VStack space="xs">
									<Text size="sm" fontWeight="$semibold" color="$blue900">
										Rendimento
									</Text>
									<Text size="md" color="$blue700">
										{recipe.rendimento}{" "}
										{recipe.rendimento === 1 ? "unidade" : "unidades"}
									</Text>
								</VStack>
							</Box>

							{/* Potencial Produtivo */}
							{hasProductionPotential && (
								<Box
									backgroundColor={hasAlerts ? "$yellow50" : "$green50"}
									borderRadius={8}
									padding={12}
									borderWidth={1}
									borderColor={hasAlerts ? "$yellow200" : "$green200"}
								>
									<VStack space="xs">
										<Text
											size="sm"
											fontWeight="$semibold"
											color={hasAlerts ? "$yellow900" : "$green900"}
										>
											Potencial Produtivo Atual
										</Text>
										<Text
											size="md"
											color={hasAlerts ? "$yellow700" : "$green700"}
										>
											{formatNumber(productionPotential.quantidadePossivel)}{" "}
											{UNIT_LABELS[productionPotential.unidade]}
										</Text>
										{productionPotential.quantidadePossivel === 0 && (
											<Text
												size="sm"
												color={hasAlerts ? "$yellow700" : "$green700"}
											>
												Não é possível produzir esta receita com o estoque atual
											</Text>
										)}
									</VStack>
								</Box>
							)}

							{/* Ingredientes */}
							<VStack space="md">
								<Text size="lg" fontWeight="$bold" color="$gray900">
									Ingredientes ({recipe.ingredientes.length})
								</Text>
								<VStack space="sm">
									{recipe.ingredientes.map((ingrediente, index) => (
										<Box
											key={`${recipe.id}-ingrediente-${index}`}
											backgroundColor="$gray50"
											borderRadius={6}
											padding={12}
											borderWidth={1}
											borderColor="$gray200"
										>
											<HStack
												justifyContent="space-between"
												alignItems="center"
											>
												<VStack flex={1} space="xs">
													<Text
														size="md"
														fontWeight="$semibold"
														color="$gray900"
													>
														{ingrediente.nome}
													</Text>
													<Text size="sm" color="$gray600">
														{formatNumber(ingrediente.quantidade)}{" "}
														{UNIT_LABELS[ingrediente.unidade]}
													</Text>
												</VStack>
											</HStack>
										</Box>
									))}
								</VStack>
							</VStack>

							{/* Ingredientes Faltantes */}
							{hasAlerts && (
								<VStack space="md">
									<Text size="lg" fontWeight="$bold" color="$gray900">
										Ingredientes Faltantes ou Insuficientes
									</Text>
									<VStack space="sm">
										{productionPotential.alertas!.map((alerta, index) => (
											<AlertCard
												key={`${recipe.id}-alerta-${alerta.ingrediente}-${index}`}
												alerta={alerta}
												index={index}
												recipeName={recipe.nome}
												formatNumber={formatNumber}
												unitLabels={UNIT_LABELS}
											/>
										))}
									</VStack>
								</VStack>
							)}

							{/* Informações Adicionais */}
							<Box
								backgroundColor="$gray50"
								borderRadius={8}
								padding={12}
								borderWidth={1}
								borderColor="$gray200"
							>
								<VStack space="xs">
									<Text size="sm" fontWeight="$semibold" color="$gray700">
										Informações
									</Text>
									<Text size="xs" color="$gray600">
										Criada em:{" "}
										{new Date(recipe.createdAt).toLocaleDateString("pt-BR", {
											day: "2-digit",
											month: "2-digit",
											year: "numeric",
										})}
									</Text>
									<Text size="xs" color="$gray600">
										Última atualização:{" "}
										{new Date(recipe.updatedAt).toLocaleDateString("pt-BR", {
											day: "2-digit",
											month: "2-digit",
											year: "numeric",
										})}
									</Text>
								</VStack>
							</Box>
						</VStack>
					</ScrollView>

					{/* Footer */}
					<View style={styles.modalFooter}>
						<Button onPress={onClose} size="md" variant="solid" flex={1}>
							<ButtonText>Fechar</ButtonText>
						</Button>
					</View>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	modalContent: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		width: "100%",
		maxWidth: 600,
		maxHeight: "90%",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
		overflow: "hidden",
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#E5E5E5",
	},
	closeButton: {
		width: 32,
		height: 32,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 16,
		backgroundColor: "#F5F5F5",
	},
	closeButtonText: {
		fontSize: 18,
		color: "#666666",
		fontWeight: "bold",
	},
	scrollView: {
		flex: 1,
	},
	modalFooter: {
		padding: 16,
		borderTopWidth: 1,
		borderTopColor: "#E5E5E5",
	},
});

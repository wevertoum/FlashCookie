import { Box, Button, ButtonText, HStack, Text } from "@gluestack-ui/themed";
import type React from "react";

interface AudioRecordingControlsProps {
	isRecording: boolean;
	isProcessingAudio: boolean;
	recordTime: string;
	onStartRecording: () => void;
	onStopRecording: () => void;
	onCancelRecording: () => void;
}

export const AudioRecordingControls: React.FC<AudioRecordingControlsProps> = ({
	isRecording,
	isProcessingAudio,
	recordTime,
	onStartRecording,
	onStopRecording,
	onCancelRecording,
}) => {
	return (
		<>
			<Button
				onPress={isRecording ? onStopRecording : onStartRecording}
				isDisabled={isProcessingAudio}
				size="sm"
				variant={isRecording ? "solid" : "outline"}
				action={isRecording ? "negative" : "primary"}
			>
				<ButtonText>
					{isRecording
						? `⏹️ Parar (${recordTime})`
						: isProcessingAudio
							? "🎙️ Processando..."
							: "🎙️ Gravar por Áudio"}
				</ButtonText>
			</Button>
			{isRecording && (
				<Box
					backgroundColor="$red50"
					borderRadius={8}
					padding={12}
					borderWidth={1}
					borderColor="$red200"
				>
					<HStack justifyContent="space-between" alignItems="center">
						<Text size="sm" color="$red900">
							🎤 Gravando... {recordTime}
						</Text>
						<Button
							onPress={onCancelRecording}
							size="xs"
							variant="outline"
							action="negative"
						>
							<ButtonText>Cancelar</ButtonText>
						</Button>
					</HStack>
				</Box>
			)}
		</>
	);
};


# Guia para Rodar o App no iPhone Físico

## Pré-requisitos

1. **Xcode instalado** (disponível na App Store)
2. **CocoaPods instalado** (gerenciador de dependências iOS)
3. **Conta Apple Developer** (gratuita é suficiente para desenvolvimento)
4. **iPhone conectado via USB** e confiando no Mac

## Passo 1: Instalar CocoaPods (se ainda não tiver)

```bash
sudo gem install cocoapods
```

## Passo 2: Instalar Dependências iOS

```bash
cd ios
pod install
cd ..
```

## Passo 3: Configurar o Projeto no Xcode

1. Abra o projeto no Xcode:
   ```bash
   open ios/FlashCookie.xcworkspace
   ```
   **IMPORTANTE**: Use o arquivo `.xcworkspace`, não o `.xcodeproj`

2. No Xcode:
   - Selecione o projeto "FlashCookie" no navegador à esquerda
   - Selecione o target "FlashCookie"
   - Vá na aba "Signing & Capabilities"
   - Marque "Automatically manage signing"
   - Selecione seu **Team** (sua conta Apple Developer)
   - O Xcode vai gerar automaticamente um Bundle Identifier único

## Passo 4: Conectar o iPhone

1. Conecte o iPhone ao Mac via USB
2. No iPhone, confie no computador quando aparecer o aviso
3. No Xcode, selecione seu iPhone na lista de dispositivos (no topo, ao lado do botão Play)

## Passo 5: Rodar o App

### Opção 1: Via Xcode
- Clique no botão Play (▶️) no Xcode
- Ou pressione `Cmd + R`

### Opção 2: Via Terminal
```bash
# Listar dispositivos disponíveis
xcrun xctrace list devices

# Rodar no dispositivo físico (substitua "Nome do seu iPhone" pelo nome real)
npx react-native run-ios --device "Nome do seu iPhone"

# Ou simplesmente (se só tiver um dispositivo conectado)
npx react-native run-ios --device
```

## Troubleshooting

### Erro de Signing
- Certifique-se de que marcou "Automatically manage signing" no Xcode
- Verifique se selecionou seu Team corretamente
- Se necessário, ajuste o Bundle Identifier manualmente

### Erro "No devices found"
- Verifique se o iPhone está desbloqueado
- Confirme que confiou no computador
- Tente desconectar e reconectar o cabo USB

### Erro de Build
- Limpe o build: `Cmd + Shift + K` no Xcode
- Delete a pasta `ios/build` e `ios/Pods`
- Execute `pod install` novamente
- Tente buildar novamente

### Metro Bundler não conecta
- Certifique-se de que o iPhone e o Mac estão na mesma rede Wi-Fi
- Ou configure manualmente o IP no código (mais complexo)

## Notas Importantes

- Na primeira vez, pode demorar alguns minutos para compilar
- O app será instalado no seu iPhone
- Você pode precisar confiar no desenvolvedor no iPhone: Configurações > Geral > Gerenciamento de VPN e Dispositivos


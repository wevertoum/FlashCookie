# FlashCookie

Aplicativo mobile para gestão simplificada de estoque de matéria-prima de uma pequena fábrica de cookies, utilizando inteligência artificial para facilitar a entrada e saída de produtos através de processamento de imagem (notas fiscais) e áudio (comandos de voz).

## 🚀 Tecnologias

- **React Native** 0.82.1 (nativo, sem Expo)
- **TypeScript**
- **MMKV** - Armazenamento local rápido e eficiente
- **Gluestack UI** - Componentes de UI modernos
- **OpenAI API** - Processamento de imagem (OCR) e áudio (Whisper)
- **React Native Splash Screen** - Splash screen personalizada

## 📋 Pré-requisitos

- Node.js >= 20
- pnpm (gerenciador de pacotes)
- Android Studio (para desenvolvimento Android)
- JDK 17 ou superior

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd FlashCookie
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` na raiz do projeto
   - Adicione sua chave da API OpenAI:
   ```
   OPENAI_API_KEY=sua_chave_aqui
   ```

4. Para Android:
```bash
pnpm android
```

## 📱 Estrutura do Projeto

```
FlashCookie/
├── android/              # Código nativo Android
├── ios/                  # Código nativo iOS
├── src/
│   ├── components/       # Componentes reutilizáveis
│   ├── screens/          # Telas do aplicativo
│   ├── services/         # Serviços (OpenAI, etc.)
│   ├── storage/          # Configuração MMKV
│   ├── types/            # Definições TypeScript
│   └── utils/            # Funções utilitárias
└── App.tsx               # Componente principal
```

## 🎨 Recursos Implementados

- ✅ Splash Screen personalizada com logo FlashCookie
- ✅ Ícone do aplicativo configurado
- ✅ Configuração básica de MMKV para armazenamento
- ✅ Integração com OpenAI API (OCR e Whisper)
- ✅ Estrutura de pastas seguindo boas práticas
- ✅ TypeScript configurado

## 📝 Próximos Passos

- [ ] Implementar autenticação de usuários
- [ ] Tela de cadastro e login
- [ ] Funcionalidade de leitura de nota fiscal
- [ ] Funcionalidade de comando de voz
- [ ] Gestão de estoque
- [ ] Visualização de capacidade produtiva

## 🔐 Segurança

⚠️ **IMPORTANTE**: Por segurança, não exponha sua chave da API OpenAI diretamente no código do app. Em produção, considere usar um backend intermediário para fazer as chamadas à API.

## 📄 Licença

Este projeto é parte de um projeto acadêmico integrador.

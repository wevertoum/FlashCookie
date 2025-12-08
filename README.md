# FlashCookie

> Repositório: [https://github.com/wevertoum/FlashCookie.git](https://github.com/wevertoum/FlashCookie.git)

## 📋 Sobre o Projeto

O **FlashCookie** é um aplicativo mobile desenvolvido para gestão simplificada de estoque de matéria-prima de uma pequena fábrica de cookies. A solução utiliza inteligência artificial para facilitar a entrada e saída de produtos através de processamento de imagem (leitura de notas fiscais) e áudio (comandos de voz).

O aplicativo foi desenvolvido como parte de um projeto acadêmico integrador, focando na simplicidade de uso e na redução de barreiras tecnológicas para funcionários com diferentes níveis de familiaridade com sistemas de gestão.

### Objetivos Principais

- **Simplificar a gestão de estoque** através de interfaces intuitivas
- **Automatizar processos manuais** utilizando IA para processamento de notas fiscais e comandos de voz
- **Facilitar a visualização de capacidade produtiva** baseada em receitas cadastradas e estoque disponível
- **Reduzir erros humanos** através de validações automáticas e confirmações

## 📚 Documentação do Projeto

Para informações detalhadas sobre o projeto, consulte os documentos na pasta `docs/`:

- **[Documento de Clarificação do Problema](./docs/documento_clarificacao_problema.md)** - Mapa de empatia e análise do problema a ser resolvido
- **[Requisitos Funcionais MVP](./docs/requisitos_funcionais_mvp.md)** - Especificação completa dos requisitos funcionais e não funcionais

## 🚀 Tecnologias Utilizadas

- **React Native** 0.82.1
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

## 🛠️ Instalação e Execução

### 1. Clone o repositório

```bash
git clone https://github.com/wevertoum/FlashCookie.git
cd FlashCookie
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto e adicione sua chave da API OpenAI:

```
OPENAI_API_KEY=sua_chave_aqui
```

### 4. Execute no Android

```bash
pnpm android
```

## 📱 Estrutura do Projeto

```
FlashCookie/
├── android/              # Código nativo Android
├── ios/                  # Código nativo iOS
├── docs/                 # Documentação do projeto
├── src/
│   ├── components/       # Componentes reutilizáveis
│   ├── screens/          # Telas do aplicativo
│   ├── services/         # Serviços (OpenAI, etc.)
│   ├── repositories/     # Repositórios de dados (MMKV)
│   ├── storage/          # Configuração MMKV
│   ├── types/            # Definições TypeScript
│   ├── utils/            # Funções utilitárias
│   └── navigation/       # Configuração de navegação
└── App.tsx               # Componente principal
```

## 🎯 Funcionalidades Principais

### Autenticação

- Cadastro e login de usuários
- Controle de sessão persistente

### Entrada de Estoque

- Captura de nota fiscal via câmera
- Processamento de imagem com IA para extração automática de itens
- Validação e edição manual dos dados extraídos
- Busca inteligente por aproximação de nomes
- Conversão automática de unidades de medida
- Entrada manual como fallback

### Saída de Estoque

- Captura de comando de voz
- Processamento de áudio com IA (Whisper + GPT)
- Validação de estoque disponível
- Confirmação individual de itens
- Conversão automática de unidades
- Saída manual como fallback

### Gestão de Estoque

- Visualização de todos os itens cadastrados
- Quantidades e unidades de medida
- Exclusão de itens

### Receitas e Capacidade Produtiva

- Cadastro de receitas com ingredientes do estoque
- Seleção múltipla de receitas para análise
- Cálculo de potencial produtivo utilizando IA
- Visualização de quantidades possíveis de produção

## 🔐 Segurança

⚠️ **IMPORTANTE**: Por segurança, não exponha sua chave da API OpenAI diretamente no código do app. Em produção, considere usar um backend intermediário para fazer as chamadas à API.

## 📸 Capturas de Tela

### Tela de Login

**Descrição**: Tela inicial de autenticação do aplicativo. Permite que o usuário faça login com email e senha cadastrados, ou navegue para a tela de cadastro.

**Elementos principais**:

- Campo de email
- Campo de senha
- Botão "Entrar"
- Link para "Criar conta"

---

### Tela de Cadastro

**Descrição**: Tela para criação de nova conta de usuário. Solicita email, senha e confirmação de senha para cadastro.

**Elementos principais**:

- Campo de email
- Campo de senha
- Campo de confirmação de senha
- Botão "Cadastrar"
- Link para voltar ao login

---

### Tela Home

**Descrição**: Tela principal do aplicativo após login. Apresenta menu de navegação com acesso a todas as funcionalidades principais.

**Elementos principais**:

- Cabeçalho com logo/nome FlashCookie
- Mensagem de boas-vindas com email do usuário
- Botão "Entrada de Estoque"
- Botão "Ver Estoque"
- Botão "Saída de Estoque"
- Botão "Itens Possíveis"
- Botão "Sair"

---

### Tela de Entrada de Estoque

**Descrição**: Tela para adicionar itens ao estoque através da leitura de nota fiscal. Permite capturar foto da nota fiscal e processar automaticamente com IA, ou inserir itens manualmente.

**Elementos principais**:

- Botão "Capturar Nota Fiscal" / "Selecionar da Galeria"
- Preview da imagem capturada
- Lista de itens extraídos (editáveis)
- Campos editáveis: nome, quantidade, unidade
- Botão "Confirmar" para processar itens
- Botão "Cancelar"
- Opção de entrada manual

---

### Tela de Saída de Estoque

**Descrição**: Tela para remover itens do estoque através de comando de voz ou entrada manual. Processa o áudio com IA para extrair itens e quantidades mencionados.

**Elementos principais**:

- Botão "Falar o que vai usar" (gravação de áudio)
- Indicador visual de gravação
- Lista de itens identificados no áudio
- Informações de cada item: nome, quantidade a remover, estoque atual, estoque após remoção
- Botões de confirmação individual ou "Confirmar todos"
- Opção de entrada manual

---

### Tela de Estoque

**Descrição**: Tela de visualização completa do estoque atual. Lista todos os itens cadastrados com suas quantidades e unidades de medida.

**Elementos principais**:

- Lista de itens do estoque
- Para cada item: nome, quantidade, unidade de medida
- Opção de excluir itens
- Botão de atualizar/recarregar lista
- Botão "Voltar" para Home

---

### Tela de Itens Possíveis (Receitas)

**Descrição**: Tela para gerenciar receitas e visualizar capacidade produtiva. Permite cadastrar receitas, selecionar receitas para análise e visualizar quantidades possíveis de produção calculadas pela IA.

**Elementos principais**:

- Lista de receitas cadastradas com checkboxes para seleção
- Botão "Cadastrar Nova Receita"
- Botão "Gerar Relatório de Potencial Produtivo"
- Resultados do potencial produtivo (se disponível)
- Para cada receita: opções de visualizar detalhes, editar ou excluir
- Modal de detalhes da receita com lista de ingredientes

---

### Modal de Detalhes da Receita

**Descrição**: Modal que exibe informações detalhadas de uma receita selecionada, incluindo ingredientes, quantidades necessárias e potencial produtivo.

**Elementos principais**:

- Nome da receita
- Rendimento (quantas unidades produz)
- Lista de ingredientes com quantidades necessárias
- Potencial produtivo atual (se calculado)
- Botão "Fechar"

---

## 📄 Licença

Este projeto é parte de um projeto acadêmico integrador.

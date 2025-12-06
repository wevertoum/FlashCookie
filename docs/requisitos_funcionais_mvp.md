# Requisitos Funcionais - MVP FlashCookie

## 1. Visão Geral do Projeto

### 1.1 Objetivo

Desenvolver o aplicativo mobile MVP **FlashCookie** para gestão simplificada de estoque de matéria-prima de uma pequena fábrica de cookies, utilizando inteligência artificial para facilitar a entrada e saída de produtos através de processamento de imagem (notas fiscais) e áudio (comandos de voz).

### 1.2 Escopo do MVP

Este MVP foca exclusivamente na gestão de **estoque de matéria-prima**, com funcionalidades básicas de:

- Autenticação simples
- Entrada de estoque via leitura de nota fiscal
- Saída de estoque via comando de voz
- Visualização de capacidade produtiva baseada em receitas cadastradas

### 1.3 Tecnologias Base

- **Banco de Dados**: MMKV (banco não relacional local)
- **UI Framework**: Gluestack UI
- **IA/ML**: OpenAI API (para processamento de imagem e áudio)
- **Plataforma**: React Native (mobile)

---

## 2. Requisitos de Autenticação

### 2.1 Cadastro de Usuário

**RF-001: Tela de Cadastro**

- **Descrição**: Tela inicial para cadastro de novo usuário
- **Campos obrigatórios**:
  - Email (validação de formato)
  - Senha (mínimo de caracteres a definir)
  - Confirmação de senha
- **Comportamento**:
  - Validação de email válido
  - Validação de senha e confirmação de senha iguais
  - Salvar dados no MMKV na tabela `users`
  - Após cadastro bem-sucedido, redirecionar para tela de login

**RF-002: Armazenamento de Usuários**

- **Estrutura de dados no MMKV**:
  ```json
  {
    "users": [
      {
        "id": "uuid",
        "email": "usuario@email.com",
        "password": "hash_senha",
        "createdAt": "timestamp"
      }
    ]
  }
  ```
- **Observação**: Para MVP, senha pode ser armazenada em texto simples ou hash simples (não é foco de segurança neste MVP)

### 2.2 Login de Usuário

**RF-003: Tela de Login**

- **Descrição**: Tela para autenticação do usuário
- **Campos obrigatórios**:
  - Email
  - Senha
- **Comportamento**:
  - Buscar usuário no MMKV por email
  - Validar senha
  - Se válido: redirecionar para tela Home
  - Se inválido: exibir mensagem de erro
- **Validações**:
  - Email e senha obrigatórios
  - Verificar se usuário existe no banco

**RF-004: Controle de Sessão**

- **Descrição**: Manter usuário logado durante o uso do app
- **Comportamento**:
  - Após login bem-sucedido, salvar `currentUser` no MMKV
  - Verificar `currentUser` ao abrir o app
  - Se existir, redirecionar para Home
  - Se não existir, redirecionar para Login

**RF-005: Logout**

- **Descrição**: Opção de sair da aplicação
- **Comportamento**:
  - Remover `currentUser` do MMKV
  - Redirecionar para tela de Login

---

## 3. Tela Home

### 3.1 Estrutura da Tela

**RF-006: Tela Home**

- **Descrição**: Tela principal após login, com navegação para as funcionalidades principais
- **Componentes**:
  - Cabeçalho com nome do app FlashCookie/logo
  - Botão "Entrada de Estoque" → navega para Tela de Input
  - Botão "Saída de Estoque" → navega para Tela de Output
  - Botão "Itens Possíveis" → navega para Tela de Itens Possíveis
  - Botão "Logout" (opcional, pode estar em menu)
- **Layout**: Simples e intuitivo, com botões grandes e fáceis de tocar

---

## 4. Tela de Input (Entrada de Estoque)

### 4.1 Funcionalidade Principal

**RF-007: Leitura de Nota Fiscal**

- **Descrição**: Capturar imagem da nota fiscal usando a câmera do dispositivo
- **Comportamento**:
  - Exibir botão "Capturar Nota Fiscal"
  - Abrir câmera do dispositivo
  - Permitir captura da foto
  - Exibir preview da foto capturada
  - Opções: "Usar esta foto" ou "Tirar novamente"
  - Após confirmar, enviar imagem para processamento

**RF-008: Processamento de Imagem com OpenAI**

- **Descrição**: Enviar imagem da nota fiscal para API da OpenAI para extração de dados
- **Comportamento**:
  - Enviar imagem para OpenAI API (Vision API)
  - Prompt para API: "Extraia todos os itens desta nota fiscal de supermercado. Para cada item, retorne: nome do produto, quantidade e unidade de medida. Retorne em formato JSON estruturado: [{\"nome\": \"...\", \"quantidade\": ..., \"unidade\": \"...\"}]"
  - Receber resposta estruturada da API
  - Exibir loading durante processamento

**RF-009: Validação e Confirmação de Dados Extraídos**

- **Descrição**: Validar dados extraídos e permitir edição manual
- **Comportamento**:
  - Exibir lista de itens extraídos em formato editável
  - Para cada item, mostrar:
    - Campo editável: Nome do produto
    - Campo editável: Quantidade
    - Campo editável: Unidade de medida (dropdown: kg, g, L, mL, un, dúzia)
  - Botão "Confirmar" para processar todos os itens
  - Botão "Cancelar" para descartar

**RF-010: Processamento de Cada Item**

- **Descrição**: Para cada item extraído, verificar se já existe no estoque
- **Comportamento**:
  - Buscar no estoque por aproximação de nome (busca fuzzy)
  - Se encontrar item similar:
    - Exibir: "Encontramos um item similar: [Nome do item no estoque]. É o mesmo produto?"
    - Opções: "Sim, é o mesmo" ou "Não, é diferente"
    - Se "Sim": usar o item existente e somar quantidade
    - Se "Não": criar novo item
  - Se não encontrar item similar:
    - Exibir: "Item não encontrado no estoque. Deseja criar este novo item?"
    - Opções: "Sim, criar" ou "Cancelar"
    - Se "Sim": criar novo item no estoque

**RF-011: Conversão de Unidades**

- **Descrição**: Converter unidades automaticamente para padronização
- **Regras de conversão**:
  - Massa: 1 kg = 1000 g
  - Volume: 1 L = 1000 mL
  - Unidade: manter como está (un, dúzia, etc.)
- **Comportamento**:
  - Se item no estoque está em "kg" e entrada está em "g", converter entrada para "kg"
  - Se item no estoque está em "g" e entrada está em "kg", converter entrada para "g"
  - Mesma lógica para L/mL
  - Sempre manter a unidade do item existente no estoque como padrão
  - Se for novo item, usar a unidade informada

**RF-012: Atualização de Estoque**

- **Descrição**: Adicionar itens ao estoque após confirmação
- **Estrutura de dados no MMKV**:
  ```json
  {
    "estoque": [
      {
        "id": "uuid",
        "nome": "Farinha",
        "quantidade": 10.5,
        "unidade": "kg",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    ]
  }
  ```
- **Comportamento**:
  - Se item existe: somar quantidade à quantidade existente
  - Se item é novo: criar novo registro no estoque
  - Exibir mensagem de sucesso: "Estoque atualizado com sucesso!"
  - Redirecionar para Home após sucesso

**RF-013: Tratamento de Erros - API OpenAI**

- **Descrição**: Lidar com falhas na extração de dados
- **Cenários**:
  - API não consegue extrair dados da imagem
  - API retorna erro
  - Imagem muito escura/ilegível
- **Comportamento**:
  - Exibir mensagem: "Não foi possível extrair os dados automaticamente. Deseja inserir manualmente?"
  - Opções: "Inserir manualmente" ou "Tentar novamente"
  - Se "Inserir manualmente": exibir formulário para cadastro manual
  - Se "Tentar novamente": voltar para captura de foto

**RF-014: Entrada Manual de Itens**

- **Descrição**: Permitir cadastro manual quando automação falha
- **Campos**:
  - Nome do produto (texto livre)
  - Quantidade (numérico)
  - Unidade de medida (dropdown: kg, g, L, mL, un, dúzia)
- **Comportamento**:
  - Validar campos obrigatórios
  - Aplicar mesma lógica de busca por aproximação (RF-010)
  - Aplicar conversão de unidades (RF-011)
  - Atualizar estoque (RF-012)

---

## 5. Tela de Output (Saída de Estoque)

### 5.1 Funcionalidade Principal

**RF-015: Captura de Áudio**

- **Descrição**: Capturar comando de voz do usuário
- **Comportamento**:
  - Exibir botão "Falar o que vai usar"
  - Iniciar gravação de áudio
  - Exibir indicador visual de gravação (ex: "Gravando...")
  - Botão "Parar gravação"
  - Botão "Cancelar" para descartar

**RF-016: Processamento de Áudio com OpenAI**

- **Descrição**: Enviar áudio para API da OpenAI para extração de dados estruturados
- **Comportamento**:
  - Converter áudio para texto usando Whisper API da OpenAI
  - Enviar texto para GPT com prompt: "Extraia os itens e quantidades mencionados neste texto sobre uso de ingredientes. Retorne em formato JSON: [{\"nome\": \"...\", \"quantidade\": ..., \"unidade\": \"...\"}]. Exemplo: 'vou usar 2kg de farinha e 500g de açúcar' deve retornar dois itens."
  - Receber resposta estruturada
  - Exibir loading durante processamento

**RF-017: Processamento de Múltiplos Itens**

- **Descrição**: Processar cada item mencionado no áudio separadamente
- **Comportamento**:
  - Se áudio menciona múltiplos itens, processar cada um individualmente
  - Para cada item:
    - Buscar no estoque por aproximação de nome
    - Validar se item existe
    - Validar quantidade disponível
    - Exibir confirmação individual

**RF-018: Validação de Estoque Disponível**

- **Descrição**: Verificar se há quantidade suficiente no estoque
- **Comportamento**:
  - Buscar item no estoque por aproximação
  - Se não encontrar: exibir "Item '[nome]' não encontrado no estoque"
  - Se encontrar: verificar quantidade disponível
  - Se quantidade solicitada > quantidade disponível:
    - Exibir: "Você tem apenas [X] [unidade] de [nome] em estoque. Isso vai zerar o estoque. Deseja continuar?"
    - Opções: "Sim, zerar estoque" ou "Cancelar"
  - Se quantidade solicitada <= quantidade disponível:
    - Exibir: "Confirmar remoção de [quantidade] [unidade] de [nome]?"
    - Opções: "Confirmar" ou "Cancelar"

**RF-019: Conversão de Unidades na Saída**

- **Descrição**: Converter unidades automaticamente na remoção
- **Comportamento**:
  - Mesmas regras de conversão da RF-011
  - Se usuário fala "500 gramas" mas estoque está em "kg", converter para 0.5 kg
  - Validar após conversão

**RF-020: Confirmação Individual de Itens**

- **Descrição**: Pedir confirmação para cada item antes de remover
- **Comportamento**:
  - Exibir lista de itens a serem removidos
  - Para cada item, mostrar:
    - Nome do produto
    - Quantidade a remover
    - Quantidade atual no estoque
    - Quantidade que ficará após remoção
  - Botão "Confirmar todos" ou confirmar individualmente
  - Botão "Cancelar" para descartar tudo

**RF-021: Remoção do Estoque**

- **Descrição**: Remover quantidade do estoque após confirmação
- **Comportamento**:
  - Para cada item confirmado:
    - Buscar item no estoque
    - Subtrair quantidade removida da quantidade atual
    - Se resultado < 0: zerar (quantidade = 0)
    - Atualizar `updatedAt` no registro
  - Exibir mensagem de sucesso: "Estoque atualizado!"
  - Redirecionar para Home

**RF-022: Tratamento de Erros - Áudio**

- **Descrição**: Lidar com falhas no processamento de áudio
- **Cenários**:
  - Áudio não foi entendido pela API
  - API retorna erro
  - Áudio muito curto ou sem conteúdo
- **Comportamento**:
  - Exibir mensagem: "Não foi possível entender o áudio. Deseja gravar novamente ou inserir manualmente?"
  - Opções: "Gravar novamente", "Inserir manualmente" ou "Cancelar"
  - Se "Inserir manualmente": exibir formulário de saída manual

**RF-023: Saída Manual de Itens**

- **Descrição**: Permitir remoção manual quando automação falha
- **Campos**:
  - Nome do produto (com busca/autocomplete no estoque)
  - Quantidade (numérico)
  - Unidade de medida (dropdown, pré-preenchido com unidade do item selecionado)
- **Comportamento**:
  - Buscar itens no estoque enquanto usuário digita (autocomplete)
  - Ao selecionar item, pré-preencher unidade de medida
  - Aplicar validações (RF-018)
  - Aplicar conversão de unidades (RF-019)
  - Processar remoção (RF-021)

---

## 6. Tela de Itens Possíveis (Receitas)

### 6.1 Cadastro de Receitas

**RF-024: Tela de Cadastro de Receita**

- **Descrição**: Formulário para cadastrar nova receita
- **Campos obrigatórios**:
  - Nome da receita (texto livre)
  - Rendimento (numérico) - quantas unidades produz esta receita
  - Lista de ingredientes:
    - Seleção de ingrediente (dropdown/lista de seleção com busca - **obrigatório selecionar item existente do estoque**)
    - Quantidade necessária (numérico)
    - Unidade de medida (campo somente leitura, pré-preenchido automaticamente com a unidade do item selecionado do estoque)
    - Botão "Adicionar ingrediente"
- **Comportamento**:
  - Exibir lista de todos os itens cadastrados no estoque para seleção
  - Permitir busca/filtro na lista de itens do estoque
  - Ao selecionar um item do estoque:
    - Pré-preencher automaticamente a unidade de medida com a unidade do item selecionado
    - Bloquear edição da unidade de medida (sempre usa a unidade do item do estoque)
  - Permitir adicionar múltiplos ingredientes
  - Permitir remover ingrediente da lista
  - Validar campos obrigatórios antes de salvar
  - Validar que pelo menos um ingrediente foi adicionado
  - Botão "Salvar receita"
  - Botão "Cancelar"
- **Observação**: Cada ingrediente deve referenciar obrigatoriamente um item existente no estoque. Não é permitido cadastrar ingredientes que não existam no estoque.

**RF-025: Validação de Ingredientes na Receita**

- **Descrição**: Validar seleção de ingredientes do estoque
- **Comportamento**:
  - Validar que o ingrediente selecionado existe no estoque
  - Se estoque estiver vazio: exibir mensagem "Não há itens cadastrados no estoque. Cadastre itens primeiro na tela de Entrada de Estoque."
  - Validar que quantidade necessária é um número positivo
  - Validar que não há ingredientes duplicados na mesma receita (mesmo item do estoque)
  - Se tentar adicionar ingrediente duplicado: exibir "Este ingrediente já foi adicionado à receita"

**RF-026: Armazenamento de Receitas**

- **Descrição**: Salvar receitas no MMKV
- **Estrutura de dados**:
  ```json
  {
    "receitas": [
      {
        "id": "uuid",
        "nome": "Cookie de Chocolate",
        "rendimento": 12,
        "ingredientes": [
          {
            "itemEstoqueId": "uuid_item_estoque",
            "nome": "Farinha",
            "quantidade": 0.5,
            "unidade": "kg"
          },
          {
            "itemEstoqueId": "uuid_item_estoque",
            "nome": "Açúcar",
            "quantidade": 0.2,
            "unidade": "kg"
          }
        ],
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    ]
  }
  ```
- **Comportamento**:
  - Armazenar `itemEstoqueId` como referência ao item do estoque
  - Armazenar `nome` e `unidade` para facilitar exibição (valores são copiados do estoque no momento da criação/edição da receita)
  - Ao salvar receita, validar que todos os `itemEstoqueId` referenciam itens existentes no estoque
  - **Observação sobre itens excluídos**: Se um item do estoque for excluído posteriormente, a receita manterá a referência. Para obter uma lista atualizada das possibilidades de produção, o usuário deve gerar um novo relatório (RF-030/RF-031), que enviará os dados atuais do estoque para a IA fazer o cálculo. A IA considerará apenas os itens que existem no estoque atual, e receitas com ingredientes excluídos serão identificadas como não produzíveis pela IA.

**RF-027: Edição de Receitas**

- **Descrição**: Permitir editar receitas existentes
- **Comportamento**:
  - Na listagem, opção "Editar" para cada receita
  - Abrir formulário pré-preenchido com dados da receita
  - Para cada ingrediente:
    - Exibir item do estoque selecionado (dropdown pré-selecionado)
    - Permitir alterar seleção do item do estoque (sempre deve ser um item existente)
    - Exibir quantidade necessária (editável)
    - Exibir unidade de medida (somente leitura, atualizada automaticamente ao selecionar novo item)
  - Permitir adicionar novos ingredientes (selecionando itens do estoque)
  - Permitir remover ingredientes
  - Validar que não há ingredientes duplicados
  - Validar que todos os itens referenciados existem no estoque
  - Salvar alterações (atualizar `itemEstoqueId` se item foi alterado)

**RF-028: Exclusão de Receitas**

- **Descrição**: Permitir excluir receitas
- **Comportamento**:
  - Na listagem, opção "Excluir" para cada receita
  - Confirmar exclusão: "Tem certeza que deseja excluir esta receita?"
  - Se confirmado: remover do MMKV

### 6.2 Visualização de Capacidade Produtiva com IA

**RF-029: Seleção de Receitas para Análise**

- **Descrição**: Permitir ao usuário selecionar receitas desejadas para análise de potencial produtivo
- **Comportamento**:
  - Ao abrir a tela:
    - Buscar todas as receitas cadastradas
    - Restaurar seleção anterior salva (se existir)
    - **Validar receitas restauradas**: Verificar que todas as receitas da seleção salva ainda existem no banco de dados
    - Se alguma receita da seleção foi excluída: remover automaticamente o ID da receita excluída da seleção salva
    - Se todas as receitas da seleção foram excluídas: limpar seleção automaticamente
    - Atualizar seleção salva após validação
  - Exibir lista de todas as receitas cadastradas
  - Para cada receita, exibir checkbox ou botão de seleção (marcar as que estão na seleção restaurada)
  - Permitir seleção múltipla de receitas
  - Exibir contador de receitas selecionadas
  - Botão "Limpar seleção" para desmarcar todas
  - Botão "Gerar Relatório de Potencial Produtivo" (habilitado apenas se houver pelo menos uma receita selecionada)
  - Salvar lista de receitas selecionadas sempre que houver alteração (persistência local)

**RF-030: Geração de Relatório do Estoque**

- **Descrição**: Gerar relatório estruturado do estoque atual para envio à API
- **Comportamento**:
  - Ao clicar em "Gerar Relatório de Potencial Produtivo":
    - Buscar todos os itens do estoque atual
    - Formatar relatório estruturado com: nome do item, quantidade disponível e unidade de medida
    - Para cada receita selecionada:
      - Buscar receita completa com seus ingredientes (que já estão vinculados ao estoque via `itemEstoqueId` desde a criação da receita)
      - Para cada ingrediente da receita:
        - Buscar item correspondente no estoque atual usando `itemEstoqueId`
        - Obter quantidade disponível atual do estoque para aquele ingrediente
        - Preparar dados: nome da receita, rendimento e lista de ingredientes com:
          - Nome do ingrediente
          - Quantidade necessária na receita (conforme cadastrado)
          - Unidade de medida do ingrediente (conforme cadastrado, que corresponde à unidade do item no estoque)
          - Quantidade disponível atual no estoque (obtida do estoque atual)
    - Preparar dados das receitas selecionadas com: nome da receita, rendimento e lista de ingredientes (nome, quantidade necessária, unidade, quantidade disponível no estoque)
  - Exibir loading durante preparação dos dados
  - **Observação**: Os ingredientes já estão vinculados aos itens do estoque no momento da criação da receita (RF-024). Este processo apenas busca as quantidades atuais disponíveis no estoque para cada ingrediente vinculado.

**RF-031: Envio para API OpenAI**

- **Descrição**: Enviar receitas selecionadas e relatório do estoque para API da OpenAI
- **Comportamento**:
  - Montar prompt estruturado para API:
    - "Considere essas receitas que quero fazer: [lista de receitas com ingredientes e quantidades necessárias]"
    - "E isso que tenho no estoque: [relatório do estoque com itens, quantidades e unidades]"
    - "Me fale quanto eu posso produzir de cada uma delas baseado no estoque disponível."
    - "Retorne em formato JSON estruturado: {\"potencialProdutivo\": [{\"receita\": \"nome da receita\", \"quantidadePossivel\": X, \"unidade\": \"unidades\"}]}"
  - Enviar para OpenAI API (GPT)
  - Exibir loading durante processamento
  - Tratar erros de conexão ou resposta inválida

**RF-032: Processamento e Exibição da Resposta da IA**

- **Descrição**: Processar resposta estruturada da API e exibir potencial produtivo
- **Comportamento**:
  - Receber resposta JSON da API
  - Validar formato da resposta
  - **Validar completude da resposta**:
    - Verificar que todas as receitas enviadas foram retornadas na resposta da API
    - Se alguma receita não foi retornada: exibir mensagem "Não foi possível calcular o potencial produtivo para [nome da receita]"
    - Se a API retornar receitas que não foram enviadas: ignorar essas receitas extras
  - Exibir resultado estruturado:
    - Para cada receita analisada:
      - Nome da receita
      - "Potencial produtivo: X itens de [nome da receita]"
  - Se receita não pode ser produzida: exibir "Não é possível produzir [nome da receita] (falta ingrediente)"
  - Ordenar resultados por quantidade possível (maior para menor)
  - Salvar output da IA na tela (persistência local)

**RF-033: Persistência de Seleção e Output**

- **Descrição**: Armazenar lista de receitas selecionadas e output da IA na tela
- **Estrutura de dados no MMKV**:
  ```json
  {
    "itensPossiveis": {
      "receitasSelecionadas": ["id_receita_1", "id_receita_2"],
      "outputIA": {
        "timestamp": "timestamp",
        "resultado": [
          {
            "receita": "Cookie de Chocolate",
            "quantidadePossivel": 40,
            "unidade": "unidades"
          }
        ]
      }
    }
  }
  ```
- **Comportamento**:
  - Salvar lista de receitas selecionadas sempre que houver alteração
  - Salvar output da IA após receber resposta da API
  - Ao abrir a tela, restaurar seleção anterior e último output (se existir) - **validação de receitas excluídas é feita no RF-029**
  - Exibir último resultado salvo mesmo após fechar e reabrir o app
  - Botão "Limpar histórico" para remover seleção e output salvos

**RF-034: Exibição de Detalhes da Receita**

- **Descrição**: Mostrar detalhes da receita ao tocar/clicar
- **Informações a exibir**:
  - Nome da receita
  - Lista de ingredientes com quantidades necessárias
  - Rendimento (quantas unidades produz)
  - Potencial produtivo atual (se disponível no output da IA)
  - Lista de ingredientes faltantes (se não pode produzir, baseado no output da IA)

---

## 7. Regras de Negócio Gerais

### 7.1 Unidades de Medida

**RB-001: Unidades Suportadas**

- **Massa**: kg (quilograma), g (grama)
- **Volume**: L (litro), mL (mililitro)
- **Unidade**: un (unidade), dúzia

**RB-002: Conversão Automática**

- **Massa**:
  - 1 kg = 1000 g
  - Conversão automática sempre que necessário
- **Volume**:
  - 1 L = 1000 mL
  - Conversão automática sempre que necessário
- **Unidade**: Sem conversão, manter como está

**RB-003: Padronização de Unidade**

- Quando item já existe no estoque, sempre usar a unidade do item existente
- Converter entrada para unidade do item existente
- Se item é novo, usar unidade informada pelo usuário

### 7.2 Busca por Aproximação

**RB-004: Algoritmo de Busca Fuzzy**

- Buscar itens no estoque por similaridade de nome
- Considerar variações comuns:
  - Maiúsculas/minúsculas (ex: "Farinha" = "farinha")
  - Acentos (ex: "Açúcar" = "Acucar")
  - Plural/singular (ex: "Cookie" = "Cookies")
- Se similaridade > 70%: considerar como match
- Exibir item mais similar encontrado para confirmação do usuário

### 7.3 Validações de Quantidade

**RB-005: Validação de Entrada**

- Quantidade deve ser número positivo
- Quantidade pode ser decimal (ex: 2.5 kg)
- Validar formato antes de salvar

**RB-006: Validação de Saída**

- Não permitir remoção de quantidade negativa
- Se quantidade removida > quantidade disponível:
  - Avisar usuário
  - Permitir zerar estoque com confirmação
- Após remoção, quantidade não pode ficar negativa (zerar se necessário)

### 7.4 Gestão de Estoque

**RB-007: Atualização de Estoque**

- Sempre atualizar campo `updatedAt` ao modificar quantidade
- Manter histórico de última modificação
- Não permitir quantidade negativa no estoque

**RB-008: Identificação de Itens**

- Cada item no estoque tem ID único (UUID)
- Busca por nome é case-insensitive
- Nomes devem ser normalizados (trim, lowercase para busca)

---

## 8. Estrutura de Dados (MMKV)

### 8.1 Schema Completo

```json
{
  "users": [
    {
      "id": "uuid",
      "email": "string",
      "password": "string",
      "createdAt": "timestamp"
    }
  ],
  "currentUser": {
    "id": "uuid",
    "email": "string"
  },
  "estoque": [
    {
      "id": "uuid",
      "nome": "string",
      "quantidade": "number",
      "unidade": "string (kg|g|L|mL|un|dúzia)",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ],
  "receitas": [
    {
      "id": "uuid",
      "nome": "string",
      "rendimento": "number",
      "ingredientes": [
        {
          "itemEstoqueId": "uuid",
          "nome": "string",
          "quantidade": "number",
          "unidade": "string"
        }
      ],
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ],
  "itensPossiveis": {
    "receitasSelecionadas": ["uuid_receita_1", "uuid_receita_2"],
    "outputIA": {
      "timestamp": "timestamp",
      "resultado": [
        {
          "receita": "string",
          "quantidadePossivel": "number",
          "unidade": "string"
        }
      ]
    }
  }
}
```

### 8.2 Chaves MMKV

- `users`: Array de usuários cadastrados
- `currentUser`: Usuário logado atualmente
- `estoque`: Array de itens no estoque
- `receitas`: Array de receitas cadastradas
- `itensPossiveis`: Objeto contendo receitas selecionadas e output da IA para análise de potencial produtivo

---

## 9. Fluxos Principais

### 9.1 Fluxo de Entrada de Estoque

1. Usuário acessa Tela de Input
2. Clica em "Capturar Nota Fiscal"
3. Tira foto da nota fiscal
4. Confirma foto
5. Sistema envia imagem para OpenAI API
6. API retorna itens extraídos
7. Sistema exibe itens para validação/edição
8. Usuário confirma ou edita itens
9. Para cada item:
   - Sistema busca no estoque por aproximação
   - Se encontrado: pergunta se é o mesmo produto
   - Se não encontrado: pergunta se deseja criar
   - Converte unidades se necessário
   - Adiciona ao estoque (soma se existir, cria se novo)
10. Exibe mensagem de sucesso
11. Redireciona para Home

### 9.2 Fluxo de Saída de Estoque

1. Usuário acessa Tela de Output
2. Clica em "Falar o que vai usar"
3. Grava áudio
4. Para gravação
5. Sistema envia áudio para OpenAI API (Whisper + GPT)
6. API retorna itens e quantidades estruturados
7. Para cada item:
   - Sistema busca no estoque por aproximação
   - Valida quantidade disponível
   - Converte unidades se necessário
   - Exibe confirmação individual
8. Usuário confirma cada item
9. Sistema remove quantidades do estoque
10. Exibe mensagem de sucesso
11. Redireciona para Home

### 9.3 Fluxo de Visualização de Capacidade Produtiva

1. Usuário acessa Tela de Itens Possíveis
2. Sistema busca todas as receitas cadastradas e exibe lista
3. Sistema restaura seleção anterior e último output da IA (se existir)
4. Usuário seleciona receitas desejadas (múltipla seleção)
5. Sistema salva lista de receitas selecionadas
6. Usuário clica em "Gerar Relatório de Potencial Produtivo"
7. Sistema gera relatório estruturado do estoque atual
8. Sistema prepara dados das receitas selecionadas (nome, ingredientes, quantidades)
9. Sistema envia para OpenAI API com prompt estruturado:
   - Receitas selecionadas com ingredientes
   - Relatório do estoque atual
   - Solicitação de cálculo de potencial produtivo
10. OpenAI API retorna resposta estruturada em JSON
11. Sistema processa resposta e exibe:
    - Para cada receita: "Potencial produtivo: X itens de [nome da receita]"
    - Ordenado por quantidade possível (maior para menor)
12. Sistema salva output da IA na tela
13. Usuário pode:
    - Ver detalhes da receita
    - Cadastrar nova receita
    - Editar receita existente
    - Excluir receita
    - Limpar seleção e output salvos

### 9.4 Fluxo de Cadastro de Receita

1. Usuário acessa Tela de Itens Possíveis
2. Clica em "Cadastrar Nova Receita"
3. Preenche nome da receita
4. Preenche rendimento
5. Adiciona ingredientes:
   - Seleciona item do estoque (dropdown/lista com busca - obrigatório selecionar item existente)
   - Sistema pré-preenche automaticamente a unidade de medida do item selecionado (campo somente leitura)
   - Informa quantidade necessária
   - Sistema valida que não há ingrediente duplicado
6. Adiciona mais ingredientes conforme necessário (cada um deve ser um item diferente do estoque)
7. Sistema valida que pelo menos um ingrediente foi adicionado
8. Salva receita (armazena referência ao item do estoque via `itemEstoqueId`)
9. Receita aparece na listagem
10. Usuário pode selecionar a nova receita para análise de potencial produtivo

---

## 10. Tratamento de Erros e Casos Especiais

### 10.1 Erros de API OpenAI

**CE-001: Falha na Extração de Imagem**

- **Cenário**: API não consegue extrair dados da nota fiscal
- **Ação**: Oferecer entrada manual (RF-014)

**CE-002: Falha no Processamento de Áudio**

- **Cenário**: API não consegue entender o áudio
- **Ação**: Oferecer gravar novamente ou entrada manual (RF-022)

**CE-003: Erro de Conexão com API**

- **Cenário**: Sem conexão com internet ou API indisponível
- **Ação**: Exibir mensagem "Erro de conexão. Verifique sua internet e tente novamente."

**CE-004: Resposta Inválida da API**

- **Cenário**: API retorna formato não esperado
- **Ação**: Oferecer entrada manual como fallback

**CE-005: Falha no Cálculo de Potencial Produtivo**

- **Cenário**: API não consegue calcular potencial produtivo ou retorna resposta inválida
- **Ação**: Exibir mensagem "Não foi possível calcular o potencial produtivo. Verifique se há receitas selecionadas e estoque disponível. Tente novamente."

### 10.2 Erros de Validação

**CE-006: Item Não Encontrado**

- **Cenário**: Item mencionado não existe no estoque
- **Ação**: Perguntar se deseja criar novo item

**CE-007: Quantidade Insuficiente**

- **Cenário**: Tentativa de remover mais do que tem em estoque
- **Ação**: Avisar e permitir zerar com confirmação (RF-018)

**CE-008: Dados Inválidos**

- **Cenário**: Campos obrigatórios não preenchidos ou formato inválido
- **Ação**: Exibir mensagem de erro específica e destacar campos com problema

### 10.3 Casos de Uso Especiais

**CE-009: Múltiplos Itens no Áudio**

- **Cenário**: Usuário menciona vários itens em um único áudio
- **Ação**: Processar cada item separadamente (RF-017)

**CE-010: Item com Nome Similar**

- **Cenário**: Item mencionado tem nome muito similar a outro no estoque
- **Ação**: Buscar por aproximação e pedir confirmação (RF-010)

**CE-011: Receita sem Ingredientes Disponíveis**

- **Cenário**: Receita não pode ser produzida por falta de ingredientes (identificado pela IA)
- **Ação**: Exibir "Não é possível produzir" no output da IA e listar ingredientes faltantes

---

## 11. Requisitos Não Funcionais

### 11.1 Performance

**RNF-001: Tempo de Resposta**

- Processamento de imagem: máximo 10 segundos
- Processamento de áudio: máximo 5 segundos
- Operações locais (busca, salvamento): máximo 1 segundo

**RNF-002: Armazenamento**

- Banco MMKV local deve suportar até 1000 itens no estoque
- Banco MMKV local deve suportar até 100 receitas

### 11.2 Usabilidade

**RNF-003: Interface**

- Botões devem ter tamanho mínimo de 44x44 pixels (acessibilidade)
- Textos devem ter tamanho mínimo de 14px
- Cores devem ter contraste adequado (WCAG AA)

**RNF-004: Feedback Visual**

- Sempre exibir loading durante processamentos
- Sempre exibir mensagens de sucesso/erro
- Confirmar ações importantes antes de executar

### 11.3 Segurança

**RNF-005: API Key**

- API Key da OpenAI deve ser configurável (não hardcoded)
- API Key deve ser armazenada de forma segura (não em texto plano no código)

**RNF-006: Dados Locais**

- Dados sensíveis (senhas) devem ser tratados adequadamente
- Para MVP, pode ser texto simples, mas documentar que não é produção-ready

### 11.4 Compatibilidade

**RNF-007: Plataforma**

- React Native para iOS e Android
- Versão mínima: iOS 12+ / Android 8+

**RNF-008: Permissões**

- Câmera: necessário para captura de nota fiscal
- Microfone: necessário para gravação de áudio
- Armazenamento: necessário para MMKV

---

## 12. Definições e Glossário

### 12.1 Termos Técnicos

- **MMKV**: Banco de dados não relacional local para React Native
- **Gluestack UI**: Biblioteca de componentes UI para React Native
- **OpenAI API**: API de inteligência artificial para processamento de imagem e áudio
- **Vision API**: API da OpenAI para processamento de imagens
- **Whisper API**: API da OpenAI para transcrição de áudio
- **GPT**: Modelo de linguagem da OpenAI para processamento de texto

### 12.2 Termos de Negócio

- **Estoque**: Conjunto de matéria-prima disponível para produção
- **Receita**: Lista de ingredientes e quantidades necessárias para produzir um produto
- **Rendimento**: Quantidade de unidades que uma receita produz
- **Ingrediente limitante**: Ingrediente que limita a quantidade possível de produção
- **Capacidade produtiva**: Quantidade máxima de unidades que podem ser produzidas com o estoque atual

---

## 13. Limitações do MVP

### 13.1 Funcionalidades Não Incluídas

- Gestão de estoque de produtos acabados (cookies)
- Histórico de movimentações
- Alertas de estoque baixo
- Relatórios detalhados
- Múltiplos usuários com permissões diferentes
- Sincronização em nuvem
- Backup automático
- Validação de validade de produtos
- Gestão de fornecedores
- Integração com sistemas externos

### 13.2 Simplificações

- Busca por aproximação simples (não considera variações complexas)
- Conversão de unidades básica (apenas kg↔g e L↔mL)
- Autenticação simples (sem hash de senha robusto)
- Sem validação de email único (pode ter emails duplicados)
- Sem recuperação de senha
- Sem edição de itens do estoque (apenas entrada/saída)
- **Unidade de medida do estoque é imutável**: Uma vez cadastrado um item no estoque com uma unidade de medida, essa unidade não pode ser alterada. Isso garante consistência com as receitas que referenciam esses itens. Se necessário alterar a unidade, o item deve ser excluído e recriado.

// Tipos principais do aplicativo

/**
 * Unit of measurement enum
 * RB-001: Supported units
 */
export enum Unit {
  KG = 'kg',
  G = 'g',
  L = 'L',
  ML = 'mL',
  UN = 'un',
  DUZIA = 'duzia',
}

export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface StockItem {
  id: string;
  nome: string;
  quantidade: number;
  unidade: Unit;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedInvoiceItem {
  nome: string;
  quantidade: number;
  unidade: Unit;
}

/**
 * RF-026: Recipe interface
 * Structure matches requirements document
 */
export interface Recipe {
  id: string;
  nome: string;
  rendimento: number; // Quantidade de unidades produzidas
  ingredientes: RecipeIngredient[];
  createdAt: string;
  updatedAt: string;
}

/**
 * RF-026: Recipe ingredient interface
 * Each ingredient references a stock item via itemEstoqueId
 */
export interface RecipeIngredient {
  itemEstoqueId: string; // Reference to stock item
  nome: string; // Copied from stock item for display
  quantidade: number;
  unidade: Unit; // Must match stock item unit
}

/**
 * RF-032, RF-033: Production potential result from AI
 */
export interface ProductionPotentialResult {
  receita: string;
  quantidadePossivel: number;
  unidade: Unit;
  alertas?: Array<{
    tipo: 'ingrediente_faltando' | 'ingrediente_insuficiente';
    ingrediente: string;
    quantidadeNecessaria: number;
    unidadeNecessaria: Unit;
    quantidadeDisponivel: number;
    unidadeDisponivel: Unit;
    mensagem: string;
  }>;
}

/**
 * RF-033: Possible items output structure
 */
export interface PossibleItemsOutput {
  timestamp: string;
  resultado: ProductionPotentialResult[];
}

/**
 * RF-033: Possible items storage structure
 */
export interface PossibleItemsStorage {
  receitasSelecionadas: string[]; // Array of recipe IDs
  outputIA?: PossibleItemsOutput;
}

export interface StockEntry {
  id: string;
  stockItemId: string;
  quantity: number;
  type: 'entry' | 'exit';
  source?: 'invoice' | 'voice' | 'manual';
  date: string;
  notes?: string;
}

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
  password: string; // Em produção, usar hash
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

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  yield: number; // Quantidade de cookies produzidos
  createdAt: string;
}

export interface RecipeIngredient {
  stockItemId: string;
  quantity: number;
  unit: Unit;
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


// Tipos principais do aplicativo

export interface User {
  id: string;
  email: string;
  password: string; // Em produção, usar hash
  createdAt: string;
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string; // kg, g, L, ml, etc.
  minQuantity?: number;
  lastUpdated: string;
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
  unit: string;
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


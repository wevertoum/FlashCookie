/**
 * Recipe Repository
 * Manages recipes in MMKV
 * Implements RF-024, RF-026, RF-027, RF-028
 */

import { StorageKeys, storageHelpers } from '../storage/mmkv';
import { getAllStockItems } from './stockRepository';
import type { Recipe, RecipeIngredient } from '../types';

/**
 * Generate simple UUID (for MVP)
 */
function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all recipes
 * RF-029: Get all recipes for selection
 */
export function getAllRecipes(): Recipe[] {
  const recipes = storageHelpers.get<Recipe[]>(StorageKeys.RECIPES);
  return recipes || [];
}

/**
 * Get recipe by ID
 */
export function getRecipeById(id: string): Recipe | undefined {
  const recipes = getAllRecipes();
  return recipes.find(recipe => recipe.id === id);
}

/**
 * Get recipes by IDs
 * RF-029: Get selected recipes
 */
export function getRecipesByIds(ids: string[]): Recipe[] {
  const recipes = getAllRecipes();
  return recipes.filter(recipe => ids.includes(recipe.id));
}

/**
 * Validate recipe ingredients
 * RF-025: Validate that all ingredients reference existing stock items
 */
export function validateRecipeIngredients(
  ingredients: RecipeIngredient[],
): { valid: boolean; message?: string } {
  const stockItems = getAllStockItems();

  if (stockItems.length === 0) {
    return {
      valid: false,
      message:
        'Não há itens cadastrados no estoque. Cadastre itens primeiro na tela de Entrada de Estoque.',
    };
  }

  // Check if all itemEstoqueId references exist
  for (const ingredient of ingredients) {
    const stockItem = stockItems.find(
      item => item.id === ingredient.itemEstoqueId,
    );
    if (!stockItem) {
      return {
        valid: false,
        message: `Item do estoque não encontrado: ${ingredient.nome}`,
      };
    }
  }

  // Check for duplicate ingredients (same itemEstoqueId)
  const itemIds = ingredients.map(ing => ing.itemEstoqueId);
  const uniqueItemIds = new Set(itemIds);
  if (itemIds.length !== uniqueItemIds.size) {
    return {
      valid: false,
      message: 'Não é permitido adicionar o mesmo ingrediente duas vezes na receita.',
    };
  }

  return { valid: true };
}

/**
 * Create new recipe
 * RF-024, RF-026: Create recipe with ingredients from stock
 */
export function createRecipe(
  nome: string,
  rendimento: number,
  ingredientes: RecipeIngredient[],
): Recipe {
  // RF-025: Validate ingredients
  const validation = validateRecipeIngredients(ingredientes);
  if (!validation.valid) {
    throw new Error(validation.message || 'Ingredientes inválidos');
  }

  // RF-025: Validate at least one ingredient
  if (ingredientes.length === 0) {
    throw new Error('Adicione pelo menos um ingrediente à receita');
  }

  // Validate rendimento is positive
  if (rendimento <= 0) {
    throw new Error('O rendimento deve ser um número positivo');
  }

  const recipes = getAllRecipes();

  const newRecipe: Recipe = {
    id: generateUUID(),
    nome: nome.trim(),
    rendimento,
    ingredientes: ingredientes.map(ing => ({
      ...ing,
      nome: ing.nome.trim(),
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  recipes.push(newRecipe);
  storageHelpers.set(StorageKeys.RECIPES, recipes);

  return newRecipe;
}

/**
 * Update recipe
 * RF-027: Update existing recipe
 */
export function updateRecipe(recipe: Recipe): Recipe {
  // RF-025: Validate ingredients
  const validation = validateRecipeIngredients(recipe.ingredientes);
  if (!validation.valid) {
    throw new Error(validation.message || 'Ingredientes inválidos');
  }

  // RF-025: Validate at least one ingredient
  if (recipe.ingredientes.length === 0) {
    throw new Error('Adicione pelo menos um ingrediente à receita');
  }

  // Validate rendimento is positive
  if (recipe.rendimento <= 0) {
    throw new Error('O rendimento deve ser um número positivo');
  }

  const recipes = getAllRecipes();
  const recipeIndex = recipes.findIndex(r => r.id === recipe.id);

  if (recipeIndex === -1) {
    throw new Error('Receita não encontrada');
  }

  recipes[recipeIndex] = {
    ...recipe,
    nome: recipe.nome.trim(),
    ingredientes: recipe.ingredientes.map(ing => ({
      ...ing,
      nome: ing.nome.trim(),
    })),
    updatedAt: new Date().toISOString(),
  };

  storageHelpers.set(StorageKeys.RECIPES, recipes);

  return recipes[recipeIndex];
}

/**
 * Delete recipe
 * RF-028: Delete recipe
 */
export function deleteRecipe(recipeId: string): void {
  const recipes = getAllRecipes();
  const filteredRecipes = recipes.filter(recipe => recipe.id !== recipeId);
  storageHelpers.set(StorageKeys.RECIPES, filteredRecipes);
}

/**
 * Recipe Repository object for backward compatibility
 */
export const RecipeRepository = {
  getAllRecipes,
  getRecipeById,
  getRecipesByIds,
  validateRecipeIngredients,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};


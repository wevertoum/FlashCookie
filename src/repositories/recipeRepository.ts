/**
 * Recipe Repository
 * Manages recipes in MMKV
 * Implements RF-024, RF-026, RF-027, RF-028
 */

import { StorageKeys, storageHelpers } from '../storage/mmkv';
import type { Recipe, RecipeIngredient } from '../types';
import { getAllStockItems } from './stockRepository';

function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getAllRecipes(): Recipe[] {
  const recipes = storageHelpers.get<Recipe[]>(StorageKeys.RECIPES);
  return recipes || [];
}

export function getRecipeById(id: string): Recipe | undefined {
  const recipes = getAllRecipes();
  return recipes.find(recipe => recipe.id === id);
}

/**
 * RF-029: Get selected recipes
 */
export function getRecipesByIds(ids: string[]): Recipe[] {
  const recipes = getAllRecipes();
  return recipes.filter(recipe => ids.includes(recipe.id));
}

/**
 * RF-025: Validate that all ingredients reference existing stock items
 */
export function validateRecipeIngredients(ingredients: RecipeIngredient[]): {
  valid: boolean;
  message?: string;
} {
  const stockItems = getAllStockItems();

  if (stockItems.length === 0) {
    return {
      valid: false,
      message:
        'Não há itens cadastrados no estoque. Cadastre itens primeiro na tela de Entrada de Estoque.',
    };
  }

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

  const itemIds = ingredients.map(ing => ing.itemEstoqueId);
  const uniqueItemIds = new Set(itemIds);
  if (itemIds.length !== uniqueItemIds.size) {
    return {
      valid: false,
      message:
        'Não é permitido adicionar o mesmo ingrediente duas vezes na receita.',
    };
  }

  return { valid: true };
}

/**
 * RF-024, RF-026: Create recipe with ingredients from stock
 */
export function createRecipe(
  nome: string,
  rendimento: number,
  ingredientes: RecipeIngredient[],
): Recipe {
  const validation = validateRecipeIngredients(ingredientes);
  if (!validation.valid) {
    throw new Error(validation.message || 'Ingredientes inválidos');
  }

  if (ingredientes.length === 0) {
    throw new Error('Adicione pelo menos um ingrediente à receita');
  }

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
 * RF-027: Update existing recipe
 */
export function updateRecipe(recipe: Recipe): Recipe {
  const validation = validateRecipeIngredients(recipe.ingredientes);
  if (!validation.valid) {
    throw new Error(validation.message || 'Ingredientes inválidos');
  }

  if (recipe.ingredientes.length === 0) {
    throw new Error('Adicione pelo menos um ingrediente à receita');
  }

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
 * RF-028: Delete recipe
 */
export function deleteRecipe(recipeId: string): void {
  const recipes = getAllRecipes();
  const filteredRecipes = recipes.filter(recipe => recipe.id !== recipeId);
  storageHelpers.set(StorageKeys.RECIPES, filteredRecipes);
}

export const RecipeRepository = {
  getAllRecipes,
  getRecipeById,
  getRecipesByIds,
  validateRecipeIngredients,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};

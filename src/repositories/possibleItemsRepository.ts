/**
 * Possible Items Repository
 * Manages recipe selection and AI output for production potential
 * Implements RF-029, RF-033
 */

import { StorageKeys, storageHelpers } from '../storage/mmkv';
import { getAllRecipes } from './recipeRepository';
import type { PossibleItemsStorage, PossibleItemsOutput } from '../types';

/**
 * Get selected recipes and AI output
 * RF-033: Get stored selection and output
 */
export function getPossibleItemsData(): PossibleItemsStorage {
  const data = storageHelpers.get<PossibleItemsStorage>(
    StorageKeys.POSSIBLE_ITEMS,
  );
  return (
    data || {
      receitasSelecionadas: [],
      outputIA: undefined,
    }
  );
}

/**
 * Get selected recipe IDs
 */
export function getSelectedRecipeIds(): string[] {
  const data = getPossibleItemsData();
  return data.receitasSelecionadas || [];
}

/**
 * Get AI output
 */
export function getAIOutput(): PossibleItemsOutput | undefined {
  const data = getPossibleItemsData();
  return data.outputIA;
}

/**
 * Set selected recipe IDs
 * RF-029, RF-033: Save selected recipes
 */
export function setSelectedRecipeIds(recipeIds: string[]): void {
  const currentData = getPossibleItemsData();
  const updatedData: PossibleItemsStorage = {
    ...currentData,
    receitasSelecionadas: recipeIds,
  };
  storageHelpers.set(StorageKeys.POSSIBLE_ITEMS, updatedData);
}

/**
 * Save AI output
 * RF-032, RF-033: Save AI output after processing
 */
export function saveAIOutput(output: PossibleItemsOutput): void {
  const currentData = getPossibleItemsData();
  const updatedData: PossibleItemsStorage = {
    ...currentData,
    outputIA: output,
  };
  storageHelpers.set(StorageKeys.POSSIBLE_ITEMS, updatedData);
}

/**
 * Validate and clean selected recipes
 * RF-029: Remove deleted recipes from selection
 */
export function validateSelectedRecipes(): string[] {
  const selectedIds = getSelectedRecipeIds();
  const allRecipes = getAllRecipes();
  const existingRecipeIds = allRecipes.map(r => r.id);

  // Filter out deleted recipes
  const validIds = selectedIds.filter(id => existingRecipeIds.includes(id));

  // If selection changed, update storage
  if (validIds.length !== selectedIds.length) {
    setSelectedRecipeIds(validIds);
  }

  return validIds;
}

/**
 * Clear selection and output
 * RF-033: Clear history button
 */
export function clearPossibleItemsData(): void {
  storageHelpers.set(StorageKeys.POSSIBLE_ITEMS, {
    receitasSelecionadas: [],
    outputIA: undefined,
  });
}

/**
 * Possible Items Repository object
 */
export const PossibleItemsRepository = {
  getPossibleItemsData,
  getSelectedRecipeIds,
  getAIOutput,
  setSelectedRecipeIds,
  saveAIOutput,
  validateSelectedRecipes,
  clearPossibleItemsData,
};


/**
 * Possible Items Repository
 * Manages recipe selection and AI output for production potential
 * Implements RF-029, RF-033
 */

import { StorageKeys, storageHelpers } from '../storage/mmkv';
import type { PossibleItemsOutput, PossibleItemsStorage } from '../types';
import { getAllRecipes } from './recipeRepository';

/**
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

export function getSelectedRecipeIds(): string[] {
  const data = getPossibleItemsData();
  return data.receitasSelecionadas || [];
}

export function getAIOutput(): PossibleItemsOutput | undefined {
  const data = getPossibleItemsData();
  return data.outputIA;
}

/**
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
 * RF-029: Remove deleted recipes from selection
 */
export function validateSelectedRecipes(): string[] {
  const selectedIds = getSelectedRecipeIds();
  const allRecipes = getAllRecipes();
  const existingRecipeIds = allRecipes.map(r => r.id);

  const validIds = selectedIds.filter(id => existingRecipeIds.includes(id));

  if (validIds.length !== selectedIds.length) {
    setSelectedRecipeIds(validIds);
  }

  return validIds;
}

/**
 * RF-033: Clear history button
 */
export function clearPossibleItemsData(): void {
  storageHelpers.set(StorageKeys.POSSIBLE_ITEMS, {
    receitasSelecionadas: [],
    outputIA: undefined,
  });
}

export const PossibleItemsRepository = {
  getPossibleItemsData,
  getSelectedRecipeIds,
  getAIOutput,
  setSelectedRecipeIds,
  saveAIOutput,
  validateSelectedRecipes,
  clearPossibleItemsData,
};

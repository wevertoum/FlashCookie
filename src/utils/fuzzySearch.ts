/**
 * Fuzzy search utilities
 * RF-010, RF-018: Search items by name similarity
 * RB-004: Fuzzy search algorithm
 */

import type { StockItem } from '../types';

/**
 * Normalize string for comparison
 * Remove accents, convert to lowercase, trim
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim();
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 and 1 (1 = identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) {
    return 1;
  }

  if (s1.length === 0 || s2.length === 0) {
    return 0;
  }

  // Levenshtein distance
  const matrix: number[][] = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  
  return 1 - distance / maxLength;
}

/**
 * Find similar items in stock
 * RB-004: Fuzzy search algorithm
 * Returns items with similarity > 70%
 */
export function findSimilarItems(
  searchName: string,
  stockItems: StockItem[],
  threshold: number = 0.7,
): Array<{ item: StockItem; similarity: number }> {
  const results: Array<{ item: StockItem; similarity: number }> = [];

  for (const item of stockItems) {
    const similarity = calculateSimilarity(searchName, item.nome);
    
    if (similarity >= threshold) {
      results.push({ item, similarity });
    }
  }

  // Sort by similarity (highest first)
  results.sort((a, b) => b.similarity - a.similarity);

  return results;
}

/**
 * Find the most similar item
 * Returns the best match if similarity > threshold, otherwise null
 */
export function findBestMatch(
  searchName: string,
  stockItems: StockItem[],
  threshold: number = 0.7,
): StockItem | null {
  const matches = findSimilarItems(searchName, stockItems, threshold);
  return matches.length > 0 ? matches[0].item : null;
}


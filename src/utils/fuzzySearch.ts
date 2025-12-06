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
 * Split string into words, filtering out common words
 */
function getKeywords(str: string): string[] {
  const normalized = normalizeString(str);
  const stopWords = ['de', 'da', 'do', 'em', 'a', 'o', 'e', 'para', 'com', 'um', 'uma'];
  return normalized
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
}

/**
 * Calculate keyword-based similarity
 * Checks if keywords from search term appear in the item name
 */
function calculateKeywordSimilarity(searchName: string, itemName: string): number {
  const searchKeywords = getKeywords(searchName);
  const itemKeywords = getKeywords(itemName);
  
  if (searchKeywords.length === 0) {
    return 0;
  }
  
  let matchedKeywords = 0;
  for (const searchKeyword of searchKeywords) {
    const found = itemKeywords.some(itemKeyword => 
      itemKeyword.includes(searchKeyword) || searchKeyword.includes(itemKeyword)
    );
    if (found) {
      matchedKeywords++;
    }
  }
  
  const keywordScore = matchedKeywords / searchKeywords.length;
  const normalizedSearch = normalizeString(searchName);
  const normalizedItem = normalizeString(itemName);
  const containsBonus = normalizedItem.includes(normalizedSearch) || 
                        normalizedSearch.includes(normalizedItem) ? 0.3 : 0;
  
  return Math.min(1, keywordScore * 0.7 + containsBonus);
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

  if (s1.includes(s2) || s2.includes(s1)) {
    const minLength = Math.min(s1.length, s2.length);
    const maxLength = Math.max(s1.length, s2.length);
    return Math.max(0.7, minLength / maxLength);
  }

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
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  
  const levenshteinScore = maxLength === 0 ? 1 : 1 - distance / maxLength;
  const keywordScore = calculateKeywordSimilarity(str1, str2);
  
  return Math.max(levenshteinScore, keywordScore, (levenshteinScore + keywordScore) / 2);
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
  const allComparisons: Array<{ item: string; similarity: number }> = [];

  for (const item of stockItems) {
    const similarity = calculateSimilarity(searchName, item.nome);
    allComparisons.push({ item: item.nome, similarity });
    
    if (similarity >= threshold) {
      results.push({ item, similarity });
    }
  }

  allComparisons.sort((a, b) => b.similarity - a.similarity);
  console.log('📊 [FUZZY SEARCH] Top 5 comparações:');
  allComparisons.slice(0, 5).forEach((comp, index) => {
    const passed = comp.similarity >= threshold;
    const icon = passed ? '✅' : '❌';
    console.log(`  ${icon} ${index + 1}. "${comp.item}" - ${(comp.similarity * 100).toFixed(2)}% (threshold: ${(threshold * 100).toFixed(2)}%)`);
  });

  results.sort((a, b) => b.similarity - a.similarity);

  return results;
}

/**
 * Calculate match quality score considering keyword coverage and specificity
 */
function calculateMatchQuality(
  searchName: string,
  itemName: string,
  baseSimilarity: number,
): number {
  const searchKeywords = getKeywords(searchName);
  const itemKeywords = getKeywords(itemName);
  
  // Count how many search keywords match item keywords
  let matchedKeywords = 0;
  for (const searchKeyword of searchKeywords) {
    if (itemKeywords.some(itemKeyword => 
      itemKeyword.includes(searchKeyword) || searchKeyword.includes(itemKeyword)
    )) {
      matchedKeywords++;
    }
  }
  
  // Keyword coverage score (0-1)
  const keywordCoverage = searchKeywords.length > 0 
    ? matchedKeywords / searchKeywords.length 
    : 0;
  
  // Prefer matches with more keywords matched
  // Prefer matches that contain the full search term
  const normalizedSearch = normalizeString(searchName);
  const normalizedItem = normalizeString(itemName);
  const fullMatchBonus = normalizedItem.includes(normalizedSearch) ? 0.15 : 0;
  
  // Prefer longer matches when similarity is equal (more specific)
  const lengthBonus = normalizedItem.length >= normalizedSearch.length ? 0.05 : 0;
  
  // Weighted combination: base similarity (70%) + keyword coverage (20%) + bonuses (10%)
  return baseSimilarity * 0.7 + keywordCoverage * 0.2 + fullMatchBonus + lengthBonus;
}

/**
 * Find the most similar item
 * Returns the best match if similarity > threshold, otherwise null
 * Prefers matches with better keyword coverage and specificity
 */
export function findBestMatch(
  searchName: string,
  stockItems: StockItem[],
  threshold: number = 0.7,
): StockItem | null {
  console.log('🔍 [FUZZY SEARCH] Buscando item:', searchName);
  console.log('🔍 [FUZZY SEARCH] Palavras-chave extraídas:', getKeywords(searchName));
  console.log('🔍 [FUZZY SEARCH] Threshold:', threshold);
  console.log('🔍 [FUZZY SEARCH] Itens no estoque:', stockItems.map(i => i.nome));
  
  // First get all matches above threshold
  const matches = findSimilarItems(searchName, stockItems, threshold);
  
  if (matches.length === 0) {
    console.log('❌ [FUZZY SEARCH] Nenhum match encontrado acima do threshold');
    return null;
  }
  
  // Calculate quality score for each match and sort
  const matchesWithQuality = matches.map(match => ({
    ...match,
    quality: calculateMatchQuality(searchName, match.item.nome, match.similarity),
  }));
  
  // Sort by quality (best first), then by similarity as tiebreaker
  matchesWithQuality.sort((a, b) => {
    if (Math.abs(a.quality - b.quality) < 0.01) {
      // If quality is very close, use similarity
      return b.similarity - a.similarity;
    }
    return b.quality - a.quality;
  });
  
  console.log('🔍 [FUZZY SEARCH] Matches encontrados:', matches.length);
  matchesWithQuality.forEach((match, index) => {
    console.log(`  ${index + 1}. "${match.item.nome}" - Similaridade: ${(match.similarity * 100).toFixed(2)}% - Qualidade: ${(match.quality * 100).toFixed(2)}%`);
  });
  
  const result = matchesWithQuality[0].item;
  console.log('✅ [FUZZY SEARCH] Melhor match:', result.nome);
  
  return result;
}


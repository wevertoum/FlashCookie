/**
 * Stock Repository
 * Manages stock items in MMKV
 * Implements RF-012, RF-021
 */

import { StorageKeys, storageHelpers } from '../storage/mmkv';
import type { StockItem, Unit } from '../types';

/**
 * Generate simple UUID (for MVP)
 */
function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all stock items
 */
export function getAllStockItems(): StockItem[] {
  const items = storageHelpers.get<StockItem[]>(StorageKeys.STOCK);
  return items || [];
}

/**
 * Get stock item by ID
 */
export function getStockItemById(id: string): StockItem | undefined {
  const items = getAllStockItems();
  return items.find(item => item.id === id);
}

/**
 * Create new stock item
 * RF-012: Create new item in stock
 */
export function createStockItem(
  nome: string,
  quantidade: number,
  unidade: Unit,
): StockItem {
  const items = getAllStockItems();

  const newItem: StockItem = {
    id: generateUUID(),
    nome: nome.trim(),
    quantidade,
    unidade,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  items.push(newItem);
  storageHelpers.set(StorageKeys.STOCK, items);

  return newItem;
}

/**
 * Update stock item quantity
 * RF-012: Add quantity to existing item
 */
export function updateStockItemQuantity(
  itemId: string,
  quantityToAdd: number,
): StockItem {
  const items = getAllStockItems();
  const itemIndex = items.findIndex(item => item.id === itemId);

  if (itemIndex === -1) {
    throw new Error('Stock item not found');
  }

  items[itemIndex].quantidade += quantityToAdd;

  // Ensure quantity is not negative
  if (items[itemIndex].quantidade < 0) {
    items[itemIndex].quantidade = 0;
  }

  items[itemIndex].updatedAt = new Date().toISOString();
  storageHelpers.set(StorageKeys.STOCK, items);

  return items[itemIndex];
}

/**
 * Remove quantity from stock item
 * RF-021: Remove quantity from stock
 */
export function removeStockItemQuantity(
  itemId: string,
  quantityToRemove: number,
): StockItem {
  const items = getAllStockItems();
  const itemIndex = items.findIndex(item => item.id === itemId);

  if (itemIndex === -1) {
    throw new Error('Stock item not found');
  }

  items[itemIndex].quantidade -= quantityToRemove;

  // Ensure quantity is not negative (zero if needed)
  if (items[itemIndex].quantidade < 0) {
    items[itemIndex].quantidade = 0;
  }

  items[itemIndex].updatedAt = new Date().toISOString();
  storageHelpers.set(StorageKeys.STOCK, items);

  return items[itemIndex];
}

/**
 * Update stock item
 */
export function updateStockItem(item: StockItem): StockItem {
  const items = getAllStockItems();
  const itemIndex = items.findIndex(i => i.id === item.id);

  if (itemIndex === -1) {
    throw new Error('Stock item not found');
  }

  items[itemIndex] = {
    ...item,
    updatedAt: new Date().toISOString(),
  };

  storageHelpers.set(StorageKeys.STOCK, items);

  return items[itemIndex];
}

/**
 * Delete stock item
 */
export function deleteStockItem(itemId: string): void {
  const items = getAllStockItems();
  const filteredItems = items.filter(item => item.id !== itemId);
  storageHelpers.set(StorageKeys.STOCK, filteredItems);
}

/**
 * Stock Repository object for backward compatibility
 */
export const StockRepository = {
  getAllStockItems,
  getStockItemById,
  createStockItem,
  updateStockItemQuantity,
  removeStockItemQuantity,
  updateStockItem,
  deleteStockItem,
};

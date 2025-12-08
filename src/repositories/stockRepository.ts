/**
 * Stock Repository
 * Manages stock items in MMKV
 * Implements RF-012, RF-021
 */

import { StorageKeys, storageHelpers } from '../storage/mmkv';
import type { StockItem, Unit } from '../types';

function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getAllStockItems(): StockItem[] {
  const items = storageHelpers.get<StockItem[]>(StorageKeys.STOCK);
  return items || [];
}

export function getStockItemById(id: string): StockItem | undefined {
  const items = getAllStockItems();
  return items.find(item => item.id === id);
}

/**
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

  if (items[itemIndex].quantidade < 0) {
    items[itemIndex].quantidade = 0;
  }

  items[itemIndex].updatedAt = new Date().toISOString();
  storageHelpers.set(StorageKeys.STOCK, items);

  return items[itemIndex];
}

/**
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

  if (items[itemIndex].quantidade < 0) {
    items[itemIndex].quantidade = 0;
  }

  items[itemIndex].updatedAt = new Date().toISOString();
  storageHelpers.set(StorageKeys.STOCK, items);

  return items[itemIndex];
}

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

export function deleteStockItem(itemId: string): void {
  const items = getAllStockItems();
  const filteredItems = items.filter(item => item.id !== itemId);
  storageHelpers.set(StorageKeys.STOCK, filteredItems);
}

export const StockRepository = {
  getAllStockItems,
  getStockItemById,
  createStockItem,
  updateStockItemQuantity,
  removeStockItemQuantity,
  updateStockItem,
  deleteStockItem,
};

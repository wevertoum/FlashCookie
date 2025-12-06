import { createMMKV } from 'react-native-mmkv';

// Single MMKV instance for the app
export const storage = createMMKV({
  id: 'flashcookie-storage',
  encryptionKey: 'flashcookie-encryption-key',
});

// Storage data keys
export const StorageKeys = {
  USERS: 'users',
  CURRENT_USER: 'currentUser',
  STOCK: 'stock',
  RECIPES: 'recipes',
  POSSIBLE_ITEMS: 'possibleItems',
  SETTINGS: 'settings',
} as const;

// Helper functions to work with storage
export const storageHelpers = {
  // Save data
  set: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },

  // Get data
  get: <T>(key: string): T | undefined => {
    const value = storage.getString(key);
    return value ? JSON.parse(value) : undefined;
  },

  // Remove data
  remove: (key: string): void => {
    storage.remove(key);
  },

  // Check if exists
  contains: (key: string): boolean => {
    return storage.contains(key);
  },

  // Clear all
  clear: (): void => {
    storage.clearAll();
  },
};

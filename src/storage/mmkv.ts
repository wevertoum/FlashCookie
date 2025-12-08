import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'flashcookie-storage',
  encryptionKey: 'flashcookie-encryption-key',
});

export const StorageKeys = {
  USERS: 'users',
  CURRENT_USER: 'currentUser',
  STOCK: 'stock',
  RECIPES: 'recipes',
  POSSIBLE_ITEMS: 'possibleItems',
  SETTINGS: 'settings',
} as const;

export const storageHelpers = {
  set: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },

  get: <T>(key: string): T | undefined => {
    const value = storage.getString(key);
    return value ? JSON.parse(value) : undefined;
  },

  remove: (key: string): void => {
    storage.remove(key);
  },

  contains: (key: string): boolean => {
    return storage.contains(key);
  },

  clear: (): void => {
    storage.clearAll();
  },
};

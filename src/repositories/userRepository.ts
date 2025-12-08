import { StorageKeys, storageHelpers } from '../storage/mmkv';
import type { User } from '../types';

function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getAllUsers(): User[] {
  const users = storageHelpers.get<User[]>(StorageKeys.USERS);
  return users || [];
}

/**
 * RF-003: Search user in MMKV by email
 */
export function getUserByEmail(email: string): User | undefined {
  const users = getAllUsers();
  return users.find(
    user => user.email.toLowerCase().trim() === email.toLowerCase().trim(),
  );
}

/**
 * RF-001, RF-002: Save data in MMKV users table
 */
export function createUser(email: string, password: string): User {
  const users = getAllUsers();

  const newUser: User = {
    id: generateUUID(),
    email: email.trim().toLowerCase(),
    password: password,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  storageHelpers.set(StorageKeys.USERS, users);

  return newUser;
}

/**
 * RF-003: Validate password
 */
export function validateCredentials(
  email: string,
  password: string,
): User | null {
  const user = getUserByEmail(email);

  if (!user) {
    return null;
  }

  if (user.password !== password) {
    return null;
  }

  return user;
}

/**
 * RF-004: Save currentUser in MMKV after successful login
 */
export function setCurrentUser(user: User): void {
  const currentUser = {
    id: user.id,
    email: user.email,
  };
  storageHelpers.set(StorageKeys.CURRENT_USER, currentUser);
}

/**
 * RF-004: Check currentUser when opening the app
 */
export function getCurrentUser(): { id: string; email: string } | undefined {
  return storageHelpers.get<{ id: string; email: string }>(
    StorageKeys.CURRENT_USER,
  );
}

/**
 * RF-005: Remove currentUser from MMKV
 */
export function clearCurrentUser(): void {
  storageHelpers.remove(StorageKeys.CURRENT_USER);
}

/**
 * Repository to manage users in MMKV
 * Implements RF-002, RF-003, RF-004, RF-005
 */
export const UserRepository = {
  getAllUsers,
  getUserByEmail,
  createUser,
  validateCredentials,
  setCurrentUser,
  getCurrentUser,
  clearCurrentUser,
};

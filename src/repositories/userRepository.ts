import { StorageKeys, storageHelpers } from '../storage/mmkv';
import type { User } from '../types';

/**
 * Generate simple UUID (for MVP)
 */
function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all registered users
 */
export function getAllUsers(): User[] {
  const users = storageHelpers.get<User[]>(StorageKeys.USERS);
  return users || [];
}

/**
 * Get user by email
 * RF-003: Search user in MMKV by email
 */
export function getUserByEmail(email: string): User | undefined {
  const users = getAllUsers();
  return users.find(
    user => user.email.toLowerCase().trim() === email.toLowerCase().trim(),
  );
}

/**
 * Create new user
 * RF-001, RF-002: Save data in MMKV users table
 */
export function createUser(email: string, password: string): User {
  const users = getAllUsers();

  const newUser: User = {
    id: generateUUID(),
    email: email.trim().toLowerCase(),
    password: password, // MVP: plain text (RF-002)
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  storageHelpers.set(StorageKeys.USERS, users);

  return newUser;
}

/**
 * Validate login credentials
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

  // MVP: simple password comparison (RF-002)
  if (user.password !== password) {
    return null;
  }

  return user;
}

/**
 * Save current user (session)
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
 * Get current user (session)
 * RF-004: Check currentUser when opening the app
 */
export function getCurrentUser(): { id: string; email: string } | undefined {
  return storageHelpers.get<{ id: string; email: string }>(
    StorageKeys.CURRENT_USER,
  );
}

/**
 * Remove current user (logout)
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

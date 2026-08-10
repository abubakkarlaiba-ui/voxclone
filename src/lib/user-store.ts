import type { User } from "@/types/user";

/**
 * In-memory user store using globalThis for Vercel serverless persistence.
 *
 * globalThis persists across warm invocations of the same serverless function.
 * On cold starts, data is lost — in production, replace with a real database.
 */
const g = globalThis as typeof globalThis & { __voxcloneUsers?: User[] };
if (!g.__voxcloneUsers) g.__voxcloneUsers = [];
const users = g.__voxcloneUsers;

export function getUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function addUser(user: User): void {
  users.push(user);
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const user = getUserById(id);
  if (!user) return null;
  Object.assign(user, updates);
  return user;
}

export function deleteUser(id: string): boolean {
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
}

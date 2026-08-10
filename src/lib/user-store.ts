import type { User } from "@/types/user";

const g = globalThis as typeof globalThis & { __vxUsers?: User[] };
if (!g.__vxUsers) g.__vxUsers = [];
const users = g.__vxUsers;

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

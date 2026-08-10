import type { User } from "@/types/user";
import { dbQuery, ensureSchema } from "./db";

export async function getUserByEmail(email: string): Promise<User | undefined> {
  await ensureSchema();
  const rows = await dbQuery`SELECT * FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`;
  if (rows.length === 0) return undefined;
  const r = rows[0];
  return {
    id: r.id as string,
    email: r.email as string,
    name: r.name as string,
    passwordHash: r.password_hash as string,
    salt: r.salt as string,
    createdAt: r.created_at as string,
  };
}

export async function getUserById(id: string): Promise<User | undefined> {
  await ensureSchema();
  const rows = await dbQuery`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return undefined;
  const r = rows[0];
  return {
    id: r.id as string,
    email: r.email as string,
    name: r.name as string,
    passwordHash: r.password_hash as string,
    salt: r.salt as string,
    createdAt: r.created_at as string,
  };
}

export async function addUser(user: User): Promise<void> {
  await ensureSchema();
  await dbQuery`
    INSERT INTO users (id, email, name, password_hash, salt, created_at)
    VALUES (${user.id}, ${user.email}, ${user.name}, ${user.passwordHash}, ${user.salt}, ${user.createdAt})
  `;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  await ensureSchema();
  const existing = await getUserById(id);
  if (!existing) return null;

  const email = updates.email ?? existing.email;
  const name = updates.name ?? existing.name;
  const passwordHash = updates.passwordHash ?? existing.passwordHash;
  const salt = updates.salt ?? existing.salt;

  await dbQuery`
    UPDATE users SET email = ${email}, name = ${name}, password_hash = ${passwordHash}, salt = ${salt}
    WHERE id = ${id}
  `;
  return getUserById(id) as Promise<User>;
}

export async function deleteUser(id: string): Promise<boolean> {
  await ensureSchema();
  await dbQuery`DELETE FROM users WHERE id = ${id}`;
  return true;
}

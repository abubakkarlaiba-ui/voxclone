export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

import type { VoiceProfile } from "@/types";

/**
 * In-memory voice profile store using globalThis for Vercel serverless persistence.
 *
 * globalThis persists across warm invocations of the same serverless function.
 * On cold starts, data is lost — in production, replace with a real database.
 */
const g = globalThis as typeof globalThis & { __voxcloneProfiles?: VoiceProfile[] };
if (!g.__voxcloneProfiles) g.__voxcloneProfiles = [];
const profiles = g.__voxcloneProfiles;

export function getProfilesByUserId(userId: string): VoiceProfile[] {
  return profiles.filter((p) => p.userId === userId);
}

export function getProfileById(id: string): VoiceProfile | undefined {
  return profiles.find((p) => p.id === id);
}

export function addProfile(profile: VoiceProfile): void {
  profiles.push(profile);
}

export function updateProfile(id: string, updates: Partial<VoiceProfile>): VoiceProfile | null {
  const profile = getProfileById(id);
  if (!profile) return null;
  Object.assign(profile, updates, { updatedAt: new Date().toISOString() });
  return profile;
}

export function deleteProfile(id: string): boolean {
  const index = profiles.findIndex((p) => p.id === id);
  if (index === -1) return false;
  profiles.splice(index, 1);
  return true;
}

import type { VoiceProfile } from "@/types";

const g = globalThis as typeof globalThis & { __vxProfiles?: VoiceProfile[] };
if (!g.__vxProfiles) g.__vxProfiles = [];
const profiles = g.__vxProfiles;

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

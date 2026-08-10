import type { VoiceProfile, VoiceSample } from "@/types";
import { dbQuery, ensureSchema } from "./db";

function rowToProfile(r: Record<string, unknown>): VoiceProfile {
  const rawSamples = r.samples;
  let samples: VoiceSample[];
  if (typeof rawSamples === "string") {
    samples = JSON.parse(rawSamples);
  } else if (Array.isArray(rawSamples)) {
    samples = rawSamples as VoiceSample[];
  } else {
    samples = [];
  }

  return {
    id: r.id as string,
    userId: r.user_id as string,
    name: r.name as string,
    description: (r.description as string) || "",
    status: r.status as VoiceProfile["status"],
    samples,
    totalDuration: (r.total_duration as number) || 0,
    providerVoiceId: (r.provider_voice_id as string) || null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    processedAt: (r.processed_at as string) || null,
    errorMessage: (r.error_message as string) || null,
  };
}

export async function getProfilesByUserId(userId: string): Promise<VoiceProfile[]> {
  await ensureSchema();
  const rows = await dbQuery`SELECT * FROM voice_profiles WHERE user_id = ${userId} ORDER BY created_at DESC`;
  return rows.map((r) => rowToProfile(r));
}

export async function getProfileById(id: string): Promise<VoiceProfile | undefined> {
  await ensureSchema();
  const rows = await dbQuery`SELECT * FROM voice_profiles WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return undefined;
  return rowToProfile(rows[0]);
}

export async function addProfile(profile: VoiceProfile): Promise<void> {
  await ensureSchema();
  await dbQuery`
    INSERT INTO voice_profiles (id, user_id, name, description, status, samples, total_duration, provider_voice_id, created_at, updated_at, processed_at, error_message)
    VALUES (${profile.id}, ${profile.userId}, ${profile.name}, ${profile.description}, ${profile.status}, ${JSON.stringify(profile.samples)}, ${profile.totalDuration}, ${profile.providerVoiceId}, ${profile.createdAt}, ${profile.updatedAt}, ${profile.processedAt}, ${profile.errorMessage})
  `;
}

export async function updateProfile(id: string, updates: Partial<VoiceProfile>): Promise<VoiceProfile | null> {
  await ensureSchema();
  const existing = await getProfileById(id);
  if (!existing) return null;

  const name = updates.name ?? existing.name;
  const description = updates.description ?? existing.description;
  const status = updates.status ?? existing.status;
  const samples = updates.samples ?? existing.samples;
  const totalDuration = updates.totalDuration ?? existing.totalDuration;
  const providerVoiceId = updates.providerVoiceId ?? existing.providerVoiceId;
  const processedAt = updates.processedAt ?? existing.processedAt;
  const errorMessage = updates.errorMessage ?? existing.errorMessage;
  const updatedAt = new Date().toISOString();

  await dbQuery`
    UPDATE voice_profiles
    SET name = ${name}, description = ${description}, status = ${status},
        samples = ${JSON.stringify(samples)}, total_duration = ${totalDuration},
        provider_voice_id = ${providerVoiceId}, processed_at = ${processedAt},
        error_message = ${errorMessage}, updated_at = ${updatedAt}
    WHERE id = ${id}
  `;
  return getProfileById(id) as Promise<VoiceProfile>;
}

export async function deleteProfile(id: string): Promise<boolean> {
  await ensureSchema();
  await dbQuery`DELETE FROM voice_profiles WHERE id = ${id}`;
  return true;
}

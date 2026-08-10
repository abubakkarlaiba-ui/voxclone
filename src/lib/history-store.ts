import type { HistoryItem, HistoryListParams, HistoryListResult } from "@/types";
import { dbQuery, ensureSchema } from "./db";

function rowToItem(r: Record<string, unknown>): HistoryItem {
  let options = r.options;
  if (typeof options === "string") options = JSON.parse(options);
  return {
    id: r.id as string,
    userId: r.user_id as string,
    voiceId: r.voice_id as string,
    voiceName: r.voice_name as string,
    text: r.text as string,
    audioUrl: (r.audio_url as string) || "",
    duration: (r.duration as number) || 0,
    format: (r.format as string) || "mp3",
    options: (options as HistoryItem["options"]) || {},
    createdAt: r.created_at as string,
  };
}

export async function getHistoryList(userId: string, params: HistoryListParams): Promise<HistoryListResult> {
  await ensureSchema();

  let items: HistoryItem[];
  let total: number;

  if (params.search && params.voiceId) {
    const q = `%${params.search.toLowerCase()}%`;
    const countResult = await dbQuery`SELECT COUNT(*) as total FROM history_items WHERE user_id = ${userId} AND LOWER(text) LIKE ${q} AND voice_id = ${params.voiceId}`;
    total = Number(countResult[0]?.total ?? 0);
    const start = (params.page - 1) * params.pageSize;
    const rows = await dbQuery`SELECT * FROM history_items WHERE user_id = ${userId} AND LOWER(text) LIKE ${q} AND voice_id = ${params.voiceId} ORDER BY created_at DESC LIMIT ${params.pageSize} OFFSET ${start}`;
    items = rows.map((r) => rowToItem(r));
  } else if (params.search) {
    const q = `%${params.search.toLowerCase()}%`;
    const countResult = await dbQuery`SELECT COUNT(*) as total FROM history_items WHERE user_id = ${userId} AND LOWER(text) LIKE ${q}`;
    total = Number(countResult[0]?.total ?? 0);
    const start = (params.page - 1) * params.pageSize;
    const rows = await dbQuery`SELECT * FROM history_items WHERE user_id = ${userId} AND LOWER(text) LIKE ${q} ORDER BY created_at DESC LIMIT ${params.pageSize} OFFSET ${start}`;
    items = rows.map((r) => rowToItem(r));
  } else if (params.voiceId) {
    const countResult = await dbQuery`SELECT COUNT(*) as total FROM history_items WHERE user_id = ${userId} AND voice_id = ${params.voiceId}`;
    total = Number(countResult[0]?.total ?? 0);
    const start = (params.page - 1) * params.pageSize;
    const rows = await dbQuery`SELECT * FROM history_items WHERE user_id = ${userId} AND voice_id = ${params.voiceId} ORDER BY created_at DESC LIMIT ${params.pageSize} OFFSET ${start}`;
    items = rows.map((r) => rowToItem(r));
  } else {
    const countResult = await dbQuery`SELECT COUNT(*) as total FROM history_items WHERE user_id = ${userId}`;
    total = Number(countResult[0]?.total ?? 0);
    const start = (params.page - 1) * params.pageSize;
    const rows = await dbQuery`SELECT * FROM history_items WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${params.pageSize} OFFSET ${start}`;
    items = rows.map((r) => rowToItem(r));
  }

  const totalPages = Math.ceil(total / params.pageSize);

  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages,
  };
}

export async function getHistoryItemById(id: string): Promise<HistoryItem | undefined> {
  await ensureSchema();
  const rows = await dbQuery`SELECT * FROM history_items WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return undefined;
  return rowToItem(rows[0]);
}

export async function addHistoryItem(item: HistoryItem): Promise<void> {
  await ensureSchema();
  await dbQuery`
    INSERT INTO history_items (id, user_id, voice_id, voice_name, text, audio_url, duration, format, options, created_at)
    VALUES (${item.id}, ${item.userId}, ${item.voiceId}, ${item.voiceName}, ${item.text}, ${item.audioUrl}, ${item.duration}, ${item.format}, ${JSON.stringify(item.options)}, ${item.createdAt})
  `;
}

export async function deleteHistoryItem(id: string): Promise<boolean> {
  await ensureSchema();
  await dbQuery`DELETE FROM history_items WHERE id = ${id}`;
  return true;
}

export async function clearHistory(userId: string): Promise<void> {
  await ensureSchema();
  await dbQuery`DELETE FROM history_items WHERE user_id = ${userId}`;
}

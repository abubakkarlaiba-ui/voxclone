import type { HistoryItem, HistoryListParams, HistoryListResult } from "@/types";

/**
 * Shared in-memory store for generation history.
 *
 * IMPORTANT: This data is lost on server restart.
 * In production, replace with a real database.
 */
const items: HistoryItem[] = [];

export function getHistoryList(params: HistoryListParams): HistoryListResult {
  let filtered = [...items];

  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.text.toLowerCase().includes(q) ||
        item.voiceName.toLowerCase().includes(q)
    );
  }

  if (params.voiceId) {
    filtered = filtered.filter((item) => item.voiceId === params.voiceId);
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = filtered.length;
  const totalPages = Math.ceil(total / params.pageSize);
  const start = (params.page - 1) * params.pageSize;
  const paged = filtered.slice(start, start + params.pageSize);

  return { items: paged, total, page: params.page, pageSize: params.pageSize, totalPages };
}

export function getHistoryItemById(id: string): HistoryItem | undefined {
  return items.find((item) => item.id === id);
}

export function addHistoryItem(item: HistoryItem): void {
  items.unshift(item);
}

export function deleteHistoryItem(id: string): boolean {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  return true;
}

export function clearHistory(): void {
  items.length = 0;
}

export function getUniqueVoiceIds(): string[] {
  return [...new Set(items.map((item) => item.voiceId))];
}

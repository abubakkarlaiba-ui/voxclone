import type { HistoryItem, HistoryListParams, HistoryListResult } from "@/types";

const g = globalThis as typeof globalThis & { __vxHistory?: HistoryItem[] };
if (!g.__vxHistory) g.__vxHistory = [];
const items = g.__vxHistory;

export function getHistoryList(userId: string, params: HistoryListParams): HistoryListResult {
  let filtered = items.filter((item) => item.userId === userId);

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

export function clearHistory(userId: string): void {
  const toRemove = items.filter((item) => item.userId === userId);
  for (const item of toRemove) {
    const idx = items.indexOf(item);
    if (idx !== -1) items.splice(idx, 1);
  }
}

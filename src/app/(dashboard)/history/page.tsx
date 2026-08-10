"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { HistoryItemCard } from "@/components/history";
import { useNotification } from "@/hooks";
import { NotificationContainer } from "@/components/ui/Notification";
import type { HistoryListResult } from "@/types";

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const router = useRouter();
  const { notifications, addNotification, removeNotification } = useNotification();

  const [data, setData] = useState<HistoryListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fetchHistory = useCallback(async (p: number, q: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE) });
      if (q) params.set("search", q);
      const res = await fetch(`/api/history?${params}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message || "Failed to load history");
      }
    } catch {
      setError("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await fetchHistory(page, search);
    })();
    return () => { active = false; };
  }, [page, search, fetchHistory]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPage(1);
      setSearch(q);
    }, 300);
  };

  const handleDelete = (id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const items = prev.items.filter((item) => item.id !== id);
      const total = prev.total - 1;
      return {
        ...prev,
        items,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      };
    });
    addNotification("success", "History item deleted.");
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      const res = await fetch("/api/history", { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setData({ items: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 });
        addNotification("success", "All generation history deleted.");
      }
    } catch {
      addNotification("error", "Failed to clear history.");
    } finally {
      setIsClearing(false);
      setShowClearAllConfirm(false);
    }
  };

  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="py-8 page-enter">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Generation History</h1>
          <p className="mt-1 text-sm text-text-secondary">
            View and manage your past speech generations.
          </p>
        </div>
        {data && data.total > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setShowClearAllConfirm(true)} className="text-text-muted hover:text-error">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All
          </Button>
        )}
      </div>

      {/* Search */}
      {data && data.total > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by text or voice name..."
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-border-primary bg-bg-tertiary py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted transition-colors hover:border-border-secondary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/10"
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner label="Loading history..." />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <ErrorState message={error} onRetry={() => fetchHistory(page, search)} />
      )}

      {/* Empty */}
      {!isLoading && !error && data && data.total === 0 && !search && (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No history yet"
          description="Your generated speech will appear here."
          action={
            <Button onClick={() => router.push("/text-to-speech")}>
              Generate Speech
            </Button>
          }
        />
      )}

      {/* No search results */}
      {!isLoading && !error && data && data.total === 0 && search && (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          title="No results found"
          description={`No history items match "${search}". Try a different search.`}
        />
      )}

      {/* Results */}
      {!isLoading && !error && data && data.items.length > 0 && (
        <>
          <p className="mb-4 text-xs text-text-muted">
            {data.total} generation{data.total !== 1 ? "s" : ""}
          </p>
          <div className="space-y-3">
            {data.items.map((item) => (
              <HistoryItemCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="px-3 text-sm text-text-secondary">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmationDialog
        isOpen={showClearAllConfirm}
        onClose={() => setShowClearAllConfirm(false)}
        onConfirm={handleClearAll}
        title="Delete All Generated Audio"
        description={`This will permanently delete all ${data?.total ?? 0} generated audio files from your history. This cannot be undone.`}
        confirmLabel="Delete All"
        isLoading={isClearing}
      />

      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

interface HistoryItem {
  id: string;
  text: string;
  voiceName: string;
  status: "completed" | "failed" | "pending";
  createdAt: string;
  audioUrl: string | null;
  duration: number;
}

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: "1",
    text: "Welcome to VoxClone, the professional AI voice generation platform.",
    voiceName: "My Professional Voice",
    status: "completed",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    audioUrl: null,
    duration: 8,
  },
  {
    id: "2",
    text: "This is a demonstration of natural-sounding AI speech synthesis.",
    voiceName: "My Professional Voice",
    status: "completed",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    audioUrl: null,
    duration: 5,
  },
];

const statusStyles: Record<string, string> = {
  completed: "bg-success/10 text-success",
  failed: "bg-error/10 text-error",
  pending: "bg-warning/10 text-warning",
};

export default function HistoryPage() {
  const router = useRouter();
  const [history] = useState<HistoryItem[]>(MOCK_HISTORY);

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Generation History</h1>
        <p className="mt-1 text-sm text-text-secondary">
          View your past speech generations.
        </p>
      </div>

      {history.length === 0 ? (
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
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <Card key={item.id} variant="glass">
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", statusStyles[item.status])}>
                        {item.status}
                      </span>
                      <span className="text-xs text-text-muted">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mb-1 truncate text-sm text-text-primary">&quot;{item.text}&quot;</p>
                    <p className="text-xs text-text-muted">Voice: {item.voiceName}</p>
                  </div>
                  {item.audioUrl ? (
                    <div className="w-64 flex-shrink-0">
                      <AudioPlayer src={item.audioUrl} />
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted italic">No audio</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

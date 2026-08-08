"use client";

import { VoiceCard } from "./VoiceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { VoiceProfile } from "@/types";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

interface VoiceListProps {
  voices: VoiceProfile[];
  onUse?: (voiceId: string) => void;
  onDelete?: (voiceId: string) => void;
  isLoading?: boolean;
}

export function VoiceList({ voices, onUse, onDelete, isLoading }: VoiceListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
          />
        ))}
      </div>
    );
  }

  if (voices.length === 0) {
    return (
      <EmptyState
        title="No voice profiles yet"
        description="Record your first voice to get started with AI voice generation."
        action={
          <Link href={ROUTES.STUDIO}>
            <Button>Record Your Voice</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {voices.map((voice) => (
        <VoiceCard
          key={voice.id}
          voice={voice}
          onUse={onUse}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

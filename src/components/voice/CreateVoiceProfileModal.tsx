"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useNotification } from "@/hooks";
import { ROUTES } from "@/lib/constants";

interface CreateVoiceProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (profileId: string) => void;
}

export function CreateVoiceProfileModal({
  isOpen,
  onClose,
  onCreated,
}: CreateVoiceProfileModalProps) {
  const { addNotification } = useNotification();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      addNotification("warning", "Voice name is required.");
      return;
    }
    if (!consentChecked) {
      addNotification("warning", "You must confirm voice ownership or permission before creating a voice.");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification("success", `Voice "${name.trim()}" created.`);
        setName("");
        setDescription("");
        setConsentChecked(false);
        onCreated(data.data.id);
        onClose();
      } else {
        addNotification("error", data.error?.message || "Failed to create voice");
      }
    } catch {
      addNotification("error", "Failed to create voice.");
    } finally {
      setIsCreating(false);
    }
  }, [name, description, consentChecked, addNotification, onCreated, onClose]);

  const handleClose = () => {
    if (!isCreating) {
      setName("");
      setDescription("");
      setConsentChecked(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Voice"
      description="Give your voice a name. You can add samples after creation."
      size="md"
    >
      <div className="space-y-4">
        <Input
          label="Voice Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My Professional Voice"
          maxLength={100}
        />
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief description of this voice..."
          rows={3}
        />

        {/* Voice Consent Notice */}
        <div className="rounded-lg border border-border-primary bg-bg-tertiary/50 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center">
              <input
                type="checkbox"
                id="voice-consent"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="h-4 w-4 rounded border-border-primary bg-bg-primary text-accent-primary focus:ring-accent-primary/20"
              />
            </div>
            <label htmlFor="voice-consent" className="text-sm leading-relaxed text-text-secondary cursor-pointer">
              I confirm that the voice I am about to clone <span className="font-medium text-text-primary">belongs to me</span>, or I have{" "}
              <span className="font-medium text-text-primary">explicit permission</span> from the voice owner to use their voice for AI cloning.
              I understand that using this service to impersonate people without permission is prohibited.{" "}
              <Link href={ROUTES.TERMS} target="_blank" className="text-accent-primary hover:underline">
                View Terms of Service
              </Link>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button size="sm" isLoading={isCreating} onClick={handleCreate} disabled={!consentChecked}>
            Create Voice
          </Button>
        </div>
      </div>
    </Modal>
  );
}

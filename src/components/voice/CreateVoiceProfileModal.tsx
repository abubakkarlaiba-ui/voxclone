"use client";

import { useState, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useNotification } from "@/hooks";

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
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      addNotification("warning", "Voice name is required.");
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
  }, [name, description, addNotification, onCreated, onClose]);

  const handleClose = () => {
    if (!isCreating) {
      setName("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Voice"
      description="Give your voice a name. You can add samples after creation."
      size="sm"
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
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button size="sm" isLoading={isCreating} onClick={handleCreate}>
            Create Voice
          </Button>
        </div>
      </div>
    </Modal>
  );
}

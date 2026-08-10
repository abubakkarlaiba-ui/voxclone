"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface AudioUploaderProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
  disabled?: boolean;
  className?: string;
}

const ACCEPTED_TYPES = ["audio/webm", "audio/wav", "audio/mp3", "audio/ogg", "audio/mpeg", "audio/x-wav"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function AudioUploader({ onUpload, isUploading = false, disabled = false, className }: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): boolean => {
    setError(null);

    // Normalize MIME type by stripping codec params
    const normalizedType = file.type.split(";")[0].trim().toLowerCase();

    if (!ACCEPTED_TYPES.includes(normalizedType) && !file.name.match(/\.(webm|wav|mp3|ogg|m4a|flac)$/i)) {
      setError("Unsupported format. Use WebM, WAV, MP3, or OGG.");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 50MB.");
      return false;
    }

    return true;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        onUpload(file);
      }
    },
    [validateFile, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile]
  );

  return (
    <div className={cn(className)}>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={handleChange}
        className="hidden"
        aria-label="Upload audio file"
      />
      <button
        type="button"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        disabled={disabled || isUploading}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all duration-200",
          isDragging
            ? "border-accent-primary bg-accent-primary/5"
            : "border-border-primary hover:border-border-secondary hover:bg-bg-elevated",
          disabled && "cursor-not-allowed opacity-50",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        {isUploading ? (
          <svg className="mb-2 h-6 w-6 animate-spin text-accent-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="mb-2 h-6 w-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        )}
        <p className="text-sm font-medium text-text-secondary">
          {isUploading ? "Uploading..." : "Drop audio file or click to browse"}
        </p>
        <p className="mt-1 text-xs text-text-muted">WebM, WAV, MP3, OGG up to 50MB</p>
      </button>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}

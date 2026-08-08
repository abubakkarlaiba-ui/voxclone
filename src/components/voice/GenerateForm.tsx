"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { MAX_TEXT_LENGTH, MIN_TEXT_LENGTH } from "@/lib/constants";
import type { GenerateOptions } from "@/types";

interface GenerateFormProps {
  voiceId: string;
  voiceName: string;
  onGenerate: (text: string, options: GenerateOptions) => void;
  isGenerating?: boolean;
  className?: string;
}

export function GenerateForm({
  voiceName,
  onGenerate,
  isGenerating = false,
  className,
}: GenerateFormProps) {
  const [text, setText] = useState("");
  const [options, setOptions] = useState<GenerateOptions>({
    speed: 1,
    format: "mp3",
  });

  const isValid = text.length >= MIN_TEXT_LENGTH && text.length <= MAX_TEXT_LENGTH;
  const charCount = text.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isGenerating) {
      onGenerate(text, options);
    }
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>
          Generate Speech with{" "}
          <span className="text-indigo-600">{voiceName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            label="Text to speak"
            placeholder="Enter the text you want to convert to speech..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={MAX_TEXT_LENGTH}
            error={
              charCount > MAX_TEXT_LENGTH
                ? `Text exceeds ${MAX_TEXT_LENGTH} characters`
                : undefined
            }
            helperText={`${charCount}/${MAX_TEXT_LENGTH} characters`}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Speed: {options.speed}x
              </label>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={options.speed}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    speed: Number(e.target.value),
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Format
              </label>
              <select
                value={options.format}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    format: e.target.value as GenerateOptions["format"],
                  }))
                }
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
                <option value="ogg">OGG</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isGenerating}
            disabled={!isValid || isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate Speech"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

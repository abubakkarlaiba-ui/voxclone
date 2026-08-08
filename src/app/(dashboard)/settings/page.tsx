"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useNotification } from "@/hooks";
import { NotificationContainer } from "@/components/ui/Notification";
import { USER_PLACEHOLDER } from "@/lib/constants";

export default function SettingsPage() {
  const [name, setName] = useState<string>(USER_PLACEHOLDER.name);
  const [email, setEmail] = useState<string>(USER_PLACEHOLDER.email);
  const [isSaving, setIsSaving] = useState(false);
  const { notifications, addNotification, removeNotification } = useNotification();

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    addNotification("success", "Settings saved successfully.");
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="space-y-6">
        <Card variant="glass">
          <CardHeader>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 text-lg font-bold text-accent-primary">
                {name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{name}</p>
                <p className="text-xs text-text-muted">{USER_PLACEHOLDER.plan} Plan</p>
              </div>
            </div>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="pt-2">
              <Button onClick={handleSave} isLoading={isSaving}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <div>
              <CardTitle>Usage</CardTitle>
              <CardDescription>Your current usage and limits.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-bg-tertiary p-4">
                <p className="text-2xl font-bold text-text-primary">{USER_PLACEHOLDER.voicesCount}</p>
                <p className="text-xs text-text-muted">Voice Profiles</p>
              </div>
              <div className="rounded-xl bg-bg-tertiary p-4">
                <p className="text-2xl font-bold text-text-primary">{USER_PLACEHOLDER.generationsCount}</p>
                <p className="text-xs text-text-muted">Generations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <div>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Configure your voice generation API key.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Voice API Key"
              type="password"
              placeholder="Enter your API key..."
              helperText="Set this in your .env.local file for production."
            />
            <Input
              label="API Endpoint"
              placeholder="https://api.example.com/v1"
              helperText="Optional: Custom API endpoint URL."
            />
            <div className="pt-2">
              <Button variant="secondary" onClick={() => addNotification("info", "API settings are configured via environment variables.")}>
                Check Configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <div>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Irreversible actions.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-xl border border-error/20 bg-error/5 p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Delete All Voices</p>
                <p className="text-xs text-text-muted">Permanently delete all your voice profiles.</p>
              </div>
              <Button variant="danger" size="sm">
                Delete All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </div>
  );
}

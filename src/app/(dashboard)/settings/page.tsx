"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useUser } from "@/hooks";
import { useNotification } from "@/hooks";
import { NotificationContainer } from "@/components/ui/Notification";

export default function SettingsPage() {
  const { user, isLoading, logout, refresh } = useUser();
  const { notifications, addNotification, removeNotification } = useNotification();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const startEditingProfile = useCallback(() => {
    if (!user) return;
    setEditName(user.name);
    setEditEmail(user.email);
    setIsEditingProfile(true);
  }, [user]);

  const cancelEditingProfile = useCallback(() => {
    setIsEditingProfile(false);
    setEditName("");
    setEditEmail("");
  }, []);

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;

    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim().toLowerCase();

    if (!trimmedName) {
      addNotification("error", "Name cannot be empty");
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      addNotification("error", "Invalid email address");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification("success", "Profile updated successfully!");
        setIsEditingProfile(false);
        if (refresh) await refresh();
      } else {
        addNotification("error", data.error?.message || "Failed to update profile");
      }
    } catch {
      addNotification("error", "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  }, [user, editName, editEmail, addNotification, refresh]);

  const handleChangePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      addNotification("error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      addNotification("error", "New password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification("success", "Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        addNotification("error", data.error?.message || "Failed to change password");
      }
    } catch {
      addNotification("error", "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword, addNotification]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <LoadingSpinner label="Loading profile..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Profile & Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your account settings.</p>
      </div>

      {/* Profile Card */}
      <Card variant="glass" className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information.</CardDescription>
            </div>
            {!isEditingProfile && (
              <Button variant="secondary" size="sm" onClick={startEditingProfile}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingProfile ? (
            <>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary/10 text-xl font-bold text-accent-primary">
                  {initials}
                </div>
                <div className="flex-1">
                  <Input
                    label="Name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>
              <Input
                label="Email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={cancelEditingProfile}
                  disabled={isSavingProfile}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  isLoading={isSavingProfile}
                  onClick={handleSaveProfile}
                >
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary/10 text-xl font-bold text-accent-primary">
                {initials}
              </div>
              <div>
                <p className="text-base font-semibold text-text-primary">{user.name}</p>
                <p className="text-sm text-text-secondary">{user.email}</p>
                <p className="mt-1 text-xs text-text-muted">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card variant="glass" className="mb-6">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
            <Button type="submit" isLoading={isChangingPassword}>
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card variant="glass" className="border-error/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Sign out</p>
              <p className="text-xs text-text-muted">Sign out of your account on this device.</p>
            </div>
            <Button variant="danger" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </div>
  );
}

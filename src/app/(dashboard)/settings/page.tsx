"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useUser } from "@/hooks";
import { useNotification } from "@/hooks";
import { NotificationContainer } from "@/components/ui/Notification";

export default function SettingsPage() {
  const { user, isLoading, logout, refresh } = useUser();
  const { notifications, addNotification, removeNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  const compressImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        const maxDim = 96;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height / width) * maxDim);
            width = maxDim;
          } else {
            width = Math.round((width / height) * maxDim);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.4);
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
      img.src = url;
    });
  }, []);

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const dataUrl = await compressImage(file);

      if (dataUrl.length > 150000) {
        addNotification("error", "Image too large after compression. Try a simpler image.");
        return;
      }

      console.log("[Avatar] Uploading, size:", dataUrl.length);

      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });
      const data = await res.json();
      console.log("[Avatar] Response:", data);
      if (data.success) {
        addNotification("success", "Profile photo updated!");
        if (refresh) await refresh();
      } else {
        addNotification("error", data.error?.message || "Failed to upload photo");
      }
    } catch (err) {
      console.error("[Avatar] Upload error:", err);
      addNotification("error", "Failed to upload photo");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [addNotification, refresh, compressImage]);

  const handleRemoveAvatar = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/avatar", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        addNotification("success", "Profile photo removed.");
        if (refresh) await refresh();
      } else {
        addNotification("error", data.error?.message || "Failed to remove photo");
      }
    } catch {
      addNotification("error", "Failed to remove photo");
    }
  }, [addNotification, refresh]);

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
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Profile & Settings</h1>
          <p className="mt-1 text-sm text-[#8b8fa3]">Manage your account settings.</p>
        </div>
      </ScrollReveal>

      {/* Profile Photo Card */}
      <ScrollReveal delay={100}>
        <Card className="eleven-card mb-6 glow-border">
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>Your profile picture visible across the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative group">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-20 w-20 rounded-full object-cover ring-2 border-white/[0.08]"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 text-2xl font-bold text-[#818cf8] ring-2 border-white/[0.08]">
                  {initials}
                </div>
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {user.avatarUrl ? "Change Photo" : "Upload Photo"}
              </Button>
              {user.avatarUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#5c6073] hover:text-[#ef4444]"
                  onClick={handleRemoveAvatar}
                >
                  Remove Photo
                </Button>
              )}
              <p className="text-[11px] text-[#5c6073]">JPEG, PNG, WebP, or GIF. Max 200KB.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </ScrollReveal>

      {/* Profile Card */}
      <ScrollReveal delay={150}>
      <Card className="eleven-card mb-6">
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
              <Input
                label="Name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                required
              />
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
            <div className="space-y-2">
              <div>
                <p className="text-xs text-[#5c6073]">Name</p>
                <p className="text-sm font-medium text-white">{user.name}</p>
              </div>
              <div>
                <p className="text-xs text-[#5c6073]">Email</p>
                <p className="text-sm font-medium text-white">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-[#5c6073]">Member since</p>
                <p className="text-sm font-medium text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </ScrollReveal>

      {/* Change Password */}
      <ScrollReveal delay={200}>
      <Card className="eleven-card mb-6">
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
      </ScrollReveal>

      {/* Danger Zone */}
      <ScrollReveal delay={250}>
      <Card className="eleven-card border-[#ef4444]/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Sign out</p>
              <p className="text-xs text-[#5c6073]">Sign out of your account on this device.</p>
            </div>
            <Button variant="danger" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
      </ScrollReveal>

      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </div>
  );
}
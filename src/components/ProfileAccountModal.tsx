"use client";

import React, { useState } from "react";
import { Profile } from "@/types/ownflix";
import { AVATAR_ICONS, renderProfileIcon } from "./ProfileGate";
import {
  X,
  KeyRound,
  Lock,
  Unlock,
  Check,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

const AVATAR_COLORS = [
  "#E50914",
  "#0071EB",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
];

interface ProfileAccountModalProps {
  profile: Profile;
  onClose: () => void;
  onProfileUpdated: (updated: Profile) => Promise<void>;
}

export default function ProfileAccountModal({
  profile,
  onClose,
  onProfileUpdated,
}: ProfileAccountModalProps) {
  const [name, setName] = useState(profile.name);
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor);
  const [avatarIcon, setAvatarIcon] = useState(profile.avatarIcon);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [removePassword, setRemovePassword] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError("Profile name cannot be empty.");
      return;
    }

    if (!removePassword && newPassword.trim()) {
      if (newPassword.trim() !== confirmPassword.trim()) {
        setError("New password and confirmation do not match.");
        return;
      }
      if (newPassword.trim().length < 3) {
        setError("Password must be at least 3 characters.");
        return;
      }
    }

    if (
      profile.hasPassword &&
      (newPassword.trim() || removePassword) &&
      !currentPassword
    ) {
      setError("Please enter your current password to update password settings.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: profile.id,
          name: name.trim(),
          avatarColor,
          avatarIcon,
          ...(newPassword.trim() || removePassword
            ? {
                currentPassword,
                newPassword: newPassword.trim() || undefined,
                removePassword,
              }
            : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update profile settings.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setRemovePassword(false);
      setSuccessMsg(
        removePassword
          ? "Password lock removed from your profile."
          : newPassword.trim()
          ? "Your profile password has been updated."
          : "Profile account settings saved."
      );
      await onProfileUpdated(data.profile);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-[#181818] text-white border border-zinc-800 rounded-xl max-w-lg w-full p-6 md:p-8 shadow-2xl my-auto"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-[#E50914]" />
            <h2 className="text-xl font-bold">
              Profile Account & Password Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3.5 py-2.5 bg-red-950/80 border border-red-700/70 rounded-lg text-xs sm:text-sm text-red-200">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 px-3.5 py-2.5 bg-emerald-950/80 border border-emerald-700/70 rounded-lg text-xs sm:text-sm text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Profile Identity Row */}
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-16 h-16 rounded-md flex items-center justify-center shrink-0 shadow-lg relative"
            style={{
              background: `linear-gradient(145deg, ${avatarColor}, #111111 150%)`,
            }}
          >
            {renderProfileIcon(avatarIcon, "w-9 h-9")}
            {profile.hasPassword && (
              <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-600 border-2 border-[#181818] flex items-center justify-center">
                <Lock className="w-3 h-3 text-white" />
              </span>
            )}
          </div>

          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded px-3 py-2 text-sm text-white outline-none"
            />
          </div>
        </div>

        {/* Avatar Color & Icon Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
              Avatar Color
            </label>
            <div className="flex items-center gap-2.5">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    avatarColor === c
                      ? "scale-110 ring-2 ring-white"
                      : "opacity-75 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {avatarColor === c && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
              Emblem
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {AVATAR_ICONS.map(({ id, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAvatarIcon(id)}
                  className={`p-2 rounded flex items-center justify-center border transition-colors ${
                    avatarIcon === id
                      ? "bg-zinc-700 border-white text-white"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Password Update Box */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 space-y-3.5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-200">
              {profile.hasPassword ? (
                <>
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Update Profile Password</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 text-zinc-400" />
                  <span>Set a Profile Password</span>
                </>
              )}
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                profile.hasPassword
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-700/50"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {profile.hasPassword ? "Protected" : "No Password Set"}
            </span>
          </div>

          {profile.hasPassword && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Current Password
              </label>
              <input
                type={showPass ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-white rounded px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          )}

          {!removePassword && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {profile.hasPassword ? "New Password" : "Create Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-white rounded px-3 py-2 text-sm text-white outline-none pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-white rounded px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>
          )}

          {profile.hasPassword && (
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={removePassword}
                onChange={(e) => {
                  setRemovePassword(e.target.checked);
                  if (e.target.checked) {
                    setNewPassword("");
                    setConfirmPassword("");
                  }
                }}
                className="w-4 h-4 accent-[#E50914]"
              />
              <span className="text-xs text-zinc-300">
                Disable password protection for this profile
              </span>
            </label>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-zinc-600 rounded text-zinc-300 hover:text-white"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm bg-[#E50914] hover:bg-[#f6121d] text-white font-bold rounded transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

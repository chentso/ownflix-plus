"use client";

import React, { useState } from "react";
import { Profile } from "@/types/ownflix";
import {
  generateFunnyProfileName,
  generateFunnyNameSuggestions,
} from "@/lib/nameGenerator";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Crown,
  Zap,
  Rocket,
  Tv,
  Smile,
  Flame,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  LogOut,
  Dices,
  RefreshCw,
} from "lucide-react";

interface ProfileGateProps {
  profiles: Profile[];
  onSelectProfile: (profile: Profile) => void;
  onForgetProfile?: (profileId: string) => void;
  onProfilesChanged: () => Promise<void>;
}

const AVATAR_COLORS = [
  "#2563EB", // Netflix Red
  "#0071EB", // Electric Blue
  "#10B981", // Emerald Green
  "#F59E0B", // Amber Gold
  "#8B5CF6", // Vivid Purple
  "#EC4899", // Neon Pink
];

export const AVATAR_ICONS = [
  { id: "smile", label: "Classic", Icon: Smile },
  { id: "crown", label: "Crown", Icon: Crown },
  { id: "zap", label: "Bolt", Icon: Zap },
  { id: "rocket", label: "Rocket", Icon: Rocket },
  { id: "tv", label: "Cinema", Icon: Tv },
  { id: "flame", label: "Flame", Icon: Flame },
];

export function renderProfileIcon(iconId: string, className = "w-14 h-14") {
  const found = AVATAR_ICONS.find((i) => i.id === iconId);
  const IconComponent = found ? found.Icon : Smile;
  return <IconComponent className={className} strokeWidth={1.8} />;
}

export default function ProfileGate({
  profiles,
  onSelectProfile,
  onForgetProfile,
  onProfilesChanged,
}: ProfileGateProps) {
  const [isManaging, setIsManaging] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Sign In to an Existing Profile by Name + Password
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInName, setSignInName] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [verifyingSignIn, setVerifyingSignIn] = useState(false);
  const [showSignInPass, setShowSignInPass] = useState(false);

  // Unlock password prompt state for a remembered profile
  const [unlockingProfile, setUnlockingProfile] = useState<Profile | null>(
    null
  );
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [verifyingUnlock, setVerifyingUnlock] = useState(false);
  const [showUnlockPass, setShowUnlockPass] = useState(false);

  // Create / Edit Profile form state
  const [name, setName] = useState("");
  const [funnySuggestions, setFunnySuggestions] = useState<string[]>(() =>
    generateFunnyNameSuggestions(3)
  );
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [avatarIcon, setAvatarIcon] = useState("smile");
  const [isKids, setIsKids] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [removePassword, setRemovePassword] = useState(false);
  const [showFormPass, setShowFormPass] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleProfileClick = (profile: Profile) => {
    if (isManaging) {
      openEditModal(profile);
      return;
    }
    if (profile.hasPassword) {
      setUnlockingProfile(profile);
      setUnlockPassword("");
      setUnlockError(null);
      setShowUnlockPass(false);
    } else {
      onSelectProfile(profile);
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockingProfile) return;
    setVerifyingUnlock(true);
    setUnlockError(null);
    try {
      const res = await fetch("/api/profiles/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: unlockingProfile.id,
          password: unlockPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUnlockError(data.error || "Incorrect password");
      } else {
        const target = data.profile || unlockingProfile;
        setUnlockingProfile(null);
        setUnlockPassword("");
        onSelectProfile(target);
      }
    } finally {
      setVerifyingUnlock(false);
    }
  };

  const handleSignInByNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInName.trim()) return;
    setVerifyingSignIn(true);
    setSignInError(null);
    try {
      const res = await fetch("/api/profiles/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signInName.trim(),
          password: signInPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.profile) {
        setSignInError(data.error || "Invalid profile name or password");
      } else {
        setIsSigningIn(false);
        setSignInName("");
        setSignInPassword("");
        await onProfilesChanged();
        onSelectProfile(data.profile);
      }
    } finally {
      setVerifyingSignIn(false);
    }
  };

  const handleRollFunnyName = () => {
    const rolled = generateFunnyProfileName();
    setName(rolled);
    setFunnySuggestions(generateFunnyNameSuggestions(3));
  };

  const openCreateModal = () => {
    setEditingProfile(null);
    const initialName = generateFunnyProfileName();
    setName(initialName);
    setFunnySuggestions(generateFunnyNameSuggestions(3));
    setAvatarColor(AVATAR_COLORS[profiles.length % AVATAR_COLORS.length]);
    setAvatarIcon("smile");
    setIsKids(false);
    setCurrentPassword("");
    setNewPassword("");
    setRemovePassword(false);
    setFormError(null);
    setIsCreating(true);
  };

  const openEditModal = (p: Profile) => {
    setIsCreating(false);
    setEditingProfile(p);
    setName(p.name);
    setFunnySuggestions(generateFunnyNameSuggestions(3));
    setAvatarColor(p.avatarColor);
    setAvatarIcon(p.avatarIcon);
    setIsKids(p.isKids);
    setCurrentPassword("");
    setNewPassword("");
    setRemovePassword(false);
    setFormError(null);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingProfile(null);
    setFormError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      if (isCreating) {
        const res = await fetch("/api/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            avatarColor,
            avatarIcon,
            isKids,
            password: newPassword,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "Failed to create profile");
          return;
        }
        await onProfilesChanged();
        closeModal();
        if (data.profile) {
          onSelectProfile(data.profile);
        }
        return;
      } else if (editingProfile) {
        const res = await fetch("/api/profiles", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProfile.id,
            name,
            avatarColor,
            avatarIcon,
            isKids,
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
          setFormError(data.error || "Failed to update profile");
          return;
        }
      }
      await onProfilesChanged();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(
        `/api/profiles?id=${encodeURIComponent(
          id
        )}&password=${encodeURIComponent(currentPassword)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setFormError(
          data.error || "Enter current profile password to delete this profile"
        );
        return;
      }
      if (onForgetProfile) onForgetProfile(id);
      await onProfilesChanged();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col justify-between select-none">
      {/* Top Header */}
      <header className="px-8 md:px-14 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#2563EB] font-black text-3xl md:text-4xl tracking-tighter">
            OWNFLIX+
          </span>
          <span className="text-[10px] uppercase tracking-widest bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-semibold">
            Personal Media Server
          </span>
        </div>
      </header>

      {/* Main Profile Picker */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-10">
        <h1 className="text-3xl md:text-5xl font-medium tracking-tight mb-3 text-center">
          {isManaging ? "Manage Profiles:" : "Who's watching?"}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mb-10 text-center max-w-md">
          {profiles.length === 0
            ? "Sign in to your existing profile or create a new profile on this device."
            : "Showing only profiles you have signed into on this browser."}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 max-w-4xl">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleProfileClick(profile)}
              className="group flex flex-col items-center focus:outline-none"
            >
              <div
                className="relative w-28 h-28 md:w-36 md:h-36 rounded-md flex items-center justify-center transition-all duration-200 group-hover:ring-4 group-hover:ring-white group-hover:scale-105 shadow-xl overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${profile.avatarColor}, #111111 150%)`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

                <div className="text-white/95 drop-shadow">
                  {renderProfileIcon(
                    profile.avatarIcon,
                    "w-14 h-14 md:w-16 md:h-16"
                  )}
                </div>

                {profile.isKids && (
                  <span className="absolute bottom-1.5 right-1.5 bg-amber-400 text-black font-black text-[10px] px-1.5 py-0.5 rounded tracking-wider uppercase">
                    KIDS
                  </span>
                )}

                {profile.hasPassword && !isManaging && (
                  <span
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/65 border border-white/25 flex items-center justify-center text-zinc-200"
                    title="Password Protected Profile"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}

                {isManaging && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full border-2 border-white flex items-center justify-center">
                      <Pencil className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>

              <span className="mt-3 text-zinc-400 group-hover:text-white text-base md:text-lg font-normal transition-colors flex items-center gap-1.5">
                <span>{profile.name}</span>
                {profile.hasPassword && (
                  <Lock className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
                )}
              </span>
            </button>
          ))}

          {/* Sign In to Existing Profile Card */}
          <button
            onClick={() => {
              setSignInName("");
              setSignInPassword("");
              setSignInError(null);
              setIsSigningIn(true);
            }}
            className="group flex flex-col items-center focus:outline-none"
          >
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-md flex items-center justify-center border-2 border-zinc-700 group-hover:border-white group-hover:bg-zinc-800 bg-zinc-900/70 text-zinc-300 group-hover:text-white transition-all duration-200 group-hover:scale-105">
              <LogIn className="w-12 h-12" />
            </div>
            <span className="mt-3 text-zinc-400 group-hover:text-white text-base md:text-lg transition-colors">
              Sign In Profile
            </span>
          </button>

          {/* Create New Profile Card */}
          <button
            onClick={openCreateModal}
            className="group flex flex-col items-center focus:outline-none"
          >
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-md flex items-center justify-center border-2 border-transparent group-hover:bg-zinc-200 group-hover:text-black bg-zinc-800/60 text-zinc-400 transition-all duration-200 group-hover:scale-105">
              <Plus className="w-14 h-14" />
            </div>
            <span className="mt-3 text-zinc-400 group-hover:text-white text-base md:text-lg transition-colors">
              Create Profile
            </span>
          </button>
        </div>

        {profiles.length > 0 && (
          <div className="mt-14">
            <button
              onClick={() => setIsManaging((v) => !v)}
              className={`px-7 py-2.5 text-sm md:text-base tracking-widest uppercase font-medium transition-all ${
                isManaging
                  ? "bg-white text-black hover:bg-[#2563EB] hover:text-white font-bold"
                  : "border border-zinc-500 text-zinc-400 hover:border-white hover:text-white"
              }`}
            >
              {isManaging ? "Done" : "Manage Profiles"}
            </button>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-zinc-600">
        OwnFlix+ Self-Hosted Streaming Engine • Direct Play & FFmpeg Live Remux
      </footer>

      {/* Sign In to Existing Profile Modal (By Profile Name + Password) */}
      {isSigningIn && (
        <div
          onClick={() => setIsSigningIn(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSignInByNameSubmit}
            className="bg-[#181818] border border-zinc-800 rounded-xl max-w-md w-full p-6 md:p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <LogIn className="w-5 h-5 text-[#2563EB]" />
                <h2 className="text-xl font-bold">Sign In to Profile</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSigningIn(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {signInError && (
              <div className="mb-4 px-3 py-2 bg-red-950/80 border border-red-700/70 rounded text-xs text-red-200">
                {signInError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={signInName}
                  onChange={(e) => setSignInName(e.target.value)}
                  placeholder="Enter your profile name"
                  autoFocus
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded px-3.5 py-2.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5">
                  Password (leave blank if none set)
                </label>
                <div className="relative">
                  <input
                    type={showSignInPass ? "text" : "password"}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter profile password"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded px-3.5 py-2.5 text-white outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showSignInPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSigningIn(false)}
                className="px-4 py-2 text-sm border border-zinc-600 text-zinc-300 hover:text-white rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verifyingSignIn}
                className="px-6 py-2 text-sm bg-[#2563EB] hover:bg-[#3B82F6] text-white font-bold rounded transition-colors"
              >
                {verifyingSignIn ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Lock Password Verification Modal */}
      {unlockingProfile && (
        <div
          onClick={() => setUnlockingProfile(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleUnlockSubmit}
            className="bg-[#181818] border border-zinc-800 rounded-xl max-w-md w-full p-6 md:p-8 shadow-2xl text-center"
          >
            <div className="flex justify-end -mt-2 -mr-2">
              <button
                type="button"
                onClick={() => setUnlockingProfile(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="w-20 h-20 rounded-md flex items-center justify-center mx-auto mb-4 shadow-lg relative"
              style={{
                background: `linear-gradient(145deg, ${unlockingProfile.avatarColor}, #111111 150%)`,
              }}
            >
              {renderProfileIcon(unlockingProfile.avatarIcon, "w-10 h-10")}
              <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#2563EB] border-2 border-[#181818] flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-white" />
              </span>
            </div>

            <div className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-1">
              Profile Lock is ON
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              Enter password to access {unlockingProfile.name}
            </h2>

            {unlockError && (
              <div className="mb-4 px-3 py-2 bg-red-950/80 border border-red-700/70 rounded text-xs text-red-200">
                {unlockError}
              </div>
            )}

            <div className="relative mb-6">
              <input
                type={showUnlockPass ? "text" : "password"}
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Enter profile password"
                autoFocus
                required
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded px-4 py-3 text-white text-center tracking-wider outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowUnlockPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showUnlockPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setUnlockingProfile(null)}
                className="px-5 py-2.5 text-sm border border-zinc-600 text-zinc-300 hover:border-white hover:text-white rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verifyingUnlock}
                className="px-7 py-2.5 text-sm bg-[#2563EB] hover:bg-[#3B82F6] text-white font-bold rounded transition-colors"
              >
                {verifyingUnlock ? "Verifying..." : "Unlock Profile"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create / Edit Profile Modal */}
      {(isCreating || editingProfile) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-[#181818] border border-zinc-800 rounded-lg max-w-md w-full p-6 md:p-8 shadow-2xl my-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {isCreating ? "Create Profile" : "Edit Profile"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 px-3 py-2 bg-red-950/80 border border-red-700/70 rounded text-xs text-red-200">
                {formError}
              </div>
            )}

            <div className="flex items-center gap-5 mb-6">
              <div
                className="w-20 h-20 rounded-md flex items-center justify-center shrink-0 shadow-lg"
                style={{
                  background: `linear-gradient(145deg, ${avatarColor}, #111111 150%)`,
                }}
              >
                {renderProfileIcon(avatarIcon, "w-10 h-10")}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs uppercase tracking-wider text-zinc-400">
                    Profile Name
                  </label>
                  <button
                    type="button"
                    onClick={handleRollFunnyName}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] hover:text-blue-300 transition-colors"
                    title="Generate a funny unique profile name"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Funny Name</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    required
                    autoFocus
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-white rounded px-3.5 py-2 text-white outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={handleRollFunnyName}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#3B82F6] p-1 rounded transition-colors"
                    title="Roll another funny name"
                  >
                    <Dices className="w-4 h-4" />
                  </button>
                </div>

                {/* Funny Name Suggestion Pills */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                    Ideas:
                  </span>
                  {funnySuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setName(sug)}
                      className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-800/90 hover:bg-[#2563EB]/25 text-zinc-300 hover:text-white border border-zinc-700 hover:border-[#3B82F6] transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setFunnySuggestions(generateFunnyNameSuggestions(3))
                    }
                    className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="More funny name ideas"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Color Picker */}
            <div className="mb-5">
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                Avatar Color
              </label>
              <div className="flex items-center gap-3">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                      avatarColor === color
                        ? "scale-110 ring-2 ring-white"
                        : "opacity-75 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {avatarColor === color && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div className="mb-5">
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                Avatar Emblem
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_ICONS.map(({ id, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAvatarIcon(id)}
                    className={`p-2.5 rounded flex items-center justify-center border transition-colors ${
                      avatarIcon === id
                        ? "bg-zinc-700 border-white text-white"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Password Lock Section */}
            <div className="mb-5 bg-zinc-900/80 border border-zinc-800 rounded-lg p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                  <KeyRound className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Profile Password Lock</span>
                </div>
                {editingProfile?.hasPassword && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-700/50 px-1.5 py-0.5 rounded font-semibold">
                    Password Active
                  </span>
                )}
              </div>

              {editingProfile?.hasPassword && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Current Password (required to change/remove password or
                    delete)
                  </label>
                  <input
                    type={showFormPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-white rounded px-3 py-1.5 text-sm text-white outline-none"
                  />
                </div>
              )}

              {!removePassword && (
                <div className="relative">
                  <label className="block text-xs text-zinc-400 mb-1">
                    {editingProfile?.hasPassword
                      ? "New Password (leave blank to keep unchanged)"
                      : "Set Password (optional)"}
                  </label>
                  <div className="relative">
                    <input
                      type={showFormPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={
                        editingProfile?.hasPassword
                          ? "Enter new password"
                          : "Leave blank for no password"
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-white rounded px-3 py-1.5 text-sm text-white outline-none pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPass((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      {showFormPass ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {editingProfile?.hasPassword && (
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={removePassword}
                    onChange={(e) => {
                      setRemovePassword(e.target.checked);
                      if (e.target.checked) setNewPassword("");
                    }}
                    className="w-3.5 h-3.5 accent-[#2563EB]"
                  />
                  <span className="text-xs text-zinc-400">
                    Remove password lock from this profile
                  </span>
                </label>
              )}
            </div>

            {/* Kids Toggle */}
            <label className="flex items-center gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={isKids}
                onChange={(e) => setIsKids(e.target.checked)}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span className="text-sm text-zinc-300">
                Kids Profile (prioritizes family-friendly ratings)
              </span>
            </label>

            <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                {editingProfile && onForgetProfile ? (
                  <button
                    type="button"
                    onClick={() => {
                      onForgetProfile(editingProfile.id);
                      closeModal();
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white py-1.5"
                    title="Hide this profile from this browser without deleting its account"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Forget on This Device</span>
                  </button>
                ) : (
                  <div />
                )}

                {editingProfile && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleDelete(editingProfile.id)}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 py-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Account</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm border border-zinc-600 text-zinc-300 hover:border-white hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 text-sm bg-white text-black font-semibold hover:bg-[#2563EB] hover:text-white transition-colors"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

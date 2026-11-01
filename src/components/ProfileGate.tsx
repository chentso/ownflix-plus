"use client";

import React, { useState } from "react";
import { Profile } from "@/types/ownflix";
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
} from "lucide-react";

interface ProfileGateProps {
  profiles: Profile[];
  onSelectProfile: (profile: Profile) => void;
  onProfilesChanged: () => Promise<void>;
}

const AVATAR_COLORS = [
  "#E50914", // Netflix Red
  "#0071EB", // Electric Blue
  "#10B981", // Emerald Green
  "#F59E0B", // Amber Gold
  "#8B5CF6", // Vivid Purple
  "#EC4899", // Neon Pink
];

const AVATAR_ICONS = [
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
  onProfilesChanged,
}: ProfileGateProps) {
  const [isManaging, setIsManaging] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [avatarIcon, setAvatarIcon] = useState("smile");
  const [isKids, setIsKids] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingProfile(null);
    setName("");
    setAvatarColor(AVATAR_COLORS[profiles.length % AVATAR_COLORS.length]);
    setAvatarIcon("smile");
    setIsKids(false);
    setIsCreating(true);
  };

  const openEditModal = (p: Profile) => {
    setIsCreating(false);
    setEditingProfile(p);
    setName(p.name);
    setAvatarColor(p.avatarColor);
    setAvatarIcon(p.avatarIcon);
    setIsKids(p.isKids);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingProfile(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (isCreating) {
        await fetch("/api/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, avatarColor, avatarIcon, isKids }),
        });
      } else if (editingProfile) {
        await fetch("/api/profiles", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProfile.id,
            name,
            avatarColor,
            avatarIcon,
            isKids,
          }),
        });
      }
      await onProfilesChanged();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (profiles.length <= 1) return;
    setSaving(true);
    try {
      await fetch(`/api/profiles?id=${id}`, { method: "DELETE" });
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
          <span className="text-[#E50914] font-black text-3xl md:text-4xl tracking-tighter">
            OWNFLIX+
          </span>
          <span className="text-[10px] uppercase tracking-widest bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-semibold">
            Personal Media Server
          </span>
        </div>
      </header>

      {/* Main Profile Picker */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-10">
        <h1 className="text-3xl md:text-5xl font-medium tracking-tight mb-10 text-center">
          {isManaging ? "Manage Profiles:" : "Who's watching?"}
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 max-w-4xl">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() =>
                isManaging ? openEditModal(profile) : onSelectProfile(profile)
              }
              className="group flex flex-col items-center focus:outline-none"
            >
              <div
                className="relative w-28 h-28 md:w-36 md:h-36 rounded-md flex items-center justify-center transition-all duration-200 group-hover:ring-4 group-hover:ring-white group-hover:scale-105 shadow-xl overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${profile.avatarColor}, #111111 150%)`,
                }}
              >
                {/* Netflix-style subtle top highlight */}
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

                {isManaging && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full border-2 border-white flex items-center justify-center">
                      <Pencil className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>

              <span className="mt-3 text-zinc-400 group-hover:text-white text-base md:text-lg font-normal transition-colors flex items-center gap-1.5">
                {profile.name}
              </span>
            </button>
          ))}

          {profiles.length < 6 && (
            <button
              onClick={openCreateModal}
              className="group flex flex-col items-center focus:outline-none"
            >
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-md flex items-center justify-center border-2 border-transparent group-hover:bg-zinc-200 group-hover:text-black bg-zinc-800/60 text-zinc-400 transition-all duration-200 group-hover:scale-105">
                <Plus className="w-14 h-14" />
              </div>
              <span className="mt-3 text-zinc-400 group-hover:text-white text-base md:text-lg transition-colors">
                Add Profile
              </span>
            </button>
          )}
        </div>

        <div className="mt-14">
          <button
            onClick={() => setIsManaging((v) => !v)}
            className={`px-7 py-2.5 text-sm md:text-base tracking-widest uppercase font-medium transition-all ${
              isManaging
                ? "bg-white text-black hover:bg-[#E50914] hover:text-white font-bold"
                : "border border-zinc-500 text-zinc-400 hover:border-white hover:text-white"
            }`}
          >
            {isManaging ? "Done" : "Manage Profiles"}
          </button>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-zinc-600">
        OwnFlix+ Self-Hosted Streaming Engine • Direct Play & FFmpeg Live Remux
      </footer>

      {/* Create / Edit Profile Modal */}
      {(isCreating || editingProfile) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-[#181818] border border-zinc-800 rounded-lg max-w-md w-full p-6 md:p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {isCreating ? "Add Profile" : "Edit Profile"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

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
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                  required
                  autoFocus
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-white rounded px-3.5 py-2 text-white outline-none"
                />
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
                    {avatarColor === color && <Check className="w-4 h-4 text-white" />}
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

            {/* Kids Toggle */}
            <label className="flex items-center gap-3 cursor-pointer mb-7">
              <input
                type="checkbox"
                checked={isKids}
                onChange={(e) => setIsKids(e.target.checked)}
                className="w-4 h-4 accent-[#E50914]"
              />
              <span className="text-sm text-zinc-300">
                Kids Profile (prioritizes family-friendly ratings)
              </span>
            </label>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              {editingProfile && profiles.length > 1 ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDelete(editingProfile.id)}
                  className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 px-3 py-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Profile
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
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
                  className="px-6 py-2 text-sm bg-white text-black font-semibold hover:bg-[#E50914] hover:text-white transition-colors"
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

"use client";

import React, { useState } from "react";
import { Profile } from "@/types/ownflix";
import AvatarPicker from "./AvatarPicker";
import { renderProfileIcon, AVATAR_COLORS } from "./ProfileGate";
import {
  generateFunnyName,
  generateFunnyNameSuggestions,
} from "@/lib/nameGenerator";
import {
  ShieldCheck,
  Server,
  Lock,
  Eye,
  EyeOff,
  Dices,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Palette,
  Smile,
} from "lucide-react";

interface FirstSetupWizardProps {
  onSetupComplete: (profile: Profile) => void;
}

export default function FirstSetupWizard({
  onSetupComplete,
}: FirstSetupWizardProps) {
  const [name, setName] = useState("Server Admin");
  const [funnySuggestions, setFunnySuggestions] = useState<string[]>(() =>
    generateFunnyNameSuggestions(3)
  );
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0]); // Royal Blue #2563EB
  const [avatarIcon, setAvatarIcon] = useState<string>("crown");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRollFunnyName = () => {
    const rolled = generateFunnyName();
    setName(rolled);
    setFunnySuggestions(generateFunnyNameSuggestions(3));
  };

  const handleSelectSuggestion = (suggested: string) => {
    setName(suggested);
    setFunnySuggestions(generateFunnyNameSuggestions(3));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please provide a name for your administrator profile.");
      return;
    }

    if (!password) {
      setError("A password is required for your primary administrator profile.");
      return;
    }

    if (password.length < 3) {
      setError("Password must be at least 3 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-type your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          password: password.trim(),
          avatarColor,
          avatarIcon,
          isAdmin: true,
          isKids: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create administrator profile.");
        setLoading(false);
        return;
      }

      if (data.profile) {
        onSetupComplete(data.profile);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e11] text-white flex flex-col justify-between select-none relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#2563EB]/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="px-8 md:px-14 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-[#2563EB] font-black text-3xl md:text-4xl tracking-tighter">
            OWNFLIX+
          </span>
          <span className="text-[10px] uppercase tracking-widest bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40 px-2.5 py-1 rounded font-bold">
            Initial Server Setup
          </span>
        </div>
      </header>

      {/* Main Setup Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-xl bg-[#16161a] border border-zinc-800/90 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
          {/* Badge & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2563EB]/20 text-[#3B82F6] border border-[#2563EB]/40 mb-4 shadow-lg shadow-blue-500/10">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Welcome to OwnFlix+
            </h1>
            <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              No profiles are available on this server yet. Create your primary
              administrator profile and password to get started.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-950/80 border border-red-800 text-red-200 text-xs sm:text-sm rounded-lg flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Preview & Selection */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="relative w-24 h-24 rounded-xl flex items-center justify-center shadow-xl ring-2 ring-blue-500/50 overflow-hidden"
                  style={{
                    background: `linear-gradient(145deg, ${avatarColor}, #0a0a0a 160%)`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  <div className="text-white drop-shadow-md">
                    {renderProfileIcon(avatarIcon, "w-14 h-14")}
                  </div>
                  <span className="absolute bottom-1 right-1 bg-[#2563EB] text-white font-black text-[9px] px-1.5 py-0.5 rounded tracking-wider uppercase">
                    ADMIN
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 mt-2 font-medium">
                  Profile Avatar
                </span>
              </div>

              <div className="flex-1 w-full space-y-3">
                {/* Color swatches */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>Avatar Color</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAvatarColor(c)}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          avatarColor === c
                            ? "ring-2 ring-white scale-110"
                            : "opacity-75 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Avatar Icon Picker Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker((v) => !v)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-medium rounded-lg border border-zinc-700 transition-colors"
                  >
                    <Smile className="w-4 h-4 text-[#3B82F6]" />
                    <span>
                      {showAvatarPicker
                        ? "Close Avatar Catalog"
                        : "Choose Emblem / Emoji"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Embedded Avatar Picker dropdown */}
            {showAvatarPicker && (
              <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-xl max-h-72 overflow-y-auto">
                <AvatarPicker
                  selectedId={avatarIcon}
                  onSelect={(id) => {
                    setAvatarIcon(id);
                    setShowAvatarPicker(false);
                  }}
                />
              </div>
            )}

            {/* Profile Name & Funny Name Generator */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Administrator Profile Name
                </label>
                <button
                  type="button"
                  onClick={handleRollFunnyName}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#3B82F6] hover:text-blue-300 transition-colors"
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
                  placeholder="e.g. Captain Popcorn, Alex, Boss"
                  className="w-full px-3.5 py-2.5 pr-10 bg-zinc-900 border border-zinc-700 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-lg text-white text-sm outline-none transition-colors"
                  required
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

              {/* Funny suggestions pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-zinc-500 font-medium mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#3B82F6]" />
                  Ideas:
                </span>
                {funnySuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleSelectSuggestion(sug)}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800/80 hover:bg-[#2563EB]/30 hover:border-[#2563EB]/60 text-zinc-300 hover:text-white border border-zinc-700 transition-all font-medium"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Admin Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create master password"
                    className="w-full px-3.5 py-2.5 pr-10 bg-zinc-900 border border-zinc-700 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-lg text-white text-sm outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Confirm Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2.5 pr-10 bg-zinc-900 border border-zinc-700 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-lg text-white text-sm outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Admin Notice */}
            <div className="p-3 bg-[#2563EB]/10 border border-[#2563EB]/30 rounded-lg text-xs text-blue-200/90 flex items-start gap-2.5">
              <Server className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
              <span>
                This administrator profile will manage library storage folders,
                stream metadata, server activity logs, and create/manage
                additional user profiles.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Setting up Server...</span>
                </>
              ) : (
                <>
                  <span>Create Administrator Profile &amp; Launch OwnFlix+</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-500 relative z-10">
        OwnFlix+ Personal Media Server &bull; Secure Local Storage &bull; Royal Blue Edition
      </footer>
    </div>
  );
}

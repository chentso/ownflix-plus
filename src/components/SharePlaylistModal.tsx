"use client";

import React, { useState, useEffect } from "react";
import { Playlist } from "@/types/ownflix";
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  QrCode,
  Link2,
  ExternalLink,
} from "lucide-react";

interface SharePlaylistModalProps {
  playlist: Playlist;
  onClose: () => void;
  onPlaylistUpdated?: (updated: Playlist) => void;
}

export default function SharePlaylistModal({
  playlist,
  onClose,
  onPlaylistUpdated,
}: SharePlaylistModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isPublic, setIsPublic] = useState(playlist.isPublic);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      setShareUrl(`${origin}/?playlist=${playlist.shareCode}`);
    }
  }, [playlist.shareCode]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(playlist.shareCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  };

  const handleTogglePrivacy = async () => {
    const nextVal = !isPublic;
    setIsPublic(nextVal);
    setSavingPrivacy(true);
    try {
      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: nextVal }),
      });
      const data = await res.json();
      if (res.ok && data.playlist) {
        onPlaylistUpdated?.(data.playlist);
      }
    } catch (err) {
      console.error("Failed to update playlist privacy", err);
    } finally {
      setSavingPrivacy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181818] border border-zinc-800 text-white rounded-xl max-w-md w-full p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5 mb-5">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-[#3B82F6]" />
            <h2 className="text-lg font-bold">Share Custom Playlist</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Playlist Info Banner */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 mb-5">
          <div className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">
            Playlist
          </div>
          <h3 className="text-base font-bold text-white truncate">
            {playlist.title}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
            {playlist.description || `${playlist.items.length} titles in this custom list`}
          </p>
        </div>

        {/* Share Link Input */}
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
            Shareable Web Link
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 font-mono outline-none select-all"
              />
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${
                copiedLink
                  ? "bg-emerald-600 text-white"
                  : "bg-[#2563EB] hover:bg-[#3B82F6] text-white"
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share Code Input */}
        <div className="mb-5">
          <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
            Playlist Share Code (for quick import)
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-zinc-900/90 border border-zinc-700/80 rounded-lg px-3.5 py-2 text-xs text-zinc-200 font-mono flex items-center justify-between">
              <span className="font-bold text-[#3B82F6] tracking-wider">
                {playlist.shareCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold border flex items-center gap-1.5 shrink-0 transition-colors ${
                copiedCode
                  ? "bg-emerald-950 border-emerald-600 text-emerald-400"
                  : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200 hover:text-white"
              }`}
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Visibility Setting */}
        <div className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg mb-5">
          <div className="flex items-center gap-2.5">
            {isPublic ? (
              <Globe className="w-4 h-4 text-emerald-400" />
            ) : (
              <Lock className="w-4 h-4 text-amber-400" />
            )}
            <div>
              <div className="text-xs font-semibold">
                {isPublic ? "Public Playlist" : "Private Playlist"}
              </div>
              <div className="text-[11px] text-zinc-400">
                {isPublic
                  ? "Anyone with the share link or code can view and import this playlist"
                  : "Only your profile can view this playlist"}
              </div>
            </div>
          </div>

          <button
            onClick={handleTogglePrivacy}
            disabled={savingPrivacy}
            className="text-xs font-bold text-[#3B82F6] hover:text-blue-300 transition-colors"
          >
            {isPublic ? "Make Private" : "Make Public"}
          </button>
        </div>

        <div className="text-[11px] text-zinc-500 text-center">
          Share this list with other users or devices on your network. They can
          view, play all, or clone it into their own playlists.
        </div>
      </div>
    </div>
  );
}

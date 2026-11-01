"use client";

import React, { useState, useEffect } from "react";
import { MediaItem, Playlist, Profile } from "@/types/ownflix";
import {
  X,
  ListPlus,
  Plus,
  Check,
  FolderPlus,
  Loader2,
  Film,
} from "lucide-react";

interface AddToPlaylistModalProps {
  item: MediaItem;
  activeProfile: Profile;
  onClose: () => void;
  onPlaylistUpdated?: () => void;
}

export default function AddToPlaylistModal({
  item,
  activeProfile,
  onClose,
  onPlaylistUpdated,
}: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch(`/api/playlists?profileId=${activeProfile.id}`);
      const data = await res.json();
      if (res.ok) {
        setPlaylists(data.playlists || []);
      }
    } catch (err) {
      console.error("Failed to load playlists", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [activeProfile.id]);

  const handleToggleItem = async (playlist: Playlist) => {
    const isAlreadyIn = playlist.items.some(
      (pi) => pi.mediaItemId === item.id
    );
    setTogglingId(playlist.id);

    try {
      if (isAlreadyIn) {
        // Remove from playlist
        const res = await fetch(
          `/api/playlists/${playlist.id}/items?mediaItemId=${item.id}&profileId=${activeProfile.id}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setPlaylists((prev) =>
            prev.map((p) =>
              p.id === playlist.id
                ? {
                    ...p,
                    items: p.items.filter((i) => i.mediaItemId !== item.id),
                  }
                : p
            )
          );
        }
      } else {
        // Add to playlist
        const res = await fetch(`/api/playlists/${playlist.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaItemId: item.id,
            profileId: activeProfile.id,
          }),
        });
        const data = await res.json();
        if (res.ok && data.item) {
          setPlaylists((prev) =>
            prev.map((p) =>
              p.id === playlist.id
                ? {
                    ...p,
                    items: [...p.items, data.item],
                  }
                : p
            )
          );
        }
      }
      onPlaylistUpdated?.();
    } catch (err) {
      console.error("Failed to toggle playlist item", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          profileId: activeProfile.id,
          initialMediaItemId: item.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.playlist) {
        setPlaylists((prev) => [data.playlist, ...prev]);
        setNewTitle("");
        onPlaylistUpdated?.();
      }
    } catch (err) {
      console.error("Failed to create playlist", err);
    } finally {
      setCreating(false);
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
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <ListPlus className="w-5 h-5 text-[#3B82F6]" />
            <h2 className="text-lg font-bold">Add to Custom Playlist</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Item summary */}
        <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 rounded-lg p-2.5 mb-4">
          <div className="w-10 h-14 bg-zinc-800 rounded overflow-hidden shrink-0">
            {item.posterUrl || item.backdropUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.posterUrl || item.backdropUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <Film className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate">{item.title}</div>
            <div className="text-xs text-zinc-400">
              {item.type === "SERIES" ? "Series" : "Movie"} • {item.releaseYear} •{" "}
              {item.resolution}
            </div>
          </div>
        </div>

        {/* Existing Playlists Checklist */}
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
            Your Playlists
          </label>
          <div className="max-h-52 overflow-y-auto space-y-1.5 p-1 scrollbar-thin scrollbar-thumb-zinc-700">
            {loading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#3B82F6]" />
                <span>Loading your playlists...</span>
              </div>
            ) : playlists.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 bg-zinc-900/40 rounded-lg border border-dashed border-zinc-800">
                You haven&apos;t created any playlists yet.
              </div>
            ) : (
              playlists.map((playlist) => {
                const isIn = playlist.items.some(
                  (pi) => pi.mediaItemId === item.id
                );
                const isToggling = togglingId === playlist.id;

                return (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() => handleToggleItem(playlist)}
                    disabled={isToggling}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left text-xs ${
                      isIn
                        ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                        : "bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white"
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="font-semibold truncate">
                        {playlist.title}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {playlist.items.length} item
                        {playlist.items.length === 1 ? "" : "s"}
                        {playlist.description ? ` • ${playlist.description}` : ""}
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-colors ${
                        isIn
                          ? "bg-[#2563EB] border-[#3B82F6] text-white"
                          : "border-zinc-700 bg-zinc-800/80"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3 h-3 animate-spin text-white" />
                      ) : (
                        isIn && <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Create Playlist */}
        <form
          onSubmit={handleCreatePlaylist}
          className="pt-3 border-t border-zinc-800"
        >
          <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
            Create & Add to New Playlist
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Weekend Movie Night"
              className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-[#3B82F6] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
            />
            <button
              type="submit"
              disabled={creating || !newTitle.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
            >
              {creating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Create</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

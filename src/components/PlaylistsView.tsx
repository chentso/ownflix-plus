"use client";

import React, { useState, useEffect } from "react";
import { MediaItem, Playlist, Profile } from "@/types/ownflix";
import { renderProfileIcon } from "./ProfileGate";
import SharePlaylistModal from "./SharePlaylistModal";
import {
  ListPlus,
  Play,
  Share2,
  Trash2,
  Pencil,
  Plus,
  ArrowLeft,
  MoveUp,
  MoveDown,
  Globe,
  Lock,
  Copy,
  Check,
  Film,
  Download,
  Loader2,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  X,
  Bookmark,
} from "lucide-react";

interface PlaylistsViewProps {
  activeProfile: Profile;
  onPlayMedia: (item: MediaItem, playlistQueue?: MediaItem[]) => void;
  onSelectMediaDetails?: (item: MediaItem) => void;
  initialShareCode?: string | null;
}

export default function PlaylistsView({
  activeProfile,
  onPlayMedia,
  onSelectMediaDetails,
  initialShareCode,
}: PlaylistsViewProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);

  // Modals & Dialogs
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  const [sharingPlaylist, setSharingPlaylist] = useState<Playlist | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Edit playlist
  const [isEditingPlaylist, setIsEditingPlaylist] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/playlists?profileId=${activeProfile.id}&includePublic=true`
      );
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

  // Handle initial shareCode if passed in URL
  useEffect(() => {
    if (initialShareCode) {
      const loadShared = async () => {
        try {
          const res = await fetch(`/api/playlists/share/${initialShareCode}`);
          const data = await res.json();
          if (res.ok && data.playlist) {
            setActivePlaylist(data.playlist);
          }
        } catch (err) {
          console.error("Failed to load shared playlist by code", err);
        }
      };
      loadShared();
    }
  }, [initialShareCode]);

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
          description: newDescription.trim() || undefined,
          isPublic: newIsPublic,
          profileId: activeProfile.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.playlist) {
        setPlaylists((prev) => [data.playlist, ...prev]);
        setActivePlaylist(data.playlist);
        setShowCreateModal(false);
        setNewTitle("");
        setNewDescription("");
      }
    } catch (err) {
      console.error("Failed to create playlist", err);
    } finally {
      setCreating(false);
    }
  };

  const handleImportByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCode.trim()) return;

    setImporting(true);
    setImportError(null);

    // Extract code if user pasted a full URL
    let cleanCode = importCode.trim();
    if (cleanCode.includes("playlist=")) {
      const match = cleanCode.match(/[?&]playlist=([^&]+)/);
      if (match) cleanCode = match[1];
    } else if (cleanCode.includes("/share/")) {
      cleanCode = cleanCode.split("/share/").pop() || cleanCode;
    }

    try {
      const res = await fetch(`/api/playlists/share/${cleanCode}`);
      const data = await res.json();
      if (!res.ok || !data.playlist) {
        setImportError(data.error || "Playlist not found with that code.");
        return;
      }

      // Check if user already has it in list, otherwise clone it
      const cloneRes = await fetch(`/api/playlists/share/${cleanCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: activeProfile.id }),
      });
      const cloneData = await cloneRes.json();
      if (cloneRes.ok && cloneData.playlist) {
        setPlaylists((prev) => [cloneData.playlist, ...prev]);
        setActivePlaylist(cloneData.playlist);
        setShowImportModal(false);
        setImportCode("");
      } else {
        // If clone failed, just view the shared one directly
        setActivePlaylist(data.playlist);
        setShowImportModal(false);
        setImportCode("");
      }
    } catch (err) {
      console.error("Failed to import playlist", err);
      setImportError("Network error while importing playlist.");
    } finally {
      setImporting(false);
    }
  };

  const handleDeletePlaylist = async (playlist: Playlist) => {
    if (
      !confirm(
        `Are you sure you want to delete the playlist "${playlist.title}"?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/playlists/${playlist.id}?profileId=${activeProfile.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setPlaylists((prev) => prev.filter((p) => p.id !== playlist.id));
        if (activePlaylist?.id === playlist.id) {
          setActivePlaylist(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete playlist", err);
    }
  };

  const handleRemoveItem = async (mediaItemId: string) => {
    if (!activePlaylist) return;
    try {
      const res = await fetch(
        `/api/playlists/${activePlaylist.id}/items?mediaItemId=${mediaItemId}&profileId=${activeProfile.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        const updatedItems = activePlaylist.items.filter(
          (i) => i.mediaItemId !== mediaItemId
        );
        const updated = { ...activePlaylist, items: updatedItems };
        setActivePlaylist(updated);
        setPlaylists((prev) =>
          prev.map((p) => (p.id === activePlaylist.id ? updated : p))
        );
      }
    } catch (err) {
      console.error("Failed to remove item", err);
    }
  };

  const handleMoveItem = async (index: number, direction: "up" | "down") => {
    if (!activePlaylist) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activePlaylist.items.length) return;

    const newItems = [...activePlaylist.items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    const updated = { ...activePlaylist, items: newItems };
    setActivePlaylist(updated);
    setPlaylists((prev) =>
      prev.map((p) => (p.id === activePlaylist.id ? updated : p))
    );

    // Save reorder to backend
    try {
      await fetch(`/api/playlists/${activePlaylist.id}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaItemIds: newItems.map((i) => i.mediaItemId),
        }),
      });
    } catch (err) {
      console.error("Failed to save reorder", err);
    }
  };

  const handleSaveEdit = async () => {
    if (!activePlaylist || !editTitle.trim()) return;
    try {
      const res = await fetch(`/api/playlists/${activePlaylist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim() || null,
          profileId: activeProfile.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.playlist) {
        setActivePlaylist(data.playlist);
        setPlaylists((prev) =>
          prev.map((p) => (p.id === activePlaylist.id ? data.playlist : p))
        );
        setIsEditingPlaylist(false);
      }
    } catch (err) {
      console.error("Failed to update playlist", err);
    }
  };

  const handlePlayAll = (startIndex = 0) => {
    if (!activePlaylist || activePlaylist.items.length === 0) return;
    const queue = activePlaylist.items.map((i) => i.mediaItem);
    const startItem = queue[startIndex] || queue[0];
    onPlayMedia(startItem, queue.slice(startIndex + 1));
  };

  // Helper to calculate total runtime in minutes
  const totalRuntimeMinutes = activePlaylist
    ? Math.round(
        activePlaylist.items.reduce(
          (acc, i) => acc + (i.mediaItem.duration || 0),
          0
        ) / 60
      )
    : 0;

  // Render poster collage for a playlist
  const renderCollage = (items: Playlist["items"]) => {
    const posters = items
      .map((i) => i.mediaItem.posterUrl || i.mediaItem.backdropUrl)
      .filter(Boolean)
      .slice(0, 4);

    if (posters.length === 0) {
      return (
        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-700">
          <Layers className="w-10 h-10" />
        </div>
      );
    }

    if (posters.length === 1) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posters[0]}
          alt="Poster"
          className="w-full h-full object-cover"
        />
      );
    }

    if (posters.length === 2 || posters.length === 3) {
      return (
        <div className="w-full h-full grid grid-cols-2 gap-0.5 bg-zinc-950">
          {posters.slice(0, 2).map((p, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={idx}
              src={p}
              alt="Poster"
              className="w-full h-full object-cover"
            />
          ))}
        </div>
      );
    }

    // 4-quadrant collage
    return (
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5 bg-zinc-950">
        {posters.map((p, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={idx}
            src={p}
            alt="Poster"
            className="w-full h-full object-cover"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white pb-20 pt-20 px-4 md:px-12 select-none">
      {/* Detail / Specific Playlist View */}
      {activePlaylist ? (
        <div className="animate-in fade-in duration-300">
          {/* Back button */}
          <button
            onClick={() => {
              setActivePlaylist(null);
              setIsEditingPlaylist(false);
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white mb-6 group transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to All Playlists</span>
          </button>

          {/* Playlist Hero Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 bg-gradient-to-t from-[#181818] via-zinc-900/60 to-transparent p-6 md:p-8 rounded-2xl border border-zinc-800 mb-8">
            {/* Collage Thumbnail Box */}
            <div className="w-36 h-36 md:w-48 md:h-48 rounded-xl overflow-hidden shadow-2xl shrink-0 border border-zinc-700/80 bg-zinc-900">
              {renderCollage(activePlaylist.items)}
            </div>

            {/* Info and Actions */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-[#3B82F6] uppercase tracking-wider mb-2">
                {activePlaylist.title.toLowerCase() === "my list" &&
                activePlaylist.profileId === activeProfile.id ? (
                  <>
                    <Bookmark className="w-4 h-4 fill-[#3B82F6]" />
                    <span>Default Watchlist</span>
                    <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-semibold">
                      My List
                    </span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Custom Playlist</span>
                  </>
                )}
                {activePlaylist.isPublic ? (
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-medium">
                    <Globe className="w-3 h-3" /> Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full font-medium">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
              </div>

              {isEditingPlaylist ? (
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-2xl md:text-3xl font-bold bg-zinc-800 border border-zinc-600 rounded px-3 py-1 outline-none text-white"
                  />
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Add an optional description..."
                    rows={2}
                    className="w-full text-xs bg-zinc-800 border border-zinc-600 rounded p-2 outline-none text-zinc-300"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-bold rounded"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditingPlaylist(false)}
                      className="px-3 py-1.5 border border-zinc-700 text-zinc-300 hover:text-white text-xs rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2 truncate">
                    {activePlaylist.title}
                  </h1>
                  {activePlaylist.description && (
                    <p className="text-xs md:text-sm text-zinc-300 mb-3 max-w-2xl line-clamp-2">
                      {activePlaylist.description}
                    </p>
                  )}
                </>
              )}

              {/* Metadata Stats */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mb-5">
                {activePlaylist.profile && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center text-[10px]"
                      style={{ backgroundColor: activePlaylist.profile.avatarColor }}
                    >
                      {renderProfileIcon(activePlaylist.profile.avatarIcon, "w-3 h-3")}
                    </div>
                    <span className="font-semibold text-zinc-300">
                      {activePlaylist.profile.name}
                    </span>
                  </div>
                )}
                <span>•</span>
                <span>
                  {activePlaylist.items.length} title
                  {activePlaylist.items.length === 1 ? "" : "s"}
                </span>
                {totalRuntimeMinutes > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {totalRuntimeMinutes}m total runtime
                    </span>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handlePlayAll(0)}
                  disabled={activePlaylist.items.length === 0}
                  className="px-6 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-sm font-bold flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Play All</span>
                </button>

                <button
                  onClick={() => setSharingPlaylist(activePlaylist)}
                  className="px-4 py-2.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-white text-sm font-semibold flex items-center gap-2 border border-zinc-700 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-[#3B82F6]" />
                  <span>Share Playlist</span>
                </button>

                {activePlaylist.profileId === activeProfile.id && (
                  <>
                    <button
                      onClick={() => {
                        setEditTitle(activePlaylist.title);
                        setEditDesc(activePlaylist.description || "");
                        setIsEditingPlaylist(true);
                      }}
                      className="px-3.5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 border border-zinc-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {activePlaylist.title.toLowerCase() !== "my list" && (
                      <button
                        onClick={() => handleDeletePlaylist(activePlaylist)}
                        className="px-3.5 py-2.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-200 text-xs font-medium flex items-center gap-1.5 border border-red-900/50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
              <span>Titles in this list</span>
              <span className="text-xs font-normal text-zinc-500">
                ({activePlaylist.items.length})
              </span>
            </h2>

            {activePlaylist.items.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800">
                <Film className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                <p className="text-sm">This playlist is currently empty.</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Right-click any title or open its details to add it here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activePlaylist.items.map((pi, idx) => {
                  const item = pi.mediaItem;
                  const isOwner = activePlaylist.profileId === activeProfile.id;

                  return (
                    <div
                      key={pi.id}
                      className="group flex items-center gap-3.5 p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                    >
                      {/* Index Number */}
                      <span className="w-6 text-center text-xs font-bold text-zinc-500 group-hover:text-white">
                        {idx + 1}
                      </span>

                      {/* Poster Box */}
                      <div
                        onClick={() => onPlayMedia(item)}
                        className="relative w-12 h-16 rounded overflow-hidden bg-zinc-800 shrink-0 cursor-pointer shadow group-hover:scale-105 transition-transform"
                      >
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
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            onClick={() => onSelectMediaDetails?.(item)}
                            className="text-sm font-bold text-white hover:text-[#3B82F6] cursor-pointer truncate"
                          >
                            {item.title}
                          </h3>
                          <span className="text-[10px] text-zinc-500 border border-zinc-800 px-1.5 py-0.2 rounded font-semibold uppercase">
                            {item.type}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                          <span>{item.releaseYear}</span>
                          <span>•</span>
                          <span>{item.genres}</span>
                          <span>•</span>
                          <span>{item.resolution}</span>
                        </div>
                      </div>

                      {/* Reorder and Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isOwner && (
                          <>
                            <button
                              onClick={() => handleMoveItem(idx, "up")}
                              disabled={idx === 0}
                              title="Move item up"
                              className="p-1.5 rounded hover:bg-zinc-850 text-zinc-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <MoveUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMoveItem(idx, "down")}
                              disabled={idx === activePlaylist.items.length - 1}
                              title="Move item down"
                              className="p-1.5 rounded hover:bg-zinc-850 text-zinc-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <MoveDown className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handlePlayAll(idx)}
                          title="Play starting here"
                          className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span className="hidden sm:inline">Play</span>
                        </button>

                        {isOwner && (
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            title="Remove from playlist"
                            className="p-1.5 rounded hover:bg-red-950/60 text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Playlists Grid View */
        <div className="animate-in fade-in duration-300">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-zinc-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#3B82F6] uppercase tracking-wider mb-1">
                <Layers className="w-4 h-4" />
                <span>Custom Lists</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                Playlists & Shared Lists
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Create themed movie marathons, binge-watch queues, and share
                them across profiles or devices.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold flex items-center gap-2 border border-zinc-700/80 transition-colors"
              >
                <Download className="w-4 h-4 text-[#3B82F6]" />
                <span>Import by Code</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-bold flex items-center gap-2 shadow transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Playlist</span>
              </button>
            </div>
          </div>

          {/* Playlists Grid */}
          {loading ? (
            <div className="py-24 flex items-center justify-center gap-3 text-sm text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin text-[#3B82F6]" />
              <span>Loading custom playlists...</span>
            </div>
          ) : playlists.length === 0 ? (
            <div className="py-24 text-center max-w-md mx-auto text-zinc-400 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 p-8">
              <ListPlus className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
              <h3 className="text-lg font-bold text-white mb-1">
                No Playlists Yet
              </h3>
              <p className="text-xs text-zinc-500 mb-6">
                Organize your favourite movies and TV shows into custom themed
                lists and share them with friends or family.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-bold inline-flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Playlist</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {playlists.map((playlist) => {
                const isOwner = playlist.profileId === activeProfile.id;
                const isMyList =
                  isOwner && playlist.title.toLowerCase() === "my list";

                return (
                  <div
                    key={playlist.id}
                    onClick={() => setActivePlaylist(playlist)}
                    className="group relative bg-[#181818] rounded-xl border border-zinc-800/80 hover:border-zinc-600 overflow-hidden shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col"
                  >
                    {/* Poster Collage Box */}
                    <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden border-b border-zinc-800/60">
                      {renderCollage(playlist.items)}

                      {/* Default List Badge */}
                      {isMyList && (
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="bg-[#2563EB] border border-blue-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                            <Bookmark className="w-3 h-3 fill-white" /> Default List
                          </span>
                        </div>
                      )}

                      {/* Play All overlay on hover */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePlaylist(playlist);
                            if (playlist.items.length > 0) {
                              const queue = playlist.items.map((i) => i.mediaItem);
                              onPlayMedia(queue[0], queue.slice(1));
                            }
                          }}
                          className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Play className="w-5 h-5 fill-black ml-0.5" />
                        </button>
                      </div>

                      {/* Visibility badge */}
                      <div className="absolute top-2.5 right-2.5">
                        {playlist.isPublic ? (
                          <span className="bg-black/70 backdrop-blur-sm border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Public
                          </span>
                        ) : (
                          <span className="bg-black/70 backdrop-blur-sm border border-zinc-700 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Private
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-white group-hover:text-[#3B82F6] truncate transition-colors flex items-center gap-1.5">
                          {isMyList && (
                            <Bookmark className="w-3.5 h-3.5 text-[#3B82F6] fill-[#3B82F6] shrink-0" />
                          )}
                          <span className="truncate">{playlist.title}</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                          {playlist.description ||
                            `${playlist.items.length} titles`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500">
                        <div className="flex items-center gap-2 truncate">
                          {playlist.profile && (
                            <div
                              className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[8px]"
                              style={{ backgroundColor: playlist.profile.avatarColor }}
                            >
                              {renderProfileIcon(playlist.profile.avatarIcon, "w-2.5 h-2.5")}
                            </div>
                          )}
                          <span className="truncate">
                            {isOwner ? "By You" : playlist.profile?.name || "Shared"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSharingPlaylist(playlist);
                            }}
                            title="Share Playlist"
                            className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <span>{playlist.items.length} items</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#181818] border border-zinc-800 text-white rounded-xl max-w-md w-full p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5 mb-5">
              <div className="flex items-center gap-2.5">
                <ListPlus className="w-5 h-5 text-[#3B82F6]" />
                <h2 className="text-lg font-bold">New Custom Playlist</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                  Playlist Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 80s Sci-Fi Classics"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#3B82F6] rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What's the vibe or theme of this list?"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#3B82F6] rounded-lg p-3 text-xs text-white placeholder-zinc-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                <div>
                  <div className="text-xs font-semibold">Allow Sharing</div>
                  <div className="text-[11px] text-zinc-400">
                    Anyone with the share link can view and import this list
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newIsPublic}
                  onChange={(e) => setNewIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-[#2563EB] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Playlist</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import by Code Modal */}
      {showImportModal && (
        <div
          onClick={() => setShowImportModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#181818] border border-zinc-800 text-white rounded-xl max-w-md w-full p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5 mb-5">
              <div className="flex items-center gap-2.5">
                <Download className="w-5 h-5 text-[#3B82F6]" />
                <h2 className="text-lg font-bold">Import Shared Playlist</h2>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importError && (
              <div className="mb-4 px-3 py-2 bg-red-950/80 border border-red-700/70 rounded-lg text-xs text-red-200">
                {importError}
              </div>
            )}

            <form onSubmit={handleImportByCode} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                  Share Code or Full Link
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value)}
                  placeholder="e.g. list-k9x2 or http://.../?playlist=..."
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#3B82F6] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 font-mono outline-none"
                />
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Paste the unique share code or web link shared by another
                profile or device to instantly view and save their custom list.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || !importCode.trim()}
                  className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow"
                >
                  {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Import Playlist</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {sharingPlaylist && (
        <SharePlaylistModal
          playlist={sharingPlaylist}
          onClose={() => setSharingPlaylist(null)}
          onPlaylistUpdated={(updated) => {
            setSharingPlaylist(updated);
            setPlaylists((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            );
            if (activePlaylist?.id === updated.id) {
              setActivePlaylist(updated);
            }
          }}
        />
      )}
    </div>
  );
}

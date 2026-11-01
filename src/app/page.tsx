"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Profile, MediaItem, Episode } from "@/types/ownflix";
import ProfileGate, { renderProfileIcon } from "@/components/ProfileGate";
import Navbar, { NavCategory } from "@/components/Navbar";
import HeroBillboard from "@/components/HeroBillboard";
import MediaRow from "@/components/MediaRow";
import DetailModal from "@/components/DetailModal";
import NetflixPlayer from "@/components/NetflixPlayer";
import AdminDashboardModal from "@/components/AdminDashboardModal";
import ProfileAccountModal from "@/components/ProfileAccountModal";
import IdentifyMetadataModal from "@/components/IdentifyMetadataModal";
import PlaylistsView from "@/components/PlaylistsView";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import FirstSetupWizard from "@/components/FirstSetupWizard";
import {
  HardDrive,
  Play,
  Plus,
  Check,
  Info,
  FolderSync,
  Lock,
  X,
  Eye,
  EyeOff,
  MoreVertical,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ListPlus,
  Trash2,
  AlertTriangle,
} from "lucide-react";

export default function OwnFlixApp() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState<NavCategory>("HOME");
  const [searchQuery, setSearchQuery] = useState("");

  // Active modals / player state
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [playingState, setPlayingState] = useState<{
    item: MediaItem;
    episode?: Episode;
    startFromBeginning?: boolean;
    roomId?: string | null;
    queue?: MediaItem[];
  } | null>(null);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const [pendingPlaylistCode, setPendingPlaylistCode] = useState<string | null>(null);
  const [addToPlaylistItem, setAddToPlaylistItem] = useState<MediaItem | null>(null);

  const [adminModal, setAdminModal] = useState<{
    open: boolean;
    tab: "profiles" | "activity" | "folders" | "media";
    editItem?: MediaItem | null;
  }>({ open: false, tab: "profiles", editItem: null });

  const [accountModalOpen, setAccountModalOpen] = useState(false);

  // Emby-style Movie Context Menu & Identify Metadata Modal state
  const [contextMenu, setContextMenu] = useState<{
    item: MediaItem;
    x: number;
    y: number;
  } | null>(null);
  const [identifyItem, setIdentifyItem] = useState<MediaItem | null>(null);
  const [refreshingItemId, setRefreshingItemId] = useState<string | null>(null);

  // Password prompt when switching to a locked profile from Navbar
  const [pendingSwitchProfile, setPendingSwitchProfile] =
    useState<Profile | null>(null);
  const [switchPassword, setSwitchPassword] = useState("");
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [verifyingSwitch, setVerifyingSwitch] = useState(false);
  const [showSwitchPass, setShowSwitchPass] = useState(false);

  const [knownProfileIds, setKnownProfileIds] = useState<string[]>([]);

  const handleSelectProfile = useCallback((profile: Profile | null) => {
    setActiveProfile(profile);
    if (typeof window !== "undefined") {
      if (profile) {
        window.localStorage.setItem("ownflix_active_profile_id", profile.id);
        setKnownProfileIds((prev) => {
          const next = Array.from(new Set([...prev, profile.id]));
          window.localStorage.setItem(
            "ownflix_known_profile_ids",
            JSON.stringify(next)
          );
          return next;
        });
        fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId: profile.id,
            action: "PROFILE_LOGIN",
            details: `Signed into profile "${profile.name}"`,
          }),
        }).catch(() => {});
      } else {
        window.localStorage.removeItem("ownflix_active_profile_id");
      }
    }
  }, []);

  const handleForgetProfile = useCallback((profileId: string) => {
    setKnownProfileIds((prev) => {
      const next = prev.filter((id) => id !== profileId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "ownflix_known_profile_ids",
          JSON.stringify(next)
        );
      }
      return next;
    });
  }, []);

  const fetchProfiles = useCallback(async () => {
    const res = await fetch("/api/profiles");
    if (res.ok) {
      const data = await res.json();
      const loadedProfiles: Profile[] = data.profiles || [];
      setProfiles(loadedProfiles);

      if (typeof window !== "undefined") {
        const savedId = window.localStorage.getItem(
          "ownflix_active_profile_id"
        );
        let parsedKnown: string[] = [];
        try {
          const rawKnown = window.localStorage.getItem(
            "ownflix_known_profile_ids"
          );
          if (rawKnown) {
            parsedKnown = JSON.parse(rawKnown);
          }
        } catch {
          parsedKnown = [];
        }

        if (savedId && !parsedKnown.includes(savedId)) {
          parsedKnown.push(savedId);
          window.localStorage.setItem(
            "ownflix_known_profile_ids",
            JSON.stringify(parsedKnown)
          );
        }

        setKnownProfileIds(parsedKnown);

        if (savedId) {
          const matched = loadedProfiles.find((p) => p.id === savedId);
          if (matched) {
            setActiveProfile(matched);
          }
        }
      }
    }
  }, []);

  // Only show profiles that the user has logged into on this browser
  const visibleProfiles = useMemo(
    () => profiles.filter((p) => knownProfileIds.includes(p.id)),
    [profiles, knownProfileIds]
  );

  const fetchMedia = useCallback(async (profileId?: string) => {
    const pid = profileId || "";
    const res = await fetch(
      `/api/media${pid ? `?profileId=${encodeURIComponent(pid)}` : ""}`
    );
    if (res.ok) {
      const data = await res.json();
      setMedia(data.media || []);
    }
  }, []);

  useEffect(() => {
    fetchProfiles().finally(() => setLoading(false));
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roomCode = params.get("room");
      if (roomCode) {
        setPendingRoomId(roomCode.toUpperCase());
      }
      const playlistCode = params.get("playlist") || params.get("shareCode");
      if (playlistCode) {
        setActiveCategory("PLAYLISTS");
        setPendingPlaylistCode(playlistCode);
      }
    }
  }, [fetchProfiles]);

  useEffect(() => {
    if (activeProfile) {
      fetchMedia(activeProfile.id);
    }
  }, [activeProfile, fetchMedia]);

  // Automatically join Watch Together room from ?room=XXXXXX share link
  useEffect(() => {
    if (!pendingRoomId || !activeProfile || media.length === 0) return;

    const joinSharedRoom = async () => {
      try {
        const res = await fetch(
          `/api/rooms?roomId=${encodeURIComponent(pendingRoomId)}`
        );
        if (res.ok) {
          const data = await res.json();
          const room = data.room;
          if (room) {
            const matchedItem = media.find((m) => m.id === room.mediaItemId);
            if (matchedItem) {
              const matchedEpisode = room.episodeId
                ? matchedItem.episodes.find((ep) => ep.id === room.episodeId)
                : undefined;
              setPlayingState({
                item: matchedItem,
                episode: matchedEpisode,
                roomId: room.id,
              });
            }
          }
        }
      } finally {
        setPendingRoomId(null);
      }
    };

    joinSharedRoom();
  }, [pendingRoomId, activeProfile, media]);

  // Keep detailItem synced when media state refreshes
  useEffect(() => {
    if (detailItem) {
      const updated = media.find((m) => m.id === detailItem.id);
      if (updated) setDetailItem(updated);
    }
  }, [media, detailItem]);

  const handleToggleMyList = async (item: MediaItem) => {
    if (!activeProfile) return;
    // Optimistic UI update
    setMedia((prev) =>
      prev.map((m) =>
        m.id === item.id ? { ...m, inMyList: !m.inMyList } : m
      )
    );
    await fetch("/api/mylist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId: activeProfile.id,
        mediaItemId: item.id,
      }),
    });
    await fetchMedia(activeProfile.id);
  };

  const handleRemoveContinueWatching = async (item: MediaItem) => {
    if (!activeProfile) return;
    setMedia((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, progress: null } : m))
    );
    await fetch(
      `/api/progress?profileId=${encodeURIComponent(
        activeProfile.id
      )}&mediaItemId=${encodeURIComponent(item.id)}`,
      { method: "DELETE" }
    );
    await fetchMedia(activeProfile.id);
  };

  const handleToggleMarkDeletion = async (item: MediaItem) => {
    const nextMarked = !item.markedForDeletion;
    // Optimistic local update
    setMedia((prev) =>
      prev.map((m) =>
        m.id === item.id
          ? {
              ...m,
              markedForDeletion: nextMarked,
              markedForDeletionAt: nextMarked ? new Date().toISOString() : null,
              markedForDeletionBy: nextMarked
                ? activeProfile?.name || "User"
                : null,
            }
          : m
      )
    );
    if (detailItem && detailItem.id === item.id) {
      setDetailItem((prev) =>
        prev
          ? {
              ...prev,
              markedForDeletion: nextMarked,
              markedForDeletionAt: nextMarked ? new Date().toISOString() : null,
              markedForDeletionBy: nextMarked
                ? activeProfile?.name || "User"
                : null,
            }
          : prev
      );
    }
    if (contextMenu && contextMenu.item.id === item.id) {
      setContextMenu((prev) =>
        prev
          ? {
              ...prev,
              item: {
                ...prev.item,
                markedForDeletion: nextMarked,
                markedForDeletionAt: nextMarked ? new Date().toISOString() : null,
                markedForDeletionBy: nextMarked
                  ? activeProfile?.name || "User"
                  : null,
              },
            }
          : prev
      );
    }
    try {
      await fetch(`/api/media/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markedForDeletion: nextMarked,
          profileName: activeProfile?.name || "User",
          profileId: activeProfile?.id,
        }),
      });
      if (activeProfile) {
        await fetchMedia(activeProfile.id);
      }
    } catch (err) {
      console.error("Failed to toggle mark for deletion:", err);
    }
  };

  const handlePlay = (
    item: MediaItem,
    episode?: Episode,
    startFromBeginning = false,
    queue: MediaItem[] = []
  ) => {
    setDetailItem(null);
    setContextMenu(null);
    setPlayingState({ item, episode, startFromBeginning, queue });
    if (activeProfile) {
      const epLabel = episode
        ? ` (S${episode.seasonNumber}:E${episode.episodeNumber} "${episode.title}")`
        : "";
      fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: activeProfile.id,
          action: "PLAY_START",
          details: `Started playing "${item.title}"${epLabel}`,
          mediaItemId: item.id,
          mediaTitle: item.title,
        }),
      }).catch(() => {});
    }
  };

  const handleOpenContextMenu = useCallback(
    (item: MediaItem, x: number, y: number) => {
      const menuWidth = 250;
      const menuHeight = 290;
      const clampedX =
        typeof window !== "undefined"
          ? Math.min(Math.max(12, x), window.innerWidth - menuWidth - 12)
          : x;
      const clampedY =
        typeof window !== "undefined"
          ? Math.min(Math.max(12, y), window.innerHeight - menuHeight - 12)
          : y;
      setContextMenu({ item, x: clampedX, y: clampedY });
    },
    []
  );

  const handleQuickRefreshMetadata = async (item: MediaItem) => {
    setContextMenu(null);
    setRefreshingItemId(item.id);
    try {
      const res = await fetch("/api/imdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaItemId: item.id,
          query: item.title,
        }),
      });
      if (res.ok && activeProfile) {
        await fetchMedia(activeProfile.id);
      }
    } finally {
      setRefreshingItemId(null);
    }
  };

  // Close context menu on Escape or scroll
  useEffect(() => {
    if (!contextMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    const handleScroll = () => setContextMenu(null);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [contextMenu]);

  // Filter catalog by Kids mode if activeProfile.isKids
  const profileFilteredMedia = useMemo(() => {
    if (!activeProfile?.isKids) return media;
    return media.filter((m) =>
      ["G", "PG", "PG-13", "TV-Y", "TV-G", "TV-PG", "TV-14"].includes(
        m.maturityRating
      )
    );
  }, [media, activeProfile]);

  // Category & Search filtering
  const categoryMedia = useMemo(() => {
    if (activeCategory === "SERIES") {
      return profileFilteredMedia.filter((m) => m.type === "SERIES");
    }
    if (activeCategory === "MOVIES") {
      return profileFilteredMedia.filter((m) => m.type === "MOVIE");
    }
    if (activeCategory === "LOCAL") {
      return profileFilteredMedia.filter(
        (m) =>
          Boolean(m.filePath) || m.episodes.some((ep) => Boolean(ep.filePath))
      );
    }
    if (activeCategory === "MY_LIST") {
      return profileFilteredMedia.filter((m) => m.inMyList);
    }
    return profileFilteredMedia;
  }, [profileFilteredMedia, activeCategory]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return profileFilteredMedia.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.genres.toLowerCase().includes(q) ||
        m.cast.toLowerCase().includes(q) ||
        m.overview.toLowerCase().includes(q)
    );
  }, [profileFilteredMedia, searchQuery]);

  // Featured Billboard item
  const billboardItem = useMemo(() => {
    if (categoryMedia.length === 0) return profileFilteredMedia[0] || null;
    return (
      categoryMedia.find((m) => m.isFeatured) ||
      categoryMedia[0] ||
      null
    );
  }, [categoryMedia, profileFilteredMedia]);

  // Row groupings for Home / Category view
  const continueWatchingItems = useMemo(
    () =>
      profileFilteredMedia
        .filter(
          (m) =>
            m.progress &&
            m.progress.positionSeconds > 0 &&
            !m.progress.completed
        )
        .sort((a, b) => {
          const tA = a.progress?.updatedAt
            ? new Date(a.progress.updatedAt).getTime()
            : 0;
          const tB = b.progress?.updatedAt
            ? new Date(b.progress.updatedAt).getTime()
            : 0;
          return tB - tA;
        }),
    [profileFilteredMedia]
  );

  const myListItems = useMemo(
    () => profileFilteredMedia.filter((m) => m.inMyList),
    [profileFilteredMedia]
  );

  const localDiskItems = useMemo(
    () =>
      profileFilteredMedia.filter(
        (m) =>
          Boolean(m.filePath) || m.episodes.some((ep) => Boolean(ep.filePath))
      ),
    [profileFilteredMedia]
  );

  const seriesItems = useMemo(
    () => profileFilteredMedia.filter((m) => m.type === "SERIES"),
    [profileFilteredMedia]
  );

  const sciFiItems = useMemo(
    () =>
      profileFilteredMedia.filter((m) =>
        m.genres.toLowerCase().includes("sci-fi")
      ),
    [profileFilteredMedia]
  );

  const actionItems = useMemo(
    () =>
      profileFilteredMedia.filter(
        (m) =>
          m.genres.toLowerCase().includes("action") ||
          m.genres.toLowerCase().includes("adventure") ||
          m.genres.toLowerCase().includes("thriller")
      ),
    [profileFilteredMedia]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center gap-4">
        <span className="text-[#2563EB] font-black text-4xl tracking-tighter animate-pulse">
          OWNFLIX+
        </span>
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 0. Prompt for First-Time Setup if server has 0 profiles
  if (!loading && profiles.length === 0) {
    return (
      <FirstSetupWizard
        onSetupComplete={async (adminProfile) => {
          await fetchProfiles();
          handleSelectProfile(adminProfile);
        }}
      />
    );
  }

  // 1. Show "Who's Watching?" Profile Gate if no profile is selected
  if (!activeProfile) {
    return (
      <ProfileGate
        profiles={visibleProfiles}
        onSelectProfile={(profile) => handleSelectProfile(profile)}
        onForgetProfile={handleForgetProfile}
        onProfilesChanged={fetchProfiles}
      />
    );
  }

  // 2. Full-Screen Custom Video Player
  if (playingState) {
    return (
      <NetflixPlayer
        item={playingState.item}
        initialEpisode={playingState.episode}
        startFromBeginning={playingState.startFromBeginning}
        initialRoomId={playingState.roomId}
        activeProfile={activeProfile}
        playlistQueue={playingState.queue || []}
        onToggleMarkDeletion={handleToggleMarkDeletion}
        onPlayNextFromQueue={(nextItem, remainingQueue) => {
          setPlayingState({
            item: nextItem,
            episode: undefined,
            startFromBeginning: true,
            queue: remainingQueue,
          });
        }}
        onClose={() => {
          setPlayingState(null);
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (url.searchParams.has("room")) {
              url.searchParams.delete("room");
              window.history.replaceState({}, "", url.toString());
            }
          }
        }}
        onProgressUpdated={() => fetchMedia(activeProfile.id)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white pb-20">
      {/* Top Sticky Netflix Navbar */}
      <Navbar
        activeProfile={activeProfile}
        profiles={visibleProfiles}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => setActiveCategory(cat)}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        onSwitchProfile={(p) => {
          if (p.id === activeProfile.id) return;
          if (p.hasPassword) {
            setPendingSwitchProfile(p);
            setSwitchPassword("");
            setSwitchError(null);
            setShowSwitchPass(false);
          } else {
            handleSelectProfile(p);
          }
        }}
        onManageProfiles={() => handleSelectProfile(null)}
        onOpenAccountSettings={() => setAccountModalOpen(true)}
        onOpenAdmin={(tab = "profiles") =>
          setAdminModal({ open: true, tab, editItem: null })
        }
      />

      {/* Search Results Grid OR Category / Home View */}
      {searchQuery.trim() ? (
        <main className="pt-28 px-4 md:px-12">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-zinc-200">
            Search results for &ldquo;{searchQuery}&rdquo; (
            {searchResults.length})
          </h2>

          {searchResults.length === 0 ? (
            <div className="py-20 text-center text-zinc-400">
              No titles matched &ldquo;{searchQuery}&rdquo;. Try searching by
              genre (e.g. Sci-Fi, Action) or scan your local media folders.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setDetailItem(item)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenContextMenu(item, e.clientX, e.clientY);
                  }}
                  className="group bg-[#181818] rounded-md overflow-hidden border border-zinc-800 hover:border-zinc-500 transition-all hover:scale-105 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-[2/3] bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.posterUrl || item.backdropUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.markedForDeletion && (
                      <div
                        title={`Marked for deletion${item.markedForDeletionBy ? ` by ${item.markedForDeletionBy}` : ""}`}
                        className="absolute top-2 left-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950/90 text-red-200 border border-red-700/80 shadow-md backdrop-blur-sm"
                      >
                        <Trash2 className="w-2.5 h-2.5 text-red-400" />
                        <span>Marked for removal</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenContextMenu(item, e.clientX, e.clientY);
                      }}
                      title="More options / Identify metadata"
                      className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/75 hover:bg-[#2563EB] text-zinc-200 hover:text-white border border-zinc-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlay(item);
                        }}
                        className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg"
                      >
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-white truncate">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                      <span className="text-[#46d369] font-semibold">
                        {item.matchScore}% Match
                      </span>
                      <span>{item.releaseYear}</span>
                      <span className="border border-zinc-700 px-1 text-[10px]">
                        {item.maturityRating}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      ) : activeCategory === "PLAYLISTS" || activeCategory === "MY_LIST" ? (
        <PlaylistsView
          activeProfile={activeProfile}
          onPlayMedia={(item, queue) => {
            handlePlay(item, undefined, false, queue);
          }}
          onSelectMediaDetails={(item) => setDetailItem(item)}
          initialShareCode={pendingPlaylistCode}
        />
      ) : activeCategory === "LOCAL" ? (
        <main className="pt-28 px-4 md:px-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Local Disk Library (Direct Range &amp; FFmpeg Remux)
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Video files (.mp4, .mkv, .webm, .avi) indexed directly from your local folders.
              </p>
            </div>

            <button
              onClick={() =>
                setAdminModal({ open: true, tab: "folders", editItem: null })
              }
              className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#3B82F6] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded transition-colors self-start"
            >
              <FolderSync className="w-4 h-4" />
              <span>Add / Scan Local Folders</span>
            </button>
          </div>

          {categoryMedia.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center max-w-xl mx-auto my-12">
              <HardDrive className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-1">
                No local files indexed yet
              </h3>
              <p className="text-sm text-zinc-400 mb-5">
                Add a folder path in the Library Manager to index MP4 and MKV files from your computer.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {categoryMedia.map((item) => (
                <div
                  key={item.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenContextMenu(item, e.clientX, e.clientY);
                  }}
                  className="bg-[#181818] border border-zinc-800 hover:border-zinc-600 rounded-lg overflow-hidden flex flex-col transition-transform hover:scale-[1.03]"
                >
                  <div
                    onClick={() => handlePlay(item)}
                    className="relative aspect-[2/3] bg-zinc-900 cursor-pointer group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.posterUrl || item.backdropUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.markedForDeletion && (
                      <div
                        title={`Marked for deletion${item.markedForDeletionBy ? ` by ${item.markedForDeletionBy}` : ""}`}
                        className="absolute top-2 left-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950/90 text-red-200 border border-red-700/80 shadow-md backdrop-blur-sm"
                      >
                        <Trash2 className="w-2.5 h-2.5 text-red-400" />
                        <span>Marked for removal</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenContextMenu(item, e.clientX, e.clientY);
                      }}
                      title="More options / Identify metadata"
                      className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/75 hover:bg-[#2563EB] text-zinc-200 hover:text-white border border-zinc-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 fill-black ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white truncate mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                        {item.overview}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePlay(item)}
                          className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-black" />
                          <span>Play</span>
                        </button>
                        <button
                          onClick={() => handleToggleMyList(item)}
                          className="p-1 rounded border border-zinc-600 hover:border-white text-white"
                        >
                          {item.inMyList ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => setDetailItem(item)}
                        className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Info</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      ) : (
        /* Standard Netflix Billboard + Horizontal Carousels */
        <>
          {billboardItem && (
            <HeroBillboard
              item={billboardItem}
              onPlay={(item) => handlePlay(item)}
              onMoreInfo={(item) => setDetailItem(item)}
              onToggleMyList={handleToggleMyList}
            />
          )}

          <main className="relative z-20 -mt-16 md:-mt-28 space-y-2">
            {continueWatchingItems.length > 0 && (
              <MediaRow
                title={`Continue Watching for ${activeProfile.name}`}
                items={continueWatchingItems}
                isContinueWatching
                onPlay={(item) => handlePlay(item)}
                onMoreInfo={(item) => setDetailItem(item)}
                onToggleMyList={handleToggleMyList}
                onRemoveContinueWatching={handleRemoveContinueWatching}
                onOpenContextMenu={handleOpenContextMenu}
              />
            )}

            {localDiskItems.length > 0 && (
              <MediaRow
                title="Streamed from Your Local Disk"
                subtitle="Direct HTTP 206 Range & FFmpeg Live MKV Remux"
                items={localDiskItems}
                onPlay={(item) => handlePlay(item)}
                onMoreInfo={(item) => setDetailItem(item)}
                onToggleMyList={handleToggleMyList}
                onOpenContextMenu={handleOpenContextMenu}
              />
            )}

            <MediaRow
              title="Trending Now"
              items={categoryMedia}
              onPlay={(item) => handlePlay(item)}
              onMoreInfo={(item) => setDetailItem(item)}
              onToggleMyList={handleToggleMyList}
              onOpenContextMenu={handleOpenContextMenu}
            />

            {myListItems.length > 0 && (
              <MediaRow
                title="My List"
                items={myListItems}
                onPlay={(item) => handlePlay(item)}
                onMoreInfo={(item) => setDetailItem(item)}
                onToggleMyList={handleToggleMyList}
                onOpenContextMenu={handleOpenContextMenu}
              />
            )}

            {seriesItems.length > 0 && activeCategory !== "MOVIES" && (
              <MediaRow
                title="Binge-Worthy TV Series"
                subtitle="Multi-Episode Auto-Play & Skip Intro"
                items={seriesItems}
                onPlay={(item) => handlePlay(item)}
                onMoreInfo={(item) => setDetailItem(item)}
                onToggleMyList={handleToggleMyList}
                onOpenContextMenu={handleOpenContextMenu}
              />
            )}

            {sciFiItems.length > 0 && (
              <MediaRow
                title="Sci-Fi & Cyberpunk Worlds"
                items={sciFiItems}
                onPlay={(item) => handlePlay(item)}
                onMoreInfo={(item) => setDetailItem(item)}
                onToggleMyList={handleToggleMyList}
                onOpenContextMenu={handleOpenContextMenu}
              />
            )}

            {actionItems.length > 0 && (
              <MediaRow
                title="High-Octane Action & Thrillers"
                items={actionItems}
                onPlay={(item) => handlePlay(item)}
                onMoreInfo={(item) => setDetailItem(item)}
                onToggleMyList={handleToggleMyList}
                onOpenContextMenu={handleOpenContextMenu}
              />
            )}
          </main>
        </>
      )}

      {/* Detail / Episodes Modal */}
      {detailItem && (
        <DetailModal
          item={detailItem}
          allMedia={profileFilteredMedia}
          onClose={() => setDetailItem(null)}
          onPlay={(item, ep, fromStart) => handlePlay(item, ep, fromStart)}
          onToggleMyList={handleToggleMyList}
          onToggleMarkDeletion={handleToggleMarkDeletion}
          onSelectMedia={(item) => setDetailItem(item)}
          onEditItem={(item) => {
            setDetailItem(null);
            setAdminModal({ open: true, tab: "media", editItem: item });
          }}
          onIdentifyItem={(item) => {
            setDetailItem(null);
            setIdentifyItem(item);
          }}
          onAddToPlaylist={(item) => setAddToPlaylistItem(item)}
        />
      )}

      {/* Emby-Style Movie Context Menu */}
      {contextMenu && (
        <div
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu(null);
          }}
          className="fixed inset-0 z-[55]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
              backgroundColor: "#181818",
            }}
            className="fixed w-64 bg-[#181818] border border-zinc-700 rounded-xl shadow-[0_18px_45px_rgba(0,0,0,0.9)] py-1.5 text-sm text-zinc-200 select-none overflow-hidden"
          >
            {/* Context Menu Movie Header */}
            <div className="px-3.5 py-2 border-b border-zinc-800 bg-[#141414] flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={contextMenu.item.posterUrl || contextMenu.item.backdropUrl}
                alt={contextMenu.item.title}
                className="w-8 h-11 rounded object-cover bg-zinc-900 shrink-0 border border-zinc-700"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white text-xs truncate">
                  {contextMenu.item.title}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {contextMenu.item.releaseYear} &bull;{" "}
                  {contextMenu.item.type === "SERIES" ? "Series" : "Movie"}
                </div>
              </div>
            </div>

            {/* Playback & Info */}
            <div className="py-1 border-b border-zinc-800/80">
              <button
                onClick={() => handlePlay(contextMenu.item)}
                className="w-full px-3.5 py-2 text-left text-xs font-medium hover:bg-zinc-800/90 flex items-center gap-2.5 text-white transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>Play</span>
              </button>
              <button
                onClick={() => {
                  const target = contextMenu.item;
                  setContextMenu(null);
                  setDetailItem(target);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium hover:bg-zinc-800/90 flex items-center gap-2.5 text-zinc-200 transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-zinc-400" />
                <span>View Details</span>
              </button>
              <button
                onClick={() => {
                  const target = contextMenu.item;
                  setContextMenu(null);
                  handleToggleMyList(target);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium hover:bg-zinc-800/90 flex items-center gap-2.5 text-zinc-200 transition-colors"
              >
                {contextMenu.item.inMyList ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>Remove from My List</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Add to My List</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  const target = contextMenu.item;
                  setContextMenu(null);
                  setAddToPlaylistItem(target);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium hover:bg-zinc-800/90 flex items-center gap-2.5 text-zinc-200 transition-colors"
              >
                <ListPlus className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>Add to Playlist...</span>
              </button>
              <button
                onClick={() => {
                  const target = contextMenu.item;
                  setContextMenu(null);
                  handleToggleMarkDeletion(target);
                }}
                className={`w-full px-3.5 py-2 text-left text-xs font-medium hover:bg-zinc-800/90 flex items-center gap-2.5 transition-colors ${
                  contextMenu.item.markedForDeletion
                    ? "text-red-400 hover:text-red-300"
                    : "text-zinc-200"
                }`}
              >
                <Trash2
                  className={`w-3.5 h-3.5 ${
                    contextMenu.item.markedForDeletion
                      ? "text-red-400"
                      : "text-zinc-400"
                  }`}
                />
                <span>
                  {contextMenu.item.markedForDeletion
                    ? "Unmark from Deletion"
                    : "Mark for Deletion (Watched Once)"}
                </span>
              </button>
            </div>

            {/* Emby Metadata Actions */}
            <div className="py-1">
              <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Metadata &amp; Artwork
              </div>
              <button
                onClick={() => {
                  const target = contextMenu.item;
                  setContextMenu(null);
                  setIdentifyItem(target);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-[#2563EB]/20 text-[#3B82F6] hover:text-blue-300 flex items-center gap-2.5 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>Identify / Search Metadata...</span>
              </button>
              <button
                onClick={() => handleQuickRefreshMetadata(contextMenu.item)}
                disabled={refreshingItemId === contextMenu.item.id}
                className="w-full px-3.5 py-2 text-left text-xs font-medium hover:bg-zinc-800/90 flex items-center gap-2.5 text-zinc-200 transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-amber-400 ${
                    refreshingItemId === contextMenu.item.id
                      ? "animate-spin"
                      : ""
                  }`}
                />
                <span>Refresh Metadata (Auto IMDb)</span>
              </button>
              <button
                onClick={() => {
                  const target = contextMenu.item;
                  setContextMenu(null);
                  setAdminModal({ open: true, tab: "media", editItem: target });
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium hover:bg-zinc-800/90 flex items-center gap-2.5 text-zinc-200 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                <span>Edit Metadata Fields...</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emby-Style Identify / Search Metadata Modal */}
      {identifyItem && (
        <IdentifyMetadataModal
          item={identifyItem}
          onClose={() => setIdentifyItem(null)}
          onUpdated={() => fetchMedia(activeProfile.id)}
          onOpenManualEditor={(item) => {
            setIdentifyItem(null);
            setAdminModal({ open: true, tab: "media", editItem: item });
          }}
        />
      )}

      {/* Admin Library & Metadata Manager Modal */}
      {adminModal.open && (
        <AdminDashboardModal
          initialTab={adminModal.tab}
          initialEditItem={adminModal.editItem}
          media={media}
          onClose={() =>
            setAdminModal({ open: false, tab: "profiles", editItem: null })
          }
          onLibraryUpdated={() => fetchMedia(activeProfile.id)}
          onProfilesUpdated={fetchProfiles}
        />
      )}

      {/* Profile Account & Password Settings Modal */}
      {accountModalOpen && (
        <ProfileAccountModal
          profile={activeProfile}
          onClose={() => setAccountModalOpen(false)}
          onProfileUpdated={async (updated) => {
            setActiveProfile(updated);
            await fetchProfiles();
          }}
        />
      )}

      {/* Password Prompt Modal when switching to a locked profile from Navbar */}
      {pendingSwitchProfile && (
        <div
          onClick={() => setPendingSwitchProfile(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={async (e) => {
              e.preventDefault();
              setVerifyingSwitch(true);
              setSwitchError(null);
              try {
                const res = await fetch("/api/profiles/auth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    profileId: pendingSwitchProfile.id,
                    password: switchPassword,
                  }),
                });
                const data = await res.json();
                if (!res.ok) {
                  setSwitchError(data.error || "Incorrect password");
                } else {
                  const target = pendingSwitchProfile;
                  setPendingSwitchProfile(null);
                  setSwitchPassword("");
                  handleSelectProfile(target);
                }
              } finally {
                setVerifyingSwitch(false);
              }
            }}
            className="bg-[#181818] border border-zinc-800 rounded-xl max-w-md w-full p-6 md:p-8 shadow-2xl text-center"
          >
            <div className="flex justify-end -mt-2 -mr-2">
              <button
                type="button"
                onClick={() => setPendingSwitchProfile(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="w-20 h-20 rounded-md flex items-center justify-center mx-auto mb-4 shadow-lg relative"
              style={{
                background: `linear-gradient(145deg, ${pendingSwitchProfile.avatarColor}, #111111 150%)`,
              }}
            >
              {renderProfileIcon(pendingSwitchProfile.avatarIcon, "w-14 h-14")}
              <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#2563EB] border-2 border-[#181818] flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-white" />
              </span>
            </div>

            <div className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-1">
              Profile Lock is ON
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              Enter password to switch to {pendingSwitchProfile.name}
            </h2>

            {switchError && (
              <div className="mb-4 px-3 py-2 bg-red-950/80 border border-red-700/70 rounded text-xs text-red-200">
                {switchError}
              </div>
            )}

            <div className="relative mb-6">
              <input
                type={showSwitchPass ? "text" : "password"}
                value={switchPassword}
                onChange={(e) => setSwitchPassword(e.target.value)}
                placeholder="Enter profile password"
                autoFocus
                required
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded px-4 py-3 text-white text-center tracking-wider outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSwitchPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showSwitchPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPendingSwitchProfile(null)}
                className="px-5 py-2.5 text-sm border border-zinc-600 text-zinc-300 hover:border-white hover:text-white rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verifyingSwitch}
                className="px-7 py-2.5 text-sm bg-[#2563EB] hover:bg-[#3B82F6] text-white font-bold rounded transition-colors"
              >
                {verifyingSwitch ? "Verifying..." : "Unlock Profile"}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Add To Custom Playlist Modal */}
      {addToPlaylistItem && activeProfile && (
        <AddToPlaylistModal
          item={addToPlaylistItem}
          activeProfile={activeProfile}
          onClose={() => setAddToPlaylistItem(null)}
          onPlaylistUpdated={() => fetchMedia(activeProfile.id)}
        />
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Profile, MediaItem, Episode } from "@/types/ownflix";
import ProfileGate from "@/components/ProfileGate";
import Navbar, { NavCategory } from "@/components/Navbar";
import HeroBillboard from "@/components/HeroBillboard";
import MediaRow from "@/components/MediaRow";
import DetailModal from "@/components/DetailModal";
import NetflixPlayer from "@/components/NetflixPlayer";
import AdminDashboardModal from "@/components/AdminDashboardModal";
import { HardDrive, Play, Plus, Check, Info, FolderSync } from "lucide-react";

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
  } | null>(null);

  const [adminModal, setAdminModal] = useState<{
    open: boolean;
    tab: "folders" | "media";
    editItem?: MediaItem | null;
  }>({ open: false, tab: "folders", editItem: null });

  const handleSelectProfile = useCallback((profile: Profile | null) => {
    setActiveProfile(profile);
    if (typeof window !== "undefined") {
      if (profile) {
        window.localStorage.setItem("ownflix_active_profile_id", profile.id);
      } else {
        window.localStorage.removeItem("ownflix_active_profile_id");
      }
    }
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
        if (savedId) {
          const matched = loadedProfiles.find((p) => p.id === savedId);
          if (matched) {
            setActiveProfile(matched);
          }
        }
      }
    }
  }, []);

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
  }, [fetchProfiles]);

  useEffect(() => {
    if (activeProfile) {
      fetchMedia(activeProfile.id);
    }
  }, [activeProfile, fetchMedia]);

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

  const handlePlay = (
    item: MediaItem,
    episode?: Episode,
    startFromBeginning = false
  ) => {
    setDetailItem(null);
    setPlayingState({ item, episode, startFromBeginning });
  };

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
        <span className="text-[#E50914] font-black text-4xl tracking-tighter animate-pulse">
          OWNFLIX+
        </span>
        <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Show "Who's Watching?" Profile Gate if no profile is selected
  if (!activeProfile) {
    return (
      <ProfileGate
        profiles={profiles}
        onSelectProfile={(profile) => handleSelectProfile(profile)}
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
        activeProfile={activeProfile}
        onClose={() => setPlayingState(null)}
        onProgressUpdated={() => fetchMedia(activeProfile.id)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white pb-20">
      {/* Top Sticky Netflix Navbar */}
      <Navbar
        activeProfile={activeProfile}
        profiles={profiles}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => setActiveCategory(cat)}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        onSwitchProfile={(p) => handleSelectProfile(p)}
        onManageProfiles={() => handleSelectProfile(null)}
        onOpenAdmin={(tab = "folders") =>
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
                  className="group bg-[#181818] rounded-md overflow-hidden border border-zinc-800 hover:border-zinc-500 transition-all hover:scale-105 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-[2/3] bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.posterUrl || item.backdropUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
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
      ) : activeCategory === "MY_LIST" || activeCategory === "LOCAL" ? (
        <main className="pt-28 px-4 md:px-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {activeCategory === "MY_LIST"
                  ? `${activeProfile.name}'s List`
                  : "Local Disk Library (Direct Range & FFmpeg Remux)"}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {activeCategory === "MY_LIST"
                  ? "Movies and TV shows you've bookmarked to watch later."
                  : "Video files (.mp4, .mkv, .webm, .avi) indexed directly from your local folders."}
              </p>
            </div>

            {activeCategory === "LOCAL" && (
              <button
                onClick={() =>
                  setAdminModal({ open: true, tab: "folders", editItem: null })
                }
                className="flex items-center gap-2 bg-[#E50914] hover:bg-[#f6121d] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded transition-colors self-start"
              >
                <FolderSync className="w-4 h-4" />
                <span>Add / Scan Local Folders</span>
              </button>
            )}
          </div>

          {categoryMedia.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center max-w-xl mx-auto my-12">
              <HardDrive className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-1">
                {activeCategory === "MY_LIST"
                  ? "Your list is currently empty"
                  : "No local files indexed yet"}
              </h3>
              <p className="text-sm text-zinc-400 mb-5">
                {activeCategory === "MY_LIST"
                  ? "Click the '+' button on any movie or series to add it to your personal watchlist."
                  : "Add a folder path in the Library Manager to index MP4 and MKV files from your computer."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {categoryMedia.map((item) => (
                <div
                  key={item.id}
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
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 fill-black ml-0.5" />
                      </div>
                    </div>
                    {item.filePath && (
                      <span className="absolute top-2 left-2 bg-black/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                        {item.filePath.toLowerCase().endsWith(".mkv")
                          ? "MKV"
                          : "LOCAL MP4"}
                      </span>
                    )}
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
              />
            )}

            <MediaRow
              title="Trending Now"
              items={categoryMedia}
              onPlay={(item) => handlePlay(item)}
              onMoreInfo={(item) => setDetailItem(item)}
              onToggleMyList={handleToggleMyList}
            />

            {myListItems.length > 0 && (
              <MediaRow
                title="My List"
                items={myListItems}
                onPlay={(item) => handlePlay(item)}
                onMoreInfo={(item) => setDetailItem(item)}
                onToggleMyList={handleToggleMyList}
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
              />
            )}

            {sciFiItems.length > 0 && (
              <MediaRow
                title="Sci-Fi & Cyberpunk Worlds"
                items={sciFiItems}
                onPlay={(item) => handlePlay(item)}
                onMoreInfo={(item) => setDetailItem(item)}
                onToggleMyList={handleToggleMyList}
              />
            )}

            {actionItems.length > 0 && (
              <MediaRow
                title="High-Octane Action & Thrillers"
                items={actionItems}
                onPlay={(item) => handlePlay(item)}
                onMoreInfo={(item) => setDetailItem(item)}
                onToggleMyList={handleToggleMyList}
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
          onSelectMedia={(item) => setDetailItem(item)}
          onEditItem={(item) => {
            setDetailItem(null);
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
            setAdminModal({ open: false, tab: "folders", editItem: null })
          }
          onLibraryUpdated={() => fetchMedia(activeProfile.id)}
        />
      )}
    </div>
  );
}

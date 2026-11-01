"use client";

import React, { useState, useEffect } from "react";
import { MediaItem, LibraryFolder } from "@/types/ownflix";
import {
  X,
  HardDrive,
  FolderPlus,
  RefreshCw,
  Trash2,
  Film,
  Plus,
  CheckCircle2,
  Star,
  Pencil,
  Sparkles,
} from "lucide-react";

interface AdminDashboardModalProps {
  initialTab?: "folders" | "media";
  initialEditItem?: MediaItem | null;
  media: MediaItem[];
  onClose: () => void;
  onLibraryUpdated: () => Promise<void>;
}

export default function AdminDashboardModal({
  initialTab = "folders",
  initialEditItem = null,
  media,
  onClose,
  onLibraryUpdated,
}: AdminDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<"folders" | "media">(
    initialEditItem ? "media" : initialTab
  );
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [syncingImdbId, setSyncingImdbId] = useState<string | null>(null);

  // Add Folder Form
  const [folderName, setFolderName] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const [folderType, setFolderType] = useState<"MOVIE" | "SERIES" | "MIXED">(
    "MIXED"
  );

  // Media Edit / Create Form
  const [editingItem, setEditingItem] = useState<MediaItem | null>(
    initialEditItem
  );
  const [isCreatingMedia, setIsCreatingMedia] = useState(false);

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [overview, setOverview] = useState("");
  const [type, setType] = useState<"MOVIE" | "SERIES">("MOVIE");
  const [releaseYear, setReleaseYear] = useState(2025);
  const [maturityRating, setMaturityRating] = useState("TV-MA");
  const [resolution, setResolution] = useState("4K Ultra HD");
  const [genres, setGenres] = useState("Sci-Fi, Action");
  const [cast, setCast] = useState("");
  const [director, setDirector] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [backdropUrl, setBackdropUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [filePath, setFilePath] = useState("");
  const [introStart, setIntroStart] = useState<string>("5");
  const [introEnd, setIntroEnd] = useState<string>("35");
  const [creditsStart, setCreditsStart] = useState<string>("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [savingMedia, setSavingMedia] = useState(false);

  const fetchFolders = async () => {
    const res = await fetch("/api/library");
    if (res.ok) {
      const data = await res.json();
      setFolders(data.folders || []);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setTagline(editingItem.tagline || "");
      setOverview(editingItem.overview);
      setType(editingItem.type);
      setReleaseYear(editingItem.releaseYear);
      setMaturityRating(editingItem.maturityRating);
      setResolution(editingItem.resolution);
      setGenres(editingItem.genres);
      setCast(editingItem.cast);
      setDirector(editingItem.director || "");
      setPosterUrl(editingItem.posterUrl);
      setBackdropUrl(editingItem.backdropUrl);
      setVideoUrl(editingItem.videoUrl || "");
      setFilePath(editingItem.filePath || "");
      setIntroStart(
        editingItem.introStart !== null ? String(editingItem.introStart) : ""
      );
      setIntroEnd(
        editingItem.introEnd !== null ? String(editingItem.introEnd) : ""
      );
      setCreditsStart(
        editingItem.creditsStart !== null
          ? String(editingItem.creditsStart)
          : ""
      );
      setIsFeatured(editingItem.isFeatured);
    }
  }, [editingItem]);

  const startCreateMedia = () => {
    setEditingItem(null);
    setIsCreatingMedia(true);
    setTitle("");
    setTagline("");
    setOverview("");
    setType("MOVIE");
    setReleaseYear(2025);
    setMaturityRating("PG-13");
    setResolution("4K Ultra HD");
    setGenres("");
    setCast("");
    setDirector("");
    setPosterUrl("");
    setBackdropUrl("");
    setVideoUrl(
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
    );
    setFilePath("");
    setIntroStart("5");
    setIntroEnd("35");
    setCreditsStart("680");
    setIsFeatured(false);
  };

  // Auto-fill form fields from IMDb by title or IMDb ID (e.g. tt0338564)
  const handleAutoFillImdbForm = async () => {
    if (!title.trim()) return;
    setSyncingImdbId("form");
    setStatusBanner(null);
    try {
      const res = await fetch(
        `/api/imdb?title=${encodeURIComponent(title.trim())}&year=${releaseYear}`
      );
      const data = await res.json();
      if (!res.ok || !data.metadata) {
        setStatusBanner(data.error || `No IMDb match found for "${title}"`);
      } else {
        const m = data.metadata;
        setTitle(m.title);
        setReleaseYear(m.year);
        setOverview(m.overview);
        if (m.tagline) setTagline(m.tagline);
        setMaturityRating(m.maturityRating);
        setGenres(m.genres);
        setCast(m.cast);
        if (m.director) setDirector(m.director);
        setPosterUrl(m.posterUrl);
        setBackdropUrl(m.backdropUrl);
        setStatusBanner(
          `Matched on IMDb: "${m.title}" (${m.year}) [${m.imdbId}] — filled poster, backdrop, synopsis, cast & rating.`
        );
      }
    } finally {
      setSyncingImdbId(null);
    }
  };

  // One-click IMDb sync for a single item or all items
  const handleSyncImdbItem = async (mediaItemId?: string) => {
    setSyncingImdbId(mediaItemId || "all");
    setStatusBanner(null);
    try {
      const res = await fetch("/api/imdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mediaItemId ? { mediaItemId } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner(data.error || "IMDb lookup failed");
      } else if (mediaItemId && data.imdb) {
        setStatusBanner(
          `Updated "${data.imdb.title}" (${data.imdb.year}) from IMDb [${data.imdb.imdbId}].`
        );
        await onLibraryUpdated();
      } else {
        setStatusBanner(
          `Synced ${data.updatedCount} of ${data.total} titles with official IMDb metadata & posters.`
        );
        await onLibraryUpdated();
      }
    } finally {
      setSyncingImdbId(null);
    }
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim() || !folderPath.trim()) return;
    setScanningId("adding");
    setStatusBanner(null);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: folderName,
          path: folderPath,
          mediaType: folderType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner(data.error || "Failed to add folder");
      } else {
        setFolderName("");
        setFolderPath("");
        setStatusBanner(
          `Scanned "${data.folder.name}" & fetched IMDb metadata: ${data.scanResult.scannedFiles} video files (${data.scanResult.addedMovies} new movies, ${data.scanResult.addedEpisodes} new episodes).`
        );
        await fetchFolders();
        await onLibraryUpdated();
      }
    } finally {
      setScanningId(null);
    }
  };

  const handleScanFolder = async (folderId?: string) => {
    setScanningId(folderId || "all");
    setStatusBanner(null);
    try {
      const res = await fetch("/api/library", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusBanner(
          `Library scan & IMDb auto-match complete: ${data.scanResult.scannedFiles} files indexed (${data.scanResult.addedMovies} movies added, ${data.scanResult.addedEpisodes} episodes added).`
        );
        await fetchFolders();
        await onLibraryUpdated();
      }
    } finally {
      setScanningId(null);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    await fetch(`/api/library?id=${id}`, { method: "DELETE" });
    await fetchFolders();
  };

  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSavingMedia(true);
    try {
      if (isCreatingMedia) {
        await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            tagline,
            overview,
            type,
            releaseYear,
            maturityRating,
            resolution,
            genres,
            cast,
            director,
            posterUrl,
            backdropUrl,
            videoUrl,
            filePath,
            introStart,
            introEnd,
            creditsStart,
            isFeatured,
          }),
        });
        setStatusBanner(`Added "${title}" to your OwnFlix+ catalog.`);
      } else if (editingItem) {
        await fetch(`/api/media/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            tagline,
            overview,
            releaseYear,
            maturityRating,
            resolution,
            genres,
            cast,
            director,
            posterUrl,
            backdropUrl,
            videoUrl,
            introStart,
            introEnd,
            creditsStart,
            isFeatured,
          }),
        });
        setStatusBanner(`Updated metadata for "${title}".`);
      }
      await onLibraryUpdated();
      setEditingItem(null);
      setIsCreatingMedia(false);
    } finally {
      setSavingMedia(false);
    }
  };

  const handleDeleteMedia = async (id: string, itemTitle: string) => {
    await fetch(`/api/media/${id}`, { method: "DELETE" });
    setStatusBanner(`Removed "${itemTitle}" from library.`);
    if (editingItem?.id === id) setEditingItem(null);
    await onLibraryUpdated();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto flex justify-center p-3 sm:p-6 md:p-10 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181818] text-white border border-zinc-800 rounded-xl max-w-5xl w-full overflow-hidden shadow-2xl my-auto flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#121212] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-[#2563EB] text-white font-black text-sm px-2 py-0.5 rounded-sm">
              O+
            </span>
            <h2 className="text-lg md:text-xl font-bold">
              OwnFlix+ Library & Metadata Manager
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 bg-[#141414] border-b border-zinc-800 flex items-center gap-6">
          <button
            onClick={() => {
              setActiveTab("folders");
              setEditingItem(null);
              setIsCreatingMedia(false);
            }}
            className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "folders"
                ? "border-[#2563EB] text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Local Media Folders ({folders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("media")}
            className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "media"
                ? "border-[#2563EB] text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Titles & IMDb Metadata ({media.length})</span>
          </button>
        </div>

        {/* Status Notification Banner */}
        {statusBanner && (
          <div className="mx-6 mt-4 px-4 py-2.5 bg-emerald-950/80 border border-emerald-700/70 rounded-lg text-xs sm:text-sm text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusBanner}</span>
            </div>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-emerald-400 hover:text-white ml-4"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "folders" ? (
            <>
              {/* Top Actions & Explanation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 rounded-lg p-4">
                <div>
                  <h3 className="font-bold text-sm md:text-base text-white">
                    Automatic Local Disk Indexer + IMDb Poster & Metadata Scraper
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Drop any <code className="text-zinc-200">.mp4</code>,{" "}
                    <code className="text-zinc-200">.mkv</code>,{" "}
                    <code className="text-zinc-200">.webm</code>, or{" "}
                    <code className="text-zinc-200">.avi</code> files into your
                    watched folders. OwnFlix+ automatically probes resolution,
                    duration, and queries IMDb for official posters, plot, cast,
                    director, and ratings.
                  </p>
                </div>

                <button
                  onClick={() => handleScanFolder()}
                  disabled={scanningId !== null}
                  className="shrink-0 flex items-center gap-2 bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded transition-colors"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      scanningId === "all" ? "animate-spin" : ""
                    }`}
                  />
                  <span>
                    {scanningId === "all"
                      ? "Scanning & Matching IMDb..."
                      : "Scan All Folders"}
                  </span>
                </button>
              </div>

              {/* Watched Folders List */}
              <div className="space-y-3">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 rounded-lg p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm md:text-base text-white">
                          {folder.name}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {folder.mediaType}
                        </span>
                        <span className="text-xs text-emerald-400 font-medium">
                          {folder.itemCount} video files
                        </span>
                      </div>
                      <code className="text-xs text-zinc-400 block mt-1 truncate">
                        {folder.path}
                      </code>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleScanFolder(folder.id)}
                        disabled={scanningId !== null}
                        className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded border border-zinc-700 transition-colors"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            scanningId === folder.id ? "animate-spin" : ""
                          }`}
                        />
                        <span>Rescan</span>
                      </button>

                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Remove folder from watcher"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Local Folder Form */}
              <form
                onSubmit={handleAddFolder}
                className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5"
              >
                <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
                  <FolderPlus className="w-4 h-4 text-[#2563EB]" />
                  <span>Add Local Directory to Watch</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      placeholder="e.g. 4K Movies Archive"
                      required
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Folder Path on Disk
                    </label>
                    <input
                      type="text"
                      value={folderPath}
                      onChange={(e) => setFolderPath(e.target.value)}
                      placeholder="e.g. C:\jellyfin-media-server\Movies"
                      required
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Content Type
                    </label>
                    <select
                      value={folderType}
                      onChange={(e) =>
                        setFolderType(
                          e.target.value as "MOVIE" | "SERIES" | "MIXED"
                        )
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="MIXED">Auto-Detect (Movies & TV)</option>
                      <option value="MOVIE">Movies Only</option>
                      <option value="SERIES">TV Series (S01E01)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={scanningId !== null}
                  className="bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm px-5 py-2 rounded transition-colors"
                >
                  {scanningId === "adding"
                    ? "Adding & Fetching IMDb..."
                    : "Add & Scan Folder"}
                </button>
              </form>
            </>
          ) : editingItem || isCreatingMedia ? (
            /* Metadata Editor Form */
            <form onSubmit={handleSaveMedia} className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-base">
                  {isCreatingMedia
                    ? "Add New Title (Auto-Searches IMDb)"
                    : `Editing Metadata: ${editingItem?.title}`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setIsCreatingMedia(false);
                  }}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  ← Back to All Titles
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">
                    Title or IMDb ID (e.g. tt0338564)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter movie title or ttXXXXXXX"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Release Year
                  </label>
                  <input
                    type="number"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleAutoFillImdbForm}
                    disabled={syncingImdbId !== null || !title.trim()}
                    className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs py-2.5 px-3 rounded transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {syncingImdbId === "form"
                        ? "Searching IMDb..."
                        : "Auto-Fill from IMDb"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Maturity Rating
                  </label>
                  <input
                    type="text"
                    value={maturityRating}
                    onChange={(e) => setMaturityRating(e.target.value)}
                    placeholder="TV-MA, PG-13, R"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Quality Badge
                  </label>
                  <input
                    type="text"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="4K Ultra HD, 1080p HD"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Genres (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Synopsis / Overview
                </label>
                <textarea
                  rows={3}
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    IMDb Poster Image URL
                  </label>
                  <input
                    type="text"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Backdrop / Still Image URL
                  </label>
                  <input
                    type="text"
                    value={backdropUrl}
                    onChange={(e) => setBackdropUrl(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Stream URL (MP4 / `/api/stream?...`)
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Cast
                  </label>
                  <input
                    type="text"
                    value={cast}
                    onChange={(e) => setCast(e.target.value)}
                    placeholder="Lead actors"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Director
                  </label>
                  <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    placeholder="Director name"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>

              {/* Skip Intro & Credits Markers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-900/70 border border-zinc-800 p-3.5 rounded-lg">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Intro Start (seconds)
                  </label>
                  <input
                    type="number"
                    value={introStart}
                    onChange={(e) => setIntroStart(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Intro End (seconds — Skip Intro target)
                  </label>
                  <input
                    type="number"
                    value={introEnd}
                    onChange={(e) => setIntroEnd(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Credits Start (seconds — Next Ep trigger)
                  </label>
                  <input
                    type="number"
                    value={creditsStart}
                    onChange={(e) => setCreditsStart(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <span className="text-sm text-zinc-200 font-medium">
                  Feature this title on the Home Hero Billboard
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setIsCreatingMedia(false);
                  }}
                  className="px-4 py-2 text-xs sm:text-sm border border-zinc-600 rounded text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMedia}
                  className="px-6 py-2 text-xs sm:text-sm bg-[#2563EB] hover:bg-[#3B82F6] text-white font-bold rounded transition-colors"
                >
                  {savingMedia ? "Saving..." : "Save Metadata"}
                </button>
              </div>
            </form>
          ) : (
            /* Media Catalog List */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-zinc-400">
                  Every scanned movie automatically queries IMDb for its
                  official poster, backdrop still, synopsis, cast, director, and
                  rating.
                </p>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => handleSyncImdbItem()}
                    disabled={syncingImdbId !== null}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs sm:text-sm px-3.5 py-2 rounded transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {syncingImdbId === "all"
                        ? "Syncing with IMDb..."
                        : "Sync All with IMDb"}
                    </span>
                  </button>

                  <button
                    onClick={startCreateMedia}
                    className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm px-4 py-2 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Title</span>
                  </button>
                </div>
              </div>

              <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg overflow-hidden">
                {media.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-3.5 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.posterUrl || item.backdropUrl}
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded bg-zinc-800 shrink-0 border border-zinc-700"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">
                            {item.title}
                          </span>
                          {item.isFeatured && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-semibold">
                              <Star className="w-2.5 h-2.5 fill-amber-300" />
                              Billboard
                            </span>
                          )}
                          {item.filePath && (
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-700/50 px-1.5 py-0.5 rounded font-semibold">
                              Local Disk
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5 truncate">
                          {item.type} • {item.releaseYear} •{" "}
                          {item.maturityRating} • {item.genres}
                        </div>
                        {item.cast && (
                          <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                            Cast: {item.cast}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSyncImdbItem(item.id)}
                        disabled={syncingImdbId !== null}
                        className="flex items-center gap-1 text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded transition-colors"
                        title="Refresh Metadata & Poster from IMDb"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {syncingImdbId === item.id ? "..." : "IMDb"}
                        </span>
                      </button>

                      <button
                        onClick={() => setEditingItem(item)}
                        className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded border border-zinc-700"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteMedia(item.id, item.title)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete from library"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { MediaItem, LibraryFolder, ActivityLogItem } from "@/types/ownflix";
import { renderProfileIcon, AVATAR_COLORS } from "@/components/ProfileGate";
import AvatarPicker from "@/components/AvatarPicker";
import {
  generateFunnyName,
  generateFunnyNameSuggestions,
} from "@/lib/nameGenerator";
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
  Activity,
  ShieldAlert,
  ShieldCheck,
  Users,
  Clock,
  Play,
  Bookmark,
  LogIn,
  Check,
  FolderOpen,
  UserPlus,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Dices,
  Smile,
  Palette,
  AlertCircle,
  UserCheck,
  UserX,
} from "lucide-react";

export type AdminTab = "profiles" | "activity" | "folders" | "media";

interface AdminProfileSummary {
  id: string;
  name: string;
  avatarColor: string;
  avatarIcon: string;
  hasPassword: boolean;
  isKids: boolean;
  isAdmin: boolean;
  createdAt: string;
  libraryFolders: LibraryFolder[];
  watchProgress: {
    id: string;
    mediaItemId: string;
    positionSeconds: number;
    durationSeconds: number;
    completed: boolean;
    updatedAt: string;
    mediaItem: {
      id: string;
      title: string;
      posterUrl: string;
      backdropUrl: string;
      type: string;
      releaseYear: number;
    };
    episode?: {
      id: string;
      seasonNumber: number;
      episodeNumber: number;
      title: string;
    } | null;
  }[];
  counts: {
    activityLogs: number;
    watchProgress: number;
    myList: number;
    libraryFolders: number;
  };
}

interface AdminDashboardModalProps {
  initialTab?: AdminTab;
  initialEditItem?: MediaItem | null;
  media: MediaItem[];
  onClose: () => void;
  onLibraryUpdated: () => Promise<void>;
  onProfilesUpdated?: () => Promise<void>;
  standalone?: boolean;
}

function isBrowserLocalhost(): boolean {
  if (typeof window === "undefined") return true;
  const h = window.location.hostname.toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h === "[::1]"
  );
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboardModal({
  initialTab = "profiles",
  initialEditItem = null,
  media,
  onClose,
  onLibraryUpdated,
  onProfilesUpdated,
  standalone = false,
}: AdminDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(
    initialEditItem ? "media" : initialTab
  );

  // Localhost verification state
  const [isLocalhost, setIsLocalhost] = useState<boolean>(() =>
    isBrowserLocalhost()
  );
  const [accessError, setAccessError] = useState<string | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  // Primary Dashboard Data
  const [adminProfiles, setAdminProfiles] = useState<AdminProfileSummary[]>([]);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);

  // Profile Administration State
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileFunnySuggestions, setNewProfileFunnySuggestions] = useState<
    string[]
  >(() => generateFunnyNameSuggestions(3));
  const [newProfileColor, setNewProfileColor] = useState<string>(
    AVATAR_COLORS[0]
  );
  const [newProfileIcon, setNewProfileIcon] = useState<string>("smile");
  const [newProfileIsAdmin, setNewProfileIsAdmin] = useState(false);
  const [newProfileIsKids, setNewProfileIsKids] = useState(false);
  const [newProfilePassword, setNewProfilePassword] = useState("");
  const [newProfileShowPassword, setNewProfileShowPassword] = useState(false);
  const [showNewAvatarPicker, setShowNewAvatarPicker] = useState(false);
  const [createProfileError, setCreateProfileError] = useState<string | null>(
    null
  );
  const [creatingProfile, setCreatingProfile] = useState(false);

  // Edit Profile State
  const [editingProfileItem, setEditingProfileItem] =
    useState<AdminProfileSummary | null>(null);
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfileFunnySuggestions, setEditProfileFunnySuggestions] =
    useState<string[]>([]);
  const [editProfileColor, setEditProfileColor] = useState<string>(
    AVATAR_COLORS[0]
  );
  const [editProfileIcon, setEditProfileIcon] = useState<string>("smile");
  const [editProfileIsAdmin, setEditProfileIsAdmin] = useState(false);
  const [editProfileIsKids, setEditProfileIsKids] = useState(false);
  const [editProfileNewPassword, setEditProfileNewPassword] = useState("");
  const [editProfileRemovePassword, setEditProfileRemovePassword] =
    useState(false);
  const [editProfileShowPassword, setEditProfileShowPassword] = useState(false);
  const [showEditAvatarPicker, setShowEditAvatarPicker] = useState(false);
  const [editProfileError, setEditProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Delete Profile State
  const [deletingProfileItem, setDeletingProfileItem] =
    useState<AdminProfileSummary | null>(null);
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [deleteProfileError, setDeleteProfileError] = useState<string | null>(
    null
  );

  // Activity Log Filters
  const [selectedProfileFilter, setSelectedProfileFilter] =
    useState<string>("ALL");
  const [selectedActionFilter, setSelectedActionFilter] =
    useState<string>("ALL");

  // Storage Location Filter & Add/Edit State
  const [storageProfileFilter, setStorageProfileFilter] =
    useState<string>("ALL");
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [syncingImdbId, setSyncingImdbId] = useState<string | null>(null);

  // Add Storage Location Form
  const [folderName, setFolderName] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const [folderType, setFolderType] = useState<"MOVIE" | "SERIES" | "MIXED">(
    "MIXED"
  );
  const [folderProfileId, setFolderProfileId] = useState<string>("ALL");

  // Inline Edit Storage Location State
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [editFolderPath, setEditFolderPath] = useState("");
  const [editFolderType, setEditFolderType] = useState<
    "MOVIE" | "SERIES" | "MIXED"
  >("MIXED");
  const [editFolderProfileId, setEditFolderProfileId] = useState<string>("ALL");
  const [savingFolderEdit, setSavingFolderEdit] = useState(false);

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

  const fetchAdminData = useCallback(async () => {
    if (!isBrowserLocalhost()) {
      setIsLocalhost(false);
      setAccessError(
        "Admin Settings Dashboard can only be accessed from localhost (127.0.0.1 / ::1)."
      );
      setLoadingAdmin(false);
      return;
    }

    setLoadingAdmin(true);
    try {
      const res = await fetch("/api/admin");
      const data = await res.json();
      if (res.status === 403 || data.isLocalhost === false) {
        setIsLocalhost(false);
        setAccessError(
          data.error ||
            "Admin Settings Dashboard can only be accessed from localhost."
        );
        return;
      }
      if (res.ok) {
        setIsLocalhost(true);
        setAdminProfiles(data.profiles || []);
        setFolders(data.folders || []);
        setActivityLogs(data.activityLogs || []);
      }
    } finally {
      setLoadingAdmin(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

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

  // Filtered Activity Logs
  const filteredActivityLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      if (
        selectedProfileFilter !== "ALL" &&
        log.profileId !== selectedProfileFilter
      ) {
        return false;
      }
      if (selectedActionFilter !== "ALL") {
        if (selectedActionFilter === "PLAYBACK") {
          return (
            log.action === "PLAY_START" ||
            log.action === "PLAY_PROGRESS" ||
            log.action === "PLAY_COMPLETE"
          );
        }
        if (selectedActionFilter === "MYLIST") {
          return (
            log.action === "MYLIST_ADD" || log.action === "MYLIST_REMOVE"
          );
        }
        return log.action === selectedActionFilter;
      }
      return true;
    });
  }, [activityLogs, selectedProfileFilter, selectedActionFilter]);

  // Filtered Storage Folders
  const filteredFolders = useMemo(() => {
    if (storageProfileFilter === "ALL") return folders;
    if (storageProfileFilter === "SHARED") {
      return folders.filter((f) => !f.profileId);
    }
    return folders.filter((f) => f.profileId === storageProfileFilter);
  }, [folders, storageProfileFilter]);

  const handleClearActivityLogs = async () => {
    await fetch(
      `/api/admin?profileId=${encodeURIComponent(selectedProfileFilter)}`,
      { method: "DELETE" }
    );
    setStatusBanner(
      selectedProfileFilter === "ALL"
        ? "Cleared activity logs for all user profiles."
        : "Cleared activity logs for selected profile."
    );
    await fetchAdminData();
  };

  const startEditFolder = (folder: LibraryFolder) => {
    setEditingFolderId(folder.id);
    setEditFolderName(folder.name);
    setEditFolderPath(folder.path);
    setEditFolderType(folder.mediaType);
    setEditFolderProfileId(folder.profileId || "ALL");
  };

  const handleSaveFolderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolderId || !editFolderName.trim() || !editFolderPath.trim()) {
      return;
    }
    setSavingFolderEdit(true);
    setStatusBanner(null);
    try {
      const res = await fetch("/api/library", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingFolderId,
          name: editFolderName.trim(),
          path: editFolderPath.trim(),
          mediaType: editFolderType,
          profileId: editFolderProfileId === "ALL" ? null : editFolderProfileId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner(data.error || "Failed to update storage location");
      } else {
        setEditingFolderId(null);
        setStatusBanner(
          `Updated storage location "${data.folder.name}" (${
            data.folder.profile ? `Assigned to ${data.folder.profile.name}` : "Shared with All Profiles"
          }).`
        );
        await fetchAdminData();
        await onLibraryUpdated();
      }
    } finally {
      setSavingFolderEdit(false);
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
          profileId: folderProfileId === "ALL" ? null : folderProfileId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusBanner(data.error || "Failed to add storage location");
      } else {
        setFolderName("");
        setFolderPath("");
        setStatusBanner(
          `Added storage location "${data.folder.name}" (${
            data.folder.profile
              ? `Profile: ${data.folder.profile.name}`
              : "Shared: All Profiles"
          }) — indexed ${data.scanResult.scannedFiles} video files.`
        );
        await fetchAdminData();
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
          `Storage scan & IMDb auto-match complete: ${data.scanResult.scannedFiles} files indexed (${data.scanResult.addedMovies} movies added, ${data.scanResult.addedEpisodes} episodes added).`
        );
        await fetchAdminData();
        await onLibraryUpdated();
      }
    } finally {
      setScanningId(null);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    await fetch(`/api/library?id=${id}`, { method: "DELETE" });
    await fetchAdminData();
    await onLibraryUpdated();
  };

  const openCreateProfileModal = () => {
    setNewProfileName("");
    setNewProfileFunnySuggestions(generateFunnyNameSuggestions(3));
    setNewProfileColor(
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    );
    setNewProfileIcon("smile");
    setNewProfileIsAdmin(false);
    setNewProfileIsKids(false);
    setNewProfilePassword("");
    setNewProfileShowPassword(false);
    setShowNewAvatarPicker(false);
    setCreateProfileError(null);
    setIsCreatingProfile(true);
  };

  const openEditProfileModal = (p: AdminProfileSummary) => {
    setEditingProfileItem(p);
    setEditProfileName(p.name);
    setEditProfileFunnySuggestions(generateFunnyNameSuggestions(3));
    setEditProfileColor(p.avatarColor);
    setEditProfileIcon(p.avatarIcon);
    setEditProfileIsAdmin(p.isAdmin);
    setEditProfileIsKids(p.isKids);
    setEditProfileNewPassword("");
    setEditProfileRemovePassword(false);
    setEditProfileShowPassword(false);
    setShowEditAvatarPicker(false);
    setEditProfileError(null);
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    setCreatingProfile(true);
    setCreateProfileError(null);
    try {
      const res = await fetch("/api/admin/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProfileName.trim(),
          avatarColor: newProfileColor,
          avatarIcon: newProfileIcon,
          isAdmin: newProfileIsAdmin,
          isKids: newProfileIsKids,
          password: newProfilePassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateProfileError(data.error || "Failed to create profile.");
        return;
      }
      setIsCreatingProfile(false);
      setStatusBanner(`Profile "${newProfileName}" created successfully!`);
      await fetchAdminData();
      await onProfilesUpdated?.();
    } catch (err: any) {
      setCreateProfileError(err?.message || "Error creating profile.");
    } finally {
      setCreatingProfile(false);
    }
  };

  const handleSaveEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfileItem || !editProfileName.trim()) return;
    setSavingProfile(true);
    setEditProfileError(null);
    try {
      const res = await fetch("/api/admin/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProfileItem.id,
          name: editProfileName.trim(),
          avatarColor: editProfileColor,
          avatarIcon: editProfileIcon,
          isAdmin: editProfileIsAdmin,
          isKids: editProfileIsKids,
          newPassword: editProfileNewPassword.trim() || undefined,
          removePassword: editProfileRemovePassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditProfileError(data.error || "Failed to update profile.");
        return;
      }
      setEditingProfileItem(null);
      setStatusBanner(`Profile "${editProfileName}" updated successfully!`);
      await fetchAdminData();
      await onProfilesUpdated?.();
    } catch (err: any) {
      setEditProfileError(err?.message || "Error updating profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!deletingProfileItem) return;
    setDeletingProfile(true);
    setDeleteProfileError(null);
    try {
      const res = await fetch(
        `/api/admin/profiles?id=${encodeURIComponent(deletingProfileItem.id)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setDeleteProfileError(data.error || "Failed to delete profile.");
        return;
      }
      const deletedName = deletingProfileItem.name;
      setDeletingProfileItem(null);
      setStatusBanner(`Profile "${deletedName}" has been permanently deleted.`);
      await fetchAdminData();
      await onProfilesUpdated?.();
    } catch (err: any) {
      setDeleteProfileError(err?.message || "Error deleting profile.");
    } finally {
      setDeletingProfile(false);
    }
  };

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

  const renderActionBadge = (action: string) => {
    switch (action) {
      case "PLAY_COMPLETE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
            <Check className="w-3 h-3" /> Completed
          </span>
        );
      case "PLAY_START":
      case "PLAY_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-700/50">
            <Play className="w-3 h-3 fill-blue-300" /> Playback
          </span>
        );
      case "MYLIST_ADD":
      case "MYLIST_REMOVE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-700/50">
            <Bookmark className="w-3 h-3" /> Watchlist
          </span>
        );
      case "PROFILE_LOGIN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/50">
            <LogIn className="w-3 h-3" /> Profile Login
          </span>
        );
      case "STORAGE_UPDATE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
            <HardDrive className="w-3 h-3" /> Storage
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            {action}
          </span>
        );
    }
  };

  // If accessed from outside localhost, block access completely
  if (!isLocalhost) {
    return (
      <div
        onClick={standalone ? undefined : onClose}
        className={
          standalone
            ? "min-h-screen bg-[#141414] flex items-center justify-center p-6 select-none"
            : "fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 select-none"
        }
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[#181818] border border-red-800/80 rounded-xl max-w-md w-full p-8 text-center shadow-2xl"
        >
          <div className="w-14 h-14 rounded-full bg-red-950/90 border border-red-700 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Localhost Access Only
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            {accessError ||
              "For security, the OwnFlix+ Admin Settings Dashboard can only be accessed directly from the host machine at localhost (127.0.0.1 / ::1)."}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#3B82F6] text-white font-bold text-sm rounded transition-colors"
          >
            Return to OwnFlix+
          </button>
        </div>
      </div>
    );
  }

  const totalWatchSessions = adminProfiles.reduce(
    (acc, p) => acc + (p.watchProgress?.length || 0),
    0
  );

  const innerDashboard = (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`bg-[#181818] text-white border border-zinc-800 rounded-xl w-full overflow-hidden shadow-2xl flex flex-col ${
        standalone ? "max-w-7xl mx-auto min-h-[85vh]" : "max-w-6xl my-auto max-h-[92vh]"
      }`}
    >
      {/* Header */}
      <div className="px-6 py-4 bg-[#121212] border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-[#2563EB] text-white font-black text-sm px-2 py-0.5 rounded-sm">
            O+
          </span>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg md:text-xl font-bold">
                Admin Settings Dashboard
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-700/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Localhost Verified (127.0.0.1)</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              User profile activity monitoring, per-profile storage locations, and library metadata
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition-colors"
            title="Refresh dashboard data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loadingAdmin ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1"
            title="Close Admin Dashboard"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 bg-[#141414] border-b border-zinc-800 flex items-center gap-6 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab("profiles");
            setEditingItem(null);
            setIsCreatingMedia(false);
          }}
          className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
            activeTab === "profiles"
              ? "border-[#2563EB] text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Users className="w-4 h-4 text-[#3B82F6]" />
          <span>Server Profiles ({adminProfiles.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("activity");
            setEditingItem(null);
            setIsCreatingMedia(false);
          }}
          className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
            activeTab === "activity"
              ? "border-[#2563EB] text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Activity className="w-4 h-4 text-[#3B82F6]" />
          <span>Profile Activity Logs ({activityLogs.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("folders");
            setEditingItem(null);
            setIsCreatingMedia(false);
          }}
          className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
            activeTab === "folders"
              ? "border-[#2563EB] text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <HardDrive className="w-4 h-4 text-[#3B82F6]" />
          <span>Per-Profile Storage Locations ({folders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("media")}
          className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 shrink-0 transition-colors ${
            activeTab === "media"
              ? "border-[#2563EB] text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Film className="w-4 h-4 text-[#3B82F6]" />
          <span>Titles &amp; IMDb Metadata ({media.length})</span>
        </button>
      </div>

      {/* Status Notification Banner */}
      {statusBanner && (
        <div className="mx-6 mt-4 px-4 py-2.5 bg-emerald-950 border border-emerald-700 rounded-lg text-xs sm:text-sm text-emerald-200 flex items-center justify-between">
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

      {/* Main Content Area */}
      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        {activeTab === "profiles" ? (
          /* ==========================================
             TAB 0: SERVER PROFILES & ACCESS MANAGEMENT
             ========================================== */
          <div className="space-y-6">
            {/* Top Explanation & Create Profile Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] border border-zinc-800 rounded-lg p-5">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#3B82F6]" />
                  <h3 className="font-bold text-base md:text-lg text-white">
                    Server Profiles &amp; Access Control
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Manage viewer accounts on this server, assign Administrator
                  roles, enable Kids Mode restrictions, and reset forgotten
                  passwords without needing current credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateProfileModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-sm rounded-lg shadow-lg shadow-blue-600/20 transition-all shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Create Profile</span>
              </button>
            </div>

            {/* Profiles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminProfiles.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#141414] border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-5 flex flex-col justify-between transition-all group"
                >
                  <div>
                    {/* Top Avatar & Badges */}
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className="relative w-16 h-16 rounded-xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden ring-1 ring-white/10"
                        style={{
                          background: `linear-gradient(145deg, ${p.avatarColor}, #0a0a0a 160%)`,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                        <div className="text-white drop-shadow">
                          {renderProfileIcon(p.avatarIcon, "w-10 h-10")}
                        </div>
                        {p.isKids && (
                          <span className="absolute bottom-1 right-1 bg-amber-400 text-black font-black text-[9px] px-1 py-0.2 rounded uppercase">
                            KIDS
                          </span>
                        )}
                        {p.isAdmin && (
                          <span className="absolute bottom-1 right-1 bg-[#2563EB] text-white font-black text-[9px] px-1 py-0.2 rounded uppercase">
                            ADMIN
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-base text-white truncate group-hover:text-[#60A5FA] transition-colors">
                          {p.name}
                        </h4>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {p.isAdmin ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 border border-blue-700/60">
                              <ShieldCheck className="w-3 h-3 text-[#3B82F6]" />
                              <span>Administrator</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                              <Users className="w-3 h-3 text-zinc-400" />
                              <span>Standard</span>
                            </span>
                          )}

                          {p.hasPassword ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
                              <Lock className="w-3 h-3 text-emerald-400" />
                              <span>Protected</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700">
                              <Unlock className="w-3 h-3 text-zinc-500" />
                              <span>No Pass</span>
                            </span>
                          )}

                          {p.isKids && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/60">
                              <span>Kids Mode</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/80 text-xs mb-4">
                      <div>
                        <span className="text-zinc-500 block text-[11px]">
                          Watched
                        </span>
                        <span className="font-bold text-white">
                          {p.counts.watchProgress} titles
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[11px]">
                          My List
                        </span>
                        <span className="font-bold text-white">
                          {p.counts.myList} saved
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[11px]">
                          Folders
                        </span>
                        <span className="font-bold text-white">
                          {p.counts.libraryFolders} assigned
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[11px]">
                          Activity
                        </span>
                        <span className="font-bold text-white">
                          {p.counts.activityLogs} logs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                    <span className="text-[11px] text-zinc-500">
                      Added {new Date(p.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditProfileModal(p)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition-colors"
                        title="Edit profile & reset password"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeletingProfileItem(p);
                          setDeleteProfileError(null);
                        }}
                        disabled={adminProfiles.length <= 1}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-800/80 hover:bg-red-950/80 hover:text-red-200 text-zinc-400 hover:border-red-800/80 border border-zinc-700/80 text-xs transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title={
                          adminProfiles.length <= 1
                            ? "Cannot delete the last remaining profile"
                            : "Delete profile"
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === "activity" ? (
          /* ==========================================
             PRIMARY DASHBOARD: USER PROFILE ACTIVITY LOGS
             ========================================== */
          <>
            {/* Top Summary KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#141414] border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>User Profiles</span>
                  <Users className="w-4 h-4 text-[#3B82F6]" />
                </div>
                <div className="text-2xl font-black text-white">
                  {adminProfiles.length}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Active accounts on server
                </div>
              </div>

              <div className="bg-[#141414] border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>Recorded Activity Logs</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {activityLogs.length}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Playback, logins &amp; changes
                </div>
              </div>

              <div className="bg-[#141414] border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>Active Watch History</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {totalWatchSessions}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Tracked progress items
                </div>
              </div>

              <div className="bg-[#141414] border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>Storage Locations</span>
                  <HardDrive className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {folders.length}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Per-profile &amp; shared paths
                </div>
              </div>
            </div>

            {/* User Profile Selector Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Filter Activity by User Profile
                </h3>
                {selectedProfileFilter !== "ALL" && (
                  <button
                    onClick={() => setSelectedProfileFilter("ALL")}
                    className="text-xs text-[#3B82F6] hover:underline font-semibold"
                  >
                    Show All Profiles
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {adminProfiles.map((prof) => {
                  const isSelected = selectedProfileFilter === prof.id;
                  const profLogs = activityLogs.filter(
                    (l) => l.profileId === prof.id
                  );
                  const lastLog = profLogs[0];
                  const assignedCount = folders.filter(
                    (f) => f.profileId === prof.id
                  ).length;

                  return (
                    <div
                      key={prof.id}
                      onClick={() =>
                        setSelectedProfileFilter(
                          isSelected ? "ALL" : prof.id
                        )
                      }
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#2563EB]/15 border-[#2563EB] shadow-lg"
                          : "bg-[#141414] border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow"
                          style={{
                            background: `linear-gradient(145deg, ${prof.avatarColor}, #111111 150%)`,
                          }}
                        >
                          {renderProfileIcon(
                            prof.avatarIcon,
                            "w-5 h-5 text-white"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-white truncate">
                              {prof.name}
                            </span>
                            {prof.isKids && (
                              <span className="text-[9px] bg-amber-400 text-black font-black px-1 rounded">
                                KIDS
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {profLogs.length} events &bull;{" "}
                            {prof.watchProgress.length} watched
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 truncate">
                          {lastLog
                            ? `Active ${formatRelativeTime(lastLog.createdAt)}`
                            : "No recent activity"}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStorageProfileFilter(prof.id);
                            setFolderProfileId(prof.id);
                            setActiveTab("folders");
                          }}
                          className="text-[#3B82F6] hover:underline font-semibold shrink-0 ml-2"
                        >
                          {assignedCount} folder{assignedCount === 1 ? "" : "s"} →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Two-Column Activity Timeline & Watch Progress Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Columns: Chronological Activity Log Stream */}
              <div className="lg:col-span-2 bg-[#141414] border border-zinc-800 rounded-xl p-4 flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-white">
                      User Profile Activity Log
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Showing {filteredActivityLogs.length} event
                      {filteredActivityLogs.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedActionFilter}
                      onChange={(e) => setSelectedActionFilter(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="ALL">All Event Types</option>
                      <option value="PLAYBACK">Playback &amp; Progress</option>
                      <option value="PROFILE_LOGIN">Profile Logins</option>
                      <option value="MYLIST">My List Changes</option>
                      <option value="STORAGE_UPDATE">Storage Updates</option>
                    </select>

                    {activityLogs.length > 0 && (
                      <button
                        onClick={handleClearActivityLogs}
                        className="text-xs text-zinc-400 hover:text-red-400 px-2.5 py-1.5 rounded border border-zinc-800 hover:border-red-800 transition-colors"
                      >
                        Clear Logs
                      </button>
                    )}
                  </div>
                </div>

                {filteredActivityLogs.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-sm">
                    No activity logs recorded for the current filter.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[430px] overflow-y-auto pr-1">
                    {filteredActivityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-[#181818] border border-zinc-800/90 hover:border-zinc-700 transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            background: `linear-gradient(145deg, ${
                              log.profile?.avatarColor || "#2563EB"
                            }, #111111 150%)`,
                          }}
                        >
                          {renderProfileIcon(
                            log.profile?.avatarIcon || "smile",
                            "w-4 h-4 text-white"
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-bold text-xs text-white">
                              {log.profile?.name || "Profile"}
                            </span>
                            {renderActionBadge(log.action)}
                            <span className="text-[11px] text-zinc-500 ml-auto">
                              {formatRelativeTime(log.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {log.details}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Per-Profile Watch Progress & Active Sessions */}
              <div className="bg-[#141414] border border-zinc-800 rounded-xl p-4 flex flex-col">
                <div className="pb-3 mb-3 border-b border-zinc-800">
                  <h3 className="font-bold text-sm md:text-base text-white">
                    Watch History by Profile
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Playback progress &amp; completion status per user
                  </p>
                </div>

                <div className="space-y-4 max-h-[430px] overflow-y-auto pr-1">
                  {adminProfiles
                    .filter(
                      (p) =>
                        selectedProfileFilter === "ALL" ||
                        p.id === selectedProfileFilter
                    )
                    .map((prof) => (
                      <div
                        key={`hist-${prof.id}`}
                        className="bg-[#181818] border border-zinc-800 rounded-lg p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded flex items-center justify-center"
                              style={{
                                background: `linear-gradient(145deg, ${prof.avatarColor}, #111111 150%)`,
                              }}
                            >
                              {renderProfileIcon(
                                prof.avatarIcon,
                                "w-3.5 h-3.5 text-white"
                              )}
                            </div>
                            <span className="font-bold text-xs text-white">
                              {prof.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400">
                            {prof.watchProgress.length} title
                            {prof.watchProgress.length === 1 ? "" : "s"}
                          </span>
                        </div>

                        {prof.watchProgress.length === 0 ? (
                          <div className="text-xs text-zinc-500 py-2">
                            No watch history yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {prof.watchProgress.slice(0, 6).map((wp) => {
                              const pct =
                                wp.durationSeconds > 0
                                  ? Math.min(
                                      100,
                                      Math.round(
                                        (wp.positionSeconds /
                                          wp.durationSeconds) *
                                          100
                                      )
                                    )
                                  : 0;
                              return (
                                <div
                                  key={wp.id}
                                  className="bg-[#121212] border border-zinc-800/80 rounded p-2 text-xs"
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="font-semibold text-zinc-200 truncate">
                                      {wp.mediaItem.title}
                                      {wp.episode
                                        ? ` S${wp.episode.seasonNumber}:E${wp.episode.episodeNumber}`
                                        : ""}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold shrink-0 ${
                                        wp.completed
                                          ? "text-emerald-400"
                                          : "text-[#3B82F6]"
                                      }`}
                                    >
                                      {wp.completed ? "Done" : `${pct}%`}
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        wp.completed
                                          ? "bg-emerald-500"
                                          : "bg-[#2563EB]"
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <div className="text-[10px] text-zinc-500 mt-1 flex justify-between">
                                    <span>
                                      {Math.floor(wp.positionSeconds / 60)}m /{" "}
                                      {Math.floor(wp.durationSeconds / 60)}m
                                    </span>
                                    <span>
                                      {formatRelativeTime(wp.updatedAt)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>
        ) : activeTab === "folders" ? (
          /* ==========================================
             TAB 2: PER-USER-PROFILE STORAGE LOCATIONS
             ========================================== */
          <>
            {/* Top Explanation & Scan All Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] border border-zinc-800 rounded-lg p-4">
              <div>
                <h3 className="font-bold text-sm md:text-base text-white">
                  Storage Locations per User Profile
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Assign local disk folders (<code className="text-zinc-200">.mp4</code>,{" "}
                  <code className="text-zinc-200">.mkv</code>,{" "}
                  <code className="text-zinc-200">.webm</code>,{" "}
                  <code className="text-zinc-200">.avi</code>) to specific user
                  profiles or share them across all profiles. Editing a storage
                  location updates which profile can access those files.
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
                    ? "Scanning All Storage..."
                    : "Scan All Storage Locations"}
                </span>
              </button>
            </div>

            {/* Filter Strip by User Profile */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStorageProfileFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  storageProfileFilter === "ALL"
                    ? "bg-[#2563EB] border-[#2563EB] text-white"
                    : "bg-[#141414] border-zinc-800 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                All Storage ({folders.length})
              </button>
              <button
                onClick={() => setStorageProfileFilter("SHARED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  storageProfileFilter === "SHARED"
                    ? "bg-[#2563EB] border-[#2563EB] text-white"
                    : "bg-[#141414] border-zinc-800 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                Shared / Global ({folders.filter((f) => !f.profileId).length})
              </button>
              {adminProfiles.map((prof) => {
                const count = folders.filter(
                  (f) => f.profileId === prof.id
                ).length;
                return (
                  <button
                    key={`filter-prof-${prof.id}`}
                    onClick={() => {
                      setStorageProfileFilter(prof.id);
                      setFolderProfileId(prof.id);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      storageProfileFilter === prof.id
                        ? "bg-[#2563EB] border-[#2563EB] text-white"
                        : "bg-[#141414] border-zinc-800 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: prof.avatarColor }}
                    >
                      {renderProfileIcon(
                        prof.avatarIcon,
                        "w-2.5 h-2.5 text-white"
                      )}
                    </span>
                    <span>
                      {prof.name} ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Storage Locations List with Inline Edit Support */}
            <div className="space-y-3">
              {filteredFolders.length === 0 ? (
                <div className="bg-[#141414] border border-zinc-800 rounded-lg p-8 text-center text-sm text-zinc-400">
                  No storage locations assigned to this filter yet. Use the form
                  below to add a storage folder for this user profile.
                </div>
              ) : (
                filteredFolders.map((folder) => {
                  const isEditingThis = editingFolderId === folder.id;
                  return (
                    <div
                      key={folder.id}
                      className="bg-[#141414] border border-zinc-800 rounded-lg p-4"
                    >
                      {isEditingThis ? (
                        <form
                          onSubmit={handleSaveFolderEdit}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                              Editing Storage Location
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingFolderId(null)}
                              className="text-xs text-zinc-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                Assigned User Profile
                              </label>
                              <select
                                value={editFolderProfileId}
                                onChange={(e) =>
                                  setEditFolderProfileId(e.target.value)
                                }
                                className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#2563EB] rounded px-3 py-2 text-xs text-white outline-none"
                              >
                                <option value="ALL">
                                  Shared (All User Profiles)
                                </option>
                                {adminProfiles.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} {p.isKids ? "(Kids)" : ""}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                Display Name
                              </label>
                              <input
                                type="text"
                                value={editFolderName}
                                onChange={(e) =>
                                  setEditFolderName(e.target.value)
                                }
                                required
                                className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#2563EB] rounded px-3 py-2 text-xs text-white outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                Folder Path on Disk
                              </label>
                              <input
                                type="text"
                                value={editFolderPath}
                                onChange={(e) =>
                                  setEditFolderPath(e.target.value)
                                }
                                required
                                className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#2563EB] rounded px-3 py-2 text-xs text-white outline-none font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                Content Type
                              </label>
                              <select
                                value={editFolderType}
                                onChange={(e) =>
                                  setEditFolderType(
                                    e.target.value as
                                      | "MOVIE"
                                      | "SERIES"
                                      | "MIXED"
                                  )
                                }
                                className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#2563EB] rounded px-3 py-2 text-xs text-white outline-none"
                              >
                                <option value="MIXED">
                                  Auto-Detect (Movies &amp; TV)
                                </option>
                                <option value="MOVIE">Movies Only</option>
                                <option value="SERIES">
                                  TV Series (S01E01)
                                </option>
                              </select>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingFolderId(null)}
                              className="px-3 py-1.5 rounded border border-zinc-700 text-xs text-zinc-300 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={savingFolderEdit}
                              className="px-4 py-1.5 rounded bg-[#2563EB] hover:bg-[#3B82F6] text-xs font-bold text-white"
                            >
                              {savingFolderEdit
                                ? "Saving & Scanning..."
                                : "Save Storage Location"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <FolderOpen className="w-4 h-4 text-[#3B82F6] shrink-0" />
                              <span className="font-bold text-sm md:text-base text-white">
                                {folder.name}
                              </span>

                              {/* Assigned Profile Badge */}
                              {folder.profile ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2563EB]/20 text-blue-200 border border-[#2563EB]/50">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                                    style={{
                                      backgroundColor:
                                        folder.profile.avatarColor,
                                    }}
                                  >
                                    {renderProfileIcon(
                                      folder.profile.avatarIcon,
                                      "w-2.5 h-2.5 text-white"
                                    )}
                                  </span>
                                  <span>Profile: {folder.profile.name}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                                  <Users className="w-3 h-3 text-zinc-400" />
                                  <span>Shared (All Profiles)</span>
                                </span>
                              )}

                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                {folder.mediaType}
                              </span>
                              <span className="text-xs text-emerald-400 font-medium">
                                {folder.itemCount} video files
                              </span>
                            </div>
                            <code className="text-xs text-zinc-400 block mt-1.5 truncate">
                              {folder.path}
                            </code>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => startEditFolder(folder)}
                              className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded border border-zinc-700 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5 text-[#3B82F6]" />
                              <span>Edit Path / Profile</span>
                            </button>

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
                              title="Remove storage location"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add New Storage Location per Profile Form */}
            <form
              onSubmit={handleAddFolder}
              className="bg-[#141414] border border-zinc-800 rounded-lg p-5"
            >
              <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
                <FolderPlus className="w-4 h-4 text-[#2563EB]" />
                <span>Add Storage Location for User Profile</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Assign to User Profile
                  </label>
                  <select
                    value={folderProfileId}
                    onChange={(e) => setFolderProfileId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="ALL">Shared (All User Profiles)</option>
                    {adminProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.isKids ? "(Kids)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Storage Display Name
                  </label>
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="e.g. Alex's 4K Movies"
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
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-white rounded px-3 py-2 text-sm text-white outline-none font-mono"
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
                    <option value="MIXED">Auto-Detect (Movies &amp; TV)</option>
                    <option value="MOVIE">Movies Only</option>
                    <option value="SERIES">TV Series (S01E01)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={scanningId !== null}
                className="bg-[#2563EB] hover:bg-[#3B82F6] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded transition-colors"
              >
                {scanningId === "adding"
                  ? "Adding & Scanning Storage..."
                  : "Add & Scan Storage Location"}
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
                <label className="block text-xs text-zinc-400 mb-1">Cast</label>
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

            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span>Feature on Hero Billboard Banner</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsCreatingMedia(false);
                }}
                className="px-4 py-2 text-sm border border-zinc-600 text-zinc-300 rounded hover:border-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingMedia}
                className="px-6 py-2 text-sm bg-[#2563EB] hover:bg-[#3B82F6] text-white font-bold rounded transition-colors"
              >
                {savingMedia ? "Saving..." : "Save Metadata"}
              </button>
            </div>
          </form>
        ) : (
          /* Media Catalog Table + Bulk IMDb Sync */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-zinc-400">
                Fetch official posters, cast, plot synopses, and ratings from
                IMDb or customize any title manually.
              </p>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleSyncImdbItem()}
                  disabled={syncingImdbId !== null}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs sm:text-sm px-4 py-2 rounded transition-colors"
                >
                  <Sparkles
                    className={`w-4 h-4 ${
                      syncingImdbId === "all" ? "animate-spin" : ""
                    }`}
                  />
                  <span>
                    {syncingImdbId === "all"
                      ? "Syncing All with IMDb..."
                      : "Sync All Posters & Info from IMDb"}
                  </span>
                </button>

                <button
                  onClick={startCreateMedia}
                  className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm px-4 py-2 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Custom Title</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg overflow-hidden">
              {media.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-4 p-3.5 bg-zinc-900/40 hover:bg-zinc-900/80 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.posterUrl || m.backdropUrl}
                      alt={m.title}
                      className="w-12 h-16 object-cover rounded bg-zinc-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate">
                          {m.title}
                        </span>
                        {m.isFeatured && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">
                            <Star className="w-2.5 h-2.5 fill-amber-300" />
                            BILLBOARD
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-2 mt-0.5">
                        <span>{m.type}</span>
                        <span>•</span>
                        <span>{m.releaseYear}</span>
                        <span>•</span>
                        <span>{m.resolution}</span>
                        {m.filePath && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-mono truncate max-w-[240px]">
                              {m.filePath}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleSyncImdbItem(m.id)}
                      disabled={syncingImdbId !== null}
                      className="flex items-center gap-1 text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded transition-colors"
                      title="Fetch official poster & metadata from IMDb"
                    >
                      <Sparkles
                        className={`w-3.5 h-3.5 ${
                          syncingImdbId === m.id ? "animate-spin" : ""
                        }`}
                      />
                      <span className="hidden sm:inline">IMDb Sync</span>
                    </button>

                    <button
                      onClick={() => setEditingItem(m)}
                      className="flex items-center gap-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded border border-zinc-700"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteMedia(m.id, m.title)}
                      className="p-1.5 text-zinc-400 hover:text-red-400"
                      title="Delete title"
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
  );

  const profileModals = (
    <>
      {/* 1. Create Profile Modal */}
      {isCreatingProfile && (
        <div
          onClick={() => setIsCreatingProfile(false)}
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#3B82F6]" />
                <h3 className="font-bold text-lg text-white">Create New Profile</h3>
              </div>
              <button
                onClick={() => setIsCreatingProfile(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createProfileError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{createProfileError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProfile} className="space-y-4">
              {/* Avatar Preview & Customization */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <div
                  className="relative w-20 h-20 rounded-xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden ring-2 ring-white/10"
                  style={{
                    background: `linear-gradient(145deg, ${newProfileColor}, #0a0a0a 160%)`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                  <div className="text-white drop-shadow">
                    {renderProfileIcon(newProfileIcon, "w-14 h-14")}
                  </div>
                  {newProfileIsKids && (
                    <span className="absolute bottom-1 right-1 bg-amber-400 text-black font-black text-[9px] px-1 py-0.2 rounded uppercase">
                      KIDS
                    </span>
                  )}
                  {newProfileIsAdmin && (
                    <span className="absolute bottom-1 right-1 bg-[#2563EB] text-white font-black text-[9px] px-1 py-0.2 rounded uppercase">
                      ADMIN
                    </span>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2.5">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>Avatar Color</span>
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {AVATAR_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewProfileColor(c)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            newProfileColor === c
                              ? "ring-2 ring-white scale-110"
                              : "opacity-75 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNewAvatarPicker((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 rounded border border-zinc-700 transition-colors"
                  >
                    <Smile className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>
                      {showNewAvatarPicker ? "Hide Picker" : "Emblem / Emoji"}
                    </span>
                  </button>
                </div>
              </div>

              {showNewAvatarPicker && (
                <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl max-h-56 overflow-y-auto">
                  <AvatarPicker
                    selectedId={newProfileIcon}
                    onSelect={(id) => {
                      setNewProfileIcon(id);
                      setShowNewAvatarPicker(false);
                    }}
                  />
                </div>
              )}

              {/* Profile Name & Funny Name Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Profile Name
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewProfileName(generateFunnyName());
                      setNewProfileFunnySuggestions(
                        generateFunnyNameSuggestions(3)
                      );
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#3B82F6] hover:text-blue-300 transition-colors"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Funny Name</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Enter profile name"
                    required
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 focus:border-[#2563EB] rounded-lg text-white text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNewProfileName(generateFunnyName());
                      setNewProfileFunnySuggestions(
                        generateFunnyNameSuggestions(3)
                      );
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#3B82F6] p-1 rounded"
                  >
                    <Dices className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-zinc-500 font-medium mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#3B82F6]" />
                    Ideas:
                  </span>
                  {newProfileFunnySuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setNewProfileName(sug);
                        setNewProfileFunnySuggestions(
                          generateFunnyNameSuggestions(3)
                        );
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-[#2563EB]/30 hover:border-[#2563EB]/60 text-zinc-300 hover:text-white border border-zinc-700 transition-all font-medium"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roles: Administrator & Kids Mode */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProfileIsAdmin}
                    onChange={(e) => {
                      setNewProfileIsAdmin(e.target.checked);
                      if (e.target.checked) setNewProfileIsKids(false);
                    }}
                    className="mt-0.5 w-4 h-4 accent-[#2563EB] rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>Server Administrator</span>
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Grants access to Admin Settings, library storage folders, and profile management.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 cursor-pointer ${
                    newProfileIsAdmin ? "opacity-40 pointer-events-none" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={newProfileIsKids}
                    onChange={(e) => setNewProfileIsKids(e.target.checked)}
                    disabled={newProfileIsAdmin}
                    className="mt-0.5 w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-300">
                      Kids Profile
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Restricts catalog to child-safe titles rated G, PG, TV-Y, and TV-Y7.
                    </p>
                  </div>
                </label>
              </div>

              {/* Password Protection */}
              <div className="pt-2 border-t border-zinc-800">
                <label className="text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Profile Password (Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type={newProfileShowPassword ? "text" : "password"}
                    value={newProfilePassword}
                    onChange={(e) => setNewProfilePassword(e.target.value)}
                    placeholder="Leave empty for no password"
                    className="w-full px-3 py-2 pr-10 bg-zinc-900 border border-zinc-700 focus:border-[#2563EB] rounded-lg text-white text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setNewProfileShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {newProfileShowPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingProfile(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProfile || !newProfileName.trim()}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creatingProfile ? "Creating..." : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Profile Modal */}
      {editingProfileItem && (
        <div
          onClick={() => setEditingProfileItem(null)}
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#3B82F6]" />
                <h3 className="font-bold text-lg text-white">
                  Edit Profile: {editingProfileItem.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingProfileItem(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editProfileError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{editProfileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditProfile} className="space-y-4">
              {/* Avatar Preview & Customization */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <div
                  className="relative w-20 h-20 rounded-xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden ring-2 ring-white/10"
                  style={{
                    background: `linear-gradient(145deg, ${editProfileColor}, #0a0a0a 160%)`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                  <div className="text-white drop-shadow">
                    {renderProfileIcon(editProfileIcon, "w-14 h-14")}
                  </div>
                  {editProfileIsKids && (
                    <span className="absolute bottom-1 right-1 bg-amber-400 text-black font-black text-[9px] px-1 py-0.2 rounded uppercase">
                      KIDS
                    </span>
                  )}
                  {editProfileIsAdmin && (
                    <span className="absolute bottom-1 right-1 bg-[#2563EB] text-white font-black text-[9px] px-1 py-0.2 rounded uppercase">
                      ADMIN
                    </span>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2.5">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>Avatar Color</span>
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {AVATAR_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditProfileColor(c)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            editProfileColor === c
                              ? "ring-2 ring-white scale-110"
                              : "opacity-75 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowEditAvatarPicker((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 rounded border border-zinc-700 transition-colors"
                  >
                    <Smile className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>
                      {showEditAvatarPicker ? "Hide Picker" : "Emblem / Emoji"}
                    </span>
                  </button>
                </div>
              </div>

              {showEditAvatarPicker && (
                <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl max-h-56 overflow-y-auto">
                  <AvatarPicker
                    selectedId={editProfileIcon}
                    onSelect={(id) => {
                      setEditProfileIcon(id);
                      setShowEditAvatarPicker(false);
                    }}
                  />
                </div>
              )}

              {/* Profile Name & Funny Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Profile Name
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditProfileName(generateFunnyName());
                      setEditProfileFunnySuggestions(
                        generateFunnyNameSuggestions(3)
                      );
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#3B82F6] hover:text-blue-300 transition-colors"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Funny Name</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={editProfileName}
                    onChange={(e) => setEditProfileName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 focus:border-[#2563EB] rounded-lg text-white text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditProfileName(generateFunnyName());
                      setEditProfileFunnySuggestions(
                        generateFunnyNameSuggestions(3)
                      );
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#3B82F6] p-1 rounded"
                  >
                    <Dices className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-zinc-500 font-medium mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#3B82F6]" />
                    Ideas:
                  </span>
                  {editProfileFunnySuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setEditProfileName(sug);
                        setEditProfileFunnySuggestions(
                          generateFunnyNameSuggestions(3)
                        );
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-[#2563EB]/30 hover:border-[#2563EB]/60 text-zinc-300 hover:text-white border border-zinc-700 transition-all font-medium"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roles: Administrator & Kids Mode */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editProfileIsAdmin}
                    onChange={(e) => {
                      setEditProfileIsAdmin(e.target.checked);
                      if (e.target.checked) setEditProfileIsKids(false);
                    }}
                    className="mt-0.5 w-4 h-4 accent-[#2563EB] rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>Server Administrator</span>
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Grants access to Admin Settings, library storage folders, and profile management.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 cursor-pointer ${
                    editProfileIsAdmin ? "opacity-40 pointer-events-none" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={editProfileIsKids}
                    onChange={(e) => setEditProfileIsKids(e.target.checked)}
                    disabled={editProfileIsAdmin}
                    className="mt-0.5 w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-300">
                      Kids Profile
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Restricts catalog to child-safe titles rated G, PG, TV-Y, and TV-Y7.
                    </p>
                  </div>
                </label>
              </div>

              {/* Admin Password Management (Reset without old password) */}
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>Password Management (Admin Override)</span>
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {editingProfileItem.hasPassword
                      ? "Currently Protected"
                      : "No Password"}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={editProfileShowPassword ? "text" : "password"}
                    value={editProfileNewPassword}
                    onChange={(e) => setEditProfileNewPassword(e.target.value)}
                    placeholder={
                      editingProfileItem.hasPassword
                        ? "Enter new password to reset"
                        : "Set new password (optional)"
                    }
                    disabled={editProfileRemovePassword}
                    className="w-full px-3 py-2 pr-10 bg-zinc-900 border border-zinc-700 focus:border-[#2563EB] rounded-lg text-white text-sm outline-none disabled:opacity-40"
                  />
                  <button
                    type="button"
                    onClick={() => setEditProfileShowPassword((v) => !v)}
                    disabled={editProfileRemovePassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white disabled:opacity-30"
                  >
                    {editProfileShowPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {editingProfileItem.hasPassword && (
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={editProfileRemovePassword}
                      onChange={(e) => {
                        setEditProfileRemovePassword(e.target.checked);
                        if (e.target.checked) setEditProfileNewPassword("");
                      }}
                      className="w-3.5 h-3.5 accent-red-500 rounded"
                    />
                    <span className="text-xs text-red-300">
                      Remove password protection from this profile
                    </span>
                  </label>
                )}

                <p className="text-[10px] text-zinc-500 leading-normal">
                  As an administrator on localhost, you can reset or clear any
                  user&apos;s password without entering their current password.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingProfileItem(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile || !editProfileName.trim()}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Profile Confirmation Dialog */}
      {deletingProfileItem && (
        <div
          onClick={() => setDeletingProfileItem(null)}
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181b] border border-red-900/60 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-800 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  Delete Profile: {deletingProfileItem.name}?
                </h3>
                <span className="text-xs text-zinc-400">
                  This action is permanent and cannot be undone.
                </span>
              </div>
            </div>

            {deleteProfileError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{deleteProfileError}</span>
              </div>
            )}

            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              Deleting &quot;{deletingProfileItem.name}&quot; will remove all of
              their watch progress history, My List items, custom playlists, and
              unassign their private storage folders.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProfileItem(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProfile}
                disabled={deletingProfile}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md shadow-red-700/30 disabled:opacity-50"
              >
                {deletingProfile ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (standalone) {
    return (
      <div className="min-h-screen bg-[#141414] p-4 sm:p-8 select-none">
        {innerDashboard}
        {profileModals}
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 overflow-y-auto flex justify-center p-3 sm:p-6 md:p-10 select-none"
    >
      {innerDashboard}
      {profileModals}
    </div>
  );
}

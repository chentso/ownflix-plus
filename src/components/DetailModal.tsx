"use client";

import React, { useState, useMemo, useEffect } from "react";
import { MediaItem, Episode } from "@/types/ownflix";
import {
  X,
  Play,
  Plus,
  Check,
  HardDrive,
  Volume2,
  Subtitles,
  Pencil,
  RotateCcw,
  Search,
  ListPlus,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface DetailModalProps {
  item: MediaItem;
  allMedia: MediaItem[];
  onClose: () => void;
  onPlay: (item: MediaItem, episode?: Episode, startFromBeginning?: boolean) => void;
  onToggleMyList: (item: MediaItem) => void;
  onSelectMedia: (item: MediaItem) => void;
  onEditItem: (item: MediaItem) => void;
  onIdentifyItem?: (item: MediaItem) => void;
  onAddToPlaylist?: (item: MediaItem) => void;
  onToggleMarkDeletion?: (item: MediaItem) => void;
}

function formatDurationMin(sec: number): string {
  if (!sec || sec <= 0) return "12m";
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${sec}s`;
}

export default function DetailModal({
  item,
  allMedia,
  onClose,
  onPlay,
  onToggleMyList,
  onSelectMedia,
  onEditItem,
  onIdentifyItem,
  onAddToPlaylist,
  onToggleMarkDeletion,
}: DetailModalProps) {
  const seasons = useMemo(() => {
    const set = new Set<number>();
    item.episodes.forEach((ep) => set.add(ep.seasonNumber));
    return Array.from(set).sort((a, b) => a - b);
  }, [item.episodes]);

  const [selectedSeason, setSelectedSeason] = useState<number>(
    seasons[0] || 1
  );

  const seasonEpisodes = useMemo(
    () =>
      item.episodes.filter((ep) => ep.seasonNumber === selectedSeason),
    [item.episodes, selectedSeason]
  );

  const similarItems = useMemo(() => {
    const primaryGenre = item.genres.split(",")[0]?.trim().toLowerCase() || "";
    return allMedia
      .filter(
        (m) =>
          m.id !== item.id &&
          (m.genres.toLowerCase().includes(primaryGenre) || m.type === item.type)
      )
      .slice(0, 6);
  }, [allMedia, item]);

  const hasProgress =
    item.progress &&
    item.progress.positionSeconds > 3 &&
    !item.progress.completed;

  const isMkv = item.filePath?.toLowerCase().endsWith(".mkv");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
        e.preventDefault();
        onPlay(item, seasonEpisodes[0] || item.episodes[0]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose, onPlay, seasonEpisodes]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto flex justify-center p-3 sm:p-6 md:p-10 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#181818] text-white rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl border border-zinc-800 my-auto"
      >
        {/* Top Hero Banner */}
        <div className="relative aspect-video w-full max-h-[460px] bg-zinc-900 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.backdropUrl || item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/30 to-black/30" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#181818]/90 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Identify & Edit Metadata Quick Buttons */}
          <div className="absolute top-4 right-16 flex items-center gap-2 z-10">
            {onIdentifyItem && (
              <button
                onClick={() => onIdentifyItem(item)}
                className="px-3 py-1.5 rounded-full bg-[#2563EB]/90 hover:bg-[#3B82F6] text-white text-xs font-semibold flex items-center gap-1.5 border border-blue-400/40 shadow-lg transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Identify / Search IMDb</span>
              </button>
            )}
            <button
              onClick={() => onEditItem(item)}
              className="px-3 py-1.5 rounded-full bg-[#181818]/90 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 border border-zinc-700 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Metadata</span>
            </button>
          </div>

          {/* Bottom Left Title & Buttons */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#2563EB] text-white font-black text-xs px-1.5 py-0.5 rounded-sm">
                O+
              </span>
              <span className="text-xs font-bold tracking-[0.2em] text-zinc-300 uppercase">
                {item.type === "SERIES" ? "OWNFLIX+ SERIES" : "OWNFLIX+ FILM"}
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4 drop-shadow">
              {item.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onPlay(item)}
                className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black font-bold px-6 py-2.5 rounded text-sm md:text-base transition-colors"
              >
                <Play className="w-5 h-5 fill-black" />
                <span>
                  {hasProgress
                    ? item.progress?.episode
                      ? `Resume S${item.progress.episode.seasonNumber}:E${item.progress.episode.episodeNumber}`
                      : "Resume"
                    : "Play"}
                </span>
              </button>

              {hasProgress && (
                <button
                  onClick={() => onPlay(item, undefined, true)}
                  className="flex items-center gap-2 bg-zinc-700/80 hover:bg-zinc-600 text-white font-semibold px-4 py-2.5 rounded text-sm transition-colors"
                  title="Start from beginning"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>From Start</span>
                </button>
              )}

              <button
                onClick={() => onToggleMyList(item)}
                className="w-10 h-10 rounded-full border-2 border-zinc-400 hover:border-white bg-black/50 text-white flex items-center justify-center transition-colors"
                title={
                  item.inMyList ? "Remove from My List" : "Add to My List"
                }
              >
                {item.inMyList ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </button>

              {onAddToPlaylist && (
                <button
                  onClick={() => onAddToPlaylist(item)}
                  className="w-10 h-10 rounded-full border-2 border-zinc-400 hover:border-[#3B82F6] bg-black/50 text-zinc-300 hover:text-[#3B82F6] flex items-center justify-center transition-colors shadow"
                  title="Add to Custom Playlist"
                >
                  <ListPlus className="w-5 h-5" />
                </button>
              )}

              {onToggleMarkDeletion && (
                <button
                  onClick={() => onToggleMarkDeletion(item)}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors shadow ${
                    item.markedForDeletion
                      ? "border-red-500 bg-red-950/80 text-red-300 hover:bg-red-900"
                      : "border-zinc-400 hover:border-red-400 bg-black/50 text-zinc-300 hover:text-red-400"
                  }`}
                  title={
                    item.markedForDeletion
                      ? "Marked for deletion (Click to unmark)"
                      : "Mark for deletion (Watched once)"
                  }
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {item.markedForDeletion && (
              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-950/85 border border-red-800 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  Marked for deletion &bull; Flagged for disk cleanup after single viewing
                  {item.markedForDeletionBy ? ` by ${item.markedForDeletionBy}` : ""}
                </span>
                {onToggleMarkDeletion && (
                  <button
                    onClick={() => onToggleMarkDeletion(item)}
                    className="ml-2 underline text-red-300 hover:text-white font-medium"
                  >
                    Unmark
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Info Body */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            {/* Official IMDb Poster Column */}
            <div className="hidden md:block">
              <div className="aspect-[2/3] w-full rounded-lg overflow-hidden border border-zinc-800 shadow-xl bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.posterUrl || item.backdropUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Center 2 Columns: Overview & Badges */}
            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold mb-4">
                <span className="text-[#46d369]">
                  {item.matchScore}% Match
                </span>
                <span className="text-zinc-300">{item.releaseYear}</span>
                <span className="border border-zinc-500 px-1.5 py-0.2 text-xs text-zinc-200">
                  {item.maturityRating}
                </span>
                <span className="text-zinc-300">
                  {item.type === "SERIES"
                    ? `${item.episodes.length} Episodes`
                    : formatDurationMin(item.duration)}
                </span>
                <span className="border border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-300">
                  {item.resolution}
                </span>
              </div>

              <p className="text-zinc-200 text-sm md:text-base leading-relaxed mb-5">
                {item.overview}
              </p>

              {/* Technical Stream Info Pill */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-800 rounded-lg p-3">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-[#2563EB]" />
                  <span>
                    Source:{" "}
                    <strong className="text-zinc-200">
                      {item.filePath
                        ? isMkv
                          ? "Local MKV (FFmpeg Live Remux)"
                          : "Local Disk (HTTP 206 Byte-Range)"
                        : "Built-In Direct Stream"}
                    </strong>
                  </span>
                </div>
                <span className="text-zinc-700">|</span>
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-zinc-400" />
                  <span className="truncate max-w-[200px]">
                    {item.audioTracks.split(",")[0]}
                  </span>
                </div>
                <span className="text-zinc-700">|</span>
                <div className="flex items-center gap-1.5">
                  <Subtitles className="w-4 h-4 text-zinc-400" />
                  <span>{item.subtitleTracks}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Cast, Genres, Director */}
            <div className="text-xs md:text-sm space-y-2.5 text-zinc-400">
              {item.cast && (
                <div>
                  <span className="text-zinc-500">Cast: </span>
                  <span className="text-zinc-200">{item.cast}</span>
                </div>
              )}
              <div>
                <span className="text-zinc-500">Genres: </span>
                <span className="text-zinc-200">{item.genres}</span>
              </div>
              {item.director && (
                <div>
                  <span className="text-zinc-500">Director: </span>
                  <span className="text-zinc-200">{item.director}</span>
                </div>
              )}
              {item.filePath && (
                <div className="pt-1">
                  <span className="text-zinc-500 block mb-0.5">
                    Disk Path:
                  </span>
                  <code className="text-[11px] text-emerald-400 bg-zinc-900 px-2 py-1 rounded block break-all">
                    {item.filePath}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* Episodes List (if SERIES) */}
          {item.type === "SERIES" && item.episodes.length > 0 && (
            <div className="mt-8 pt-6 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Episodes</h3>
                {seasons.length > 1 && (
                  <select
                    value={selectedSeason}
                    onChange={(e) =>
                      setSelectedSeason(Number(e.target.value))
                    }
                    className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white outline-none"
                  >
                    {seasons.map((s) => (
                      <option key={s} value={s}>
                        Season {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                {seasonEpisodes.map((ep) => {
                  const isCurrentEp = item.progress?.episodeId === ep.id;
                  return (
                    <div
                      key={ep.id}
                      onClick={() => onPlay(item, ep)}
                      className={`group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-lg cursor-pointer transition-colors ${
                        isCurrentEp
                          ? "bg-zinc-800/90 border border-zinc-700"
                          : "hover:bg-zinc-800/50 border border-transparent"
                      }`}
                    >
                      <div className="text-xl font-bold text-zinc-500 w-7 text-center shrink-0 hidden sm:block">
                        {ep.episodeNumber}
                      </div>

                      <div className="relative w-full sm:w-40 aspect-video rounded overflow-hidden bg-zinc-900 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ep.thumbnailUrl || item.backdropUrl}
                          alt={ep.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-9 h-9 rounded-full border-2 border-white bg-black/60 flex items-center justify-center">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>
                        {ep.filePath && (
                          <span className="absolute top-1.5 left-1.5 bg-black/80 text-[9px] font-bold text-emerald-400 px-1.5 py-0.5 rounded">
                            {ep.filePath.toLowerCase().endsWith(".mkv")
                              ? "MKV"
                              : "MP4"}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold text-sm md:text-base text-white truncate">
                            {ep.episodeNumber}. {ep.title}
                          </h4>
                          <span className="text-xs text-zinc-400 shrink-0">
                            {formatDurationMin(ep.duration)}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-zinc-400 line-clamp-2">
                          {ep.overview}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* More Like This Grid */}
          {similarItems.length > 0 && (
            <div className="mt-8 pt-6 border-t border-zinc-800">
              <h3 className="text-xl font-bold mb-4">More Like This</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {similarItems.map((sim) => (
                  <div
                    key={sim.id}
                    onClick={() => onSelectMedia(sim)}
                    className="bg-[#222222] rounded-lg overflow-hidden cursor-pointer hover:ring-1 hover:ring-zinc-500 transition-all flex flex-col"
                  >
                    <div className="relative aspect-[2/3] bg-zinc-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sim.posterUrl || sim.backdropUrl}
                        alt={sim.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#222222] via-transparent to-transparent" />
                      <span className="absolute bottom-2 left-2.5 right-2.5 font-bold text-xs sm:text-sm text-white drop-shadow truncate">
                        {sim.title}
                      </span>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-xs mb-1.5">
                        <span className="text-[#46d369] font-bold">
                          {sim.matchScore}%
                        </span>
                        <span className="border border-zinc-600 px-1 text-[10px]">
                          {sim.maturityRating}
                        </span>
                        <span className="text-zinc-400 ml-auto">
                          {sim.releaseYear}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {sim.overview}
                      </p>
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

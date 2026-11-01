"use client";

import React, { useRef } from "react";
import { MediaItem } from "@/types/ownflix";
import {
  Play,
  Plus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  HardDrive,
} from "lucide-react";

interface MediaRowProps {
  title: string;
  subtitle?: string;
  items: MediaItem[];
  isContinueWatching?: boolean;
  onPlay: (item: MediaItem) => void;
  onMoreInfo: (item: MediaItem) => void;
  onToggleMyList: (item: MediaItem) => void;
  onRemoveContinueWatching?: (item: MediaItem) => void;
}

function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return "10m";
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${sec}s`;
}

export default function MediaRow({
  title,
  subtitle,
  items,
  isContinueWatching = false,
  onPlay,
  onMoreInfo,
  onToggleMyList,
  onRemoveContinueWatching,
}: MediaRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    const { scrollLeft, clientWidth } = rowRef.current;
    const offset = dir === "left" ? -clientWidth * 0.78 : clientWidth * 0.78;
    rowRef.current.scrollTo({
      left: scrollLeft + offset,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group/row mb-8 md:mb-11 select-none">
      {/* Row Header */}
      <div className="px-4 md:px-12 mb-2.5 flex items-baseline gap-3">
        <h2 className="text-lg md:text-xl font-bold text-zinc-100 tracking-tight group-hover/row:text-white transition-colors">
          {title}
        </h2>
        {subtitle && (
          <span className="text-xs text-zinc-400 font-medium">{subtitle}</span>
        )}
      </div>

      <div className="relative">
        {/* Left Scroll Button */}
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll Left"
          className="hidden md:flex absolute left-0 top-0 bottom-0 z-30 w-11 bg-black/55 hover:bg-black/80 items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-7 h-7 text-white" />
        </button>

        {/* Horizontal Poster Carousel */}
        <div
          ref={rowRef}
          className="flex items-stretch gap-3 md:gap-4 overflow-x-auto no-scrollbar px-4 md:px-12 py-3 scroll-smooth"
        >
          {items.map((item) => {
            const progressPct =
              item.progress && item.progress.durationSeconds > 0
                ? Math.min(
                    98,
                    Math.max(
                      4,
                      Math.round(
                        (item.progress.positionSeconds /
                          item.progress.durationSeconds) *
                          100
                      )
                    )
                  )
                : 0;

            const isMkv = item.filePath?.toLowerCase().endsWith(".mkv");

            return (
              <div
                key={item.id}
                className="group/card relative shrink-0 w-[165px] sm:w-[190px] md:w-[215px] rounded-md bg-[#181818] transition-all duration-300 hover:scale-105 hover:z-20 shadow-md hover:shadow-2xl overflow-hidden border border-zinc-800/70 hover:border-zinc-600 flex flex-col"
              >
                {/* 2:3 Vertical Poster Area */}
                <div
                  onClick={() => onPlay(item)}
                  className="relative aspect-[2/3] w-full overflow-hidden cursor-pointer bg-zinc-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.posterUrl || item.backdropUrl}
                    alt={item.title}
                    className="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-black/25 opacity-90" />

                  {/* Top-Left OwnFlix+ Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="bg-[#2563EB] text-white font-black text-[10px] px-1.5 py-0.5 rounded-sm shadow">
                      O+
                    </span>
                    {item.filePath && (
                      <span className="bg-black/80 backdrop-blur-sm border border-zinc-600 text-[9px] font-bold text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <HardDrive className="w-2.5 h-2.5" />
                        {isMkv ? "MKV" : "LOCAL"}
                      </span>
                    )}
                  </div>

                  {/* Top-Right Remove from Continue Watching */}
                  {isContinueWatching && onRemoveContinueWatching && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveContinueWatching(item);
                      }}
                      title="Remove from Continue Watching"
                      className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/80 hover:bg-black text-zinc-300 hover:text-white flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Center Hover Play Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity bg-black/35">
                    <div className="w-12 h-12 rounded-full bg-white/95 text-black flex items-center justify-center shadow-xl transform scale-90 group-hover/card:scale-100 transition-transform">
                      <Play className="w-6 h-6 fill-black ml-0.5" />
                    </div>
                  </div>

                  {/* Red Progress Bar if in progress */}
                  {progressPct > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
                      <div
                        className="h-full bg-[#2563EB]"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Card Details Footer */}
                <div className="p-3 bg-[#181818] flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => onMoreInfo(item)}
                      className="text-white font-bold text-sm truncate mb-2 cursor-pointer hover:text-zinc-300"
                      title={item.title}
                    >
                      {item.title}
                    </h3>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onPlay(item)}
                          className="w-7 h-7 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-colors"
                          title="Play"
                        >
                          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                        </button>

                        <button
                          onClick={() => onToggleMyList(item)}
                          className="w-7 h-7 rounded-full border border-zinc-500 hover:border-white text-white flex items-center justify-center transition-colors"
                          title={
                            item.inMyList
                              ? "Remove from My List"
                              : "Add to My List"
                          }
                        >
                          {item.inMyList ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <button
                        onClick={() => onMoreInfo(item)}
                        className="w-7 h-7 rounded-full border border-zinc-500 hover:border-white text-white flex items-center justify-center transition-colors"
                        title="Episodes & More Info"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    {/* Match %, Rating, Duration/Year */}
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold mb-1">
                      <span className="text-[#46d369]">
                        {item.matchScore}%
                      </span>
                      <span className="border border-zinc-600 px-1 text-[10px] text-zinc-300">
                        {item.maturityRating}
                      </span>
                      <span className="text-zinc-400 truncate">
                        {item.type === "SERIES" && item.episodes.length > 0
                          ? `${item.episodes.length} Ep`
                          : formatDuration(item.duration)}
                      </span>
                      <span className="text-zinc-500 ml-auto">
                        {item.releaseYear}
                      </span>
                    </div>

                    {/* Episode indicator if Continue Watching */}
                    {item.progress?.episode ? (
                      <p className="text-[11px] text-zinc-300 truncate font-medium">
                        S{item.progress.episode.seasonNumber}:E
                        {item.progress.episode.episodeNumber} &ldquo;
                        {item.progress.episode.title}&rdquo;
                      </p>
                    ) : (
                      <div className="text-[11px] text-zinc-400 truncate">
                        {item.genres
                          .split(",")
                          .slice(0, 2)
                          .map((g) => g.trim())
                          .join(" • ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll Right"
          className="hidden md:flex absolute right-0 top-0 bottom-0 z-30 w-11 bg-black/55 hover:bg-black/80 items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-7 h-7 text-white" />
        </button>
      </div>
    </div>
  );
}

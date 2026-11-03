"use client";

import React from "react";
import { MediaItem } from "@/types/ownflix";
import { Play, Info, Plus, Check, HardDrive } from "lucide-react";

interface HeroBillboardProps {
  item: MediaItem;
  onPlay: (item: MediaItem) => void;
  onMoreInfo: (item: MediaItem) => void;
  onToggleMyList: (item: MediaItem) => void;
  isTvMode?: boolean;
  focusedHeroBtnIndex?: number | null;
}

export default function HeroBillboard({
  item,
  onPlay,
  onMoreInfo,
  onToggleMyList,
  isTvMode = false,
  focusedHeroBtnIndex = null,
}: HeroBillboardProps) {
  const hasProgress =
    item.progress &&
    item.progress.positionSeconds > 5 &&
    !item.progress.completed;

  return (
    <section className="relative w-full h-[76vh] md:h-[85vh] min-h-[520px] max-h-[860px] overflow-hidden select-none">
      {/* Backdrop Image */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.backdropUrl}
          alt={item.title}
          className="w-full h-full object-cover object-center scale-105 animate-pulse-slow"
        />
        {/* Left & Bottom Netflix Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-4 md:px-12 pb-16 max-w-3xl">
        {/* OwnFlix+ Originals / Local Disk Badge */}
        <div className="flex items-center gap-2.5 mb-3">
          <span className="bg-[#2563EB] text-white font-black text-xs px-1.5 py-0.5 rounded-sm tracking-tighter">
            O+
          </span>
          <span className="text-xs md:text-sm font-bold tracking-[0.25em] text-zinc-300 uppercase">
            {item.filePath
              ? "LOCAL DISK DIRECT STREAM"
              : item.type === "SERIES"
              ? "OWNFLIX+ SERIES"
              : "OWNFLIX+ FILM"}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-lg leading-[1.05] mb-3">
          {item.title}
        </h1>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-semibold mb-4">
          <span className="text-[#46d369] font-bold">
            {item.matchScore}% Match
          </span>
          <span className="text-zinc-300">{item.releaseYear}</span>
          <span className="border border-zinc-500 px-1.5 py-0.2 text-zinc-200 text-xs">
            {item.maturityRating}
          </span>
          <span className="border border-zinc-600 bg-black/40 px-1.5 py-0.2 rounded text-[11px] text-zinc-300">
            {item.resolution}
          </span>
          {item.type === "SERIES" && item.episodes.length > 0 && (
            <span className="text-zinc-300">
              {item.episodes.length} Episodes
            </span>
          )}
          {item.filePath && (
            <span className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-[11px] px-2 py-0.5 rounded">
              <HardDrive className="w-3 h-3" />
              Local Disk
            </span>
          )}
        </div>

        {/* Synopsis */}
        <p className="text-zinc-200/90 text-sm md:text-base line-clamp-3 leading-relaxed max-w-2xl mb-6 drop-shadow">
          {item.overview}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3.5">
          <button
            onClick={() => onPlay(item)}
            className={`flex items-center gap-2.5 bg-white hover:bg-white/85 text-black font-bold px-6 md:px-8 py-2.5 md:py-3 rounded text-sm md:text-base transition-all shadow-lg ${
              isTvMode && focusedHeroBtnIndex === 0
                ? "ring-4 ring-[#2563EB] bg-[#3B82F6] text-white scale-110 shadow-[0_0_30px_rgba(37,99,235,1)]"
                : ""
            }`}
          >
            <Play className={`w-5 h-5 ${isTvMode && focusedHeroBtnIndex === 0 ? "fill-white text-white" : "fill-black"}`} />
            <span>{hasProgress ? "Resume" : "Play"}</span>
          </button>

          <button
            onClick={() => onMoreInfo(item)}
            className={`flex items-center gap-2.5 bg-zinc-500/70 hover:bg-zinc-500/50 text-white font-semibold px-6 md:px-7 py-2.5 md:py-3 rounded text-sm md:text-base backdrop-blur-sm transition-all ${
              isTvMode && focusedHeroBtnIndex === 1
                ? "ring-4 ring-[#2563EB] bg-[#2563EB] text-white scale-110 shadow-[0_0_30px_rgba(37,99,235,1)]"
                : ""
            }`}
          >
            <Info className="w-5 h-5" />
            <span>More Info</span>
          </button>

          <button
            onClick={() => onToggleMyList(item)}
            className={`flex items-center justify-center w-11 h-11 rounded-full border-2 border-zinc-400 hover:border-white bg-black/40 text-white transition-all ${
              isTvMode && focusedHeroBtnIndex === 2
                ? "ring-4 ring-[#2563EB] border-[#3B82F6] bg-[#2563EB] scale-115 shadow-[0_0_30px_rgba(37,99,235,1)]"
                : ""
            }`}
            title={item.inMyList ? "Remove from My List" : "Add to My List"}
          >
            {item.inMyList ? (
              <Check className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Right-side Maturity Pill */}
      <div className="hidden sm:flex absolute right-0 bottom-24 z-10 items-center bg-black/60 border-l-[3px] border-zinc-300 py-1.5 pl-3 pr-8 text-sm font-semibold text-zinc-200 backdrop-blur-sm">
        {item.maturityRating}
      </div>
    </section>
  );
}

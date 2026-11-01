"use client";

import React, { useState, useMemo } from "react";
import {
  ALL_AVATAR_ITEMS,
  AvatarCategory,
  AvatarItem,
  renderProfileIcon,
} from "@/lib/avatarCatalog";
import { Search, Sparkles, X } from "lucide-react";

interface AvatarPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

const CATEGORIES: { id: AvatarCategory; label: string; icon?: string }[] = [
  { id: "all", label: "All" },
  { id: "emblems", label: "Emblems" },
  { id: "emojis", label: "Emojis" },
  { id: "cinema", label: "Cinema" },
  { id: "characters", label: "Characters" },
  { id: "creatures", label: "Animals" },
  { id: "fun", label: "Fun & Vibes" },
];

export default function AvatarPicker({
  selectedId,
  onSelect,
  className = "",
}: AvatarPickerProps) {
  const [activeCategory, setActiveCategory] = useState<AvatarCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_AVATAR_ITEMS.filter((item) => {
      // Category filter
      if (activeCategory !== "all") {
        if (!item.categories.includes(activeCategory)) {
          return false;
        }
      }

      // Search filter
      if (q) {
        const matchesLabel = item.label.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesEmoji =
          item.type === "emoji" && item.emoji.toLowerCase().includes(q);
        return matchesLabel || matchesId || matchesEmoji;
      }

      return true;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Category Pills & Quick Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                  isActive
                    ? "bg-[#2563EB] text-white shadow-sm font-semibold"
                    : "bg-zinc-800/90 text-zinc-400 hover:text-white hover:bg-zinc-700/80 border border-zinc-700/60"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative shrink-0 w-full sm:w-44">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-zinc-900 border border-zinc-700/80 focus:border-[#3B82F6] rounded-md pl-8 pr-7 py-1 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Avatar Items Scrollable Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 p-2 bg-zinc-950/70 border border-zinc-800 rounded-lg max-h-64 sm:max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 select-none">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-zinc-500">
            No avatars matching &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected =
              selectedId === item.id ||
              (item.type === "emoji" && selectedId === item.emoji);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                title={item.label}
                className={`relative aspect-square rounded-lg flex items-center justify-center p-1 transition-all ${
                  isSelected
                    ? "bg-[#2563EB]/25 border-2 border-[#3B82F6] text-white shadow-lg scale-105"
                    : "bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600"
                }`}
              >
                {item.type === "emblem" ? (
                  <item.Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.8} />
                ) : (
                  <span className="text-2xl sm:text-3xl leading-none select-none">
                    {item.emoji}
                  </span>
                )}
                {isSelected && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#3B82F6] ring-1 ring-[#181818]" />
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
        <span>
          Showing {filteredItems.length} avatar{filteredItems.length === 1 ? "" : "s"}
        </span>
        <span className="italic">Click any emblem or emoji to choose</span>
      </div>
    </div>
  );
}

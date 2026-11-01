"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MediaItem } from "@/types/ownflix";
import {
  Search,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Film,
  HardDrive,
  SlidersHorizontal,
} from "lucide-react";

interface ImbdCandidate {
  imdbId: string;
  title: string;
  year: number | null;
  type: string;
  cast: string;
  posterUrl: string;
}

interface IdentifyMetadataModalProps {
  item: MediaItem;
  onClose: () => void;
  onUpdated: () => void;
  onOpenManualEditor: (item: MediaItem) => void;
}

export default function IdentifyMetadataModal({
  item,
  onClose,
  onUpdated,
  onOpenManualEditor,
}: IdentifyMetadataModalProps) {
  const [searchTitle, setSearchTitle] = useState(item.title);
  const [searchYear, setSearchYear] = useState(
    item.releaseYear ? String(item.releaseYear) : ""
  );
  const [imdbIdInput, setImdbIdInput] = useState("");
  const [candidates, setCandidates] = useState<ImbdCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const runSearch = useCallback(
    async (queryOverride?: string, yearOverride?: string) => {
      const q = (queryOverride ?? imdbIdInput.trim()) || searchTitle.trim();
      if (!q) return;

      setSearching(true);
      setError(null);
      try {
        const y = yearOverride !== undefined ? yearOverride : searchYear.trim();
        const url = `/api/imdb?mode=candidates&title=${encodeURIComponent(q)}${
          y ? `&year=${encodeURIComponent(y)}` : ""
        }`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to search IMDb");
          setCandidates([]);
        } else {
          setCandidates(data.candidates || []);
          if ((data.candidates || []).length === 0) {
            setError(`No matches found for "${q}". Try a different title or IMDb ID (e.g. tt0338564).`);
          }
        }
      } catch {
        setError("Network error while searching IMDb");
      } finally {
        setSearching(false);
      }
    },
    [imdbIdInput, searchTitle, searchYear]
  );

  // Run initial search when modal opens
  useEffect(() => {
    runSearch(item.title, item.releaseYear ? String(item.releaseYear) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const handleApplyCandidate = async (candidate: ImbdCandidate) => {
    setApplyingId(candidate.imdbId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/imdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaItemId: item.id,
          imdbId: candidate.imdbId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to apply metadata");
      } else {
        setSuccessMsg(
          `Updated to "${data.imdb?.title || candidate.title}" (${
            data.imdb?.year || candidate.year
          })!`
        );
        onUpdated();
        setTimeout(() => {
          onClose();
        }, 700);
      }
    } catch {
      setError("Failed to apply metadata");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181818] border border-zinc-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-white"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-[#141414] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles className="w-5 h-5 text-[#2563EB] shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold truncate">
                Identify & Correct Metadata
              </h2>
              <p className="text-xs text-zinc-400 truncate">
                Current: <strong className="text-zinc-200">{item.title}</strong>{" "}
                ({item.releaseYear})
                {item.filePath ? ` • ${item.filePath.split(/[\\/]/).pop()}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenManualEditor(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
              title="Open full manual field editor"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Edit Fields Manually</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Form Bar (Emby Identify style: Title, Year, or IMDb ID) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
          className="p-5 bg-zinc-900/60 border-b border-zinc-800 grid grid-cols-1 sm:grid-cols-12 gap-3"
        >
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Movie / Series Title
            </label>
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder="e.g. Infernal Affairs"
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#2563EB] rounded-lg px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Year
            </label>
            <input
              type="number"
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
              placeholder="Any"
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#2563EB] rounded-lg px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              IMDb ID (Optional)
            </label>
            <input
              type="text"
              value={imdbIdInput}
              onChange={(e) => setImdbIdInput(e.target.value)}
              placeholder="e.g. tt0338564"
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#2563EB] rounded-lg px-3 py-2 text-sm text-white font-mono outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={searching}
              className="w-full h-[38px] bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-50 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              {searching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Status Messages */}
        {error && (
          <div className="mx-6 mt-4 px-4 py-2.5 bg-red-950/80 border border-red-700/70 rounded-lg text-xs text-red-200">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 px-4 py-2.5 bg-emerald-950/80 border border-emerald-600/70 rounded-lg text-xs text-emerald-200 flex items-center gap-2 font-semibold">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Candidate Results Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {searching ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <RefreshCw className="w-7 h-7 animate-spin text-[#2563EB]" />
              <span className="text-sm">Searching IMDb catalog...</span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-16 text-center text-zinc-400">
              <Film className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
              <p className="text-sm">
                Enter a title, release year, or IMDb ID above to find matching
                posters and metadata.
              </p>
            </div>
          ) : (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Select Correct Match ({candidates.length} results) — Click a
                poster to apply metadata & artwork
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {candidates.map((cand) => {
                  const isApplying = applyingId === cand.imdbId;
                  return (
                    <button
                      key={cand.imdbId}
                      type="button"
                      disabled={Boolean(applyingId)}
                      onClick={() => handleApplyCandidate(cand)}
                      className="group text-left bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-[#2563EB] rounded-lg overflow-hidden flex flex-col transition-all hover:scale-[1.02] focus:outline-none"
                    >
                      <div className="relative aspect-[2/3] w-full bg-zinc-950 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cand.posterUrl}
                          alt={cand.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 bg-black/80 border border-zinc-700 text-[10px] font-mono text-zinc-300 px-1.5 py-0.5 rounded">
                          {cand.imdbId}
                        </div>
                        <div className="absolute inset-0 bg-[#2563EB]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center">
                          {isApplying ? (
                            <RefreshCw className="w-7 h-7 text-white animate-spin mb-1" />
                          ) : (
                            <Check className="w-8 h-8 text-white mb-1" />
                          )}
                          <span className="text-xs font-bold text-white">
                            {isApplying
                              ? "Applying Metadata..."
                              : "Apply This Match"}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug">
                            {cand.title}
                          </div>
                          {cand.cast && (
                            <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                              {cand.cast}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 pt-2 border-t border-zinc-800">
                          <span className="font-semibold text-zinc-300">
                            {cand.year || "N/A"}
                          </span>
                          <span className="truncate max-w-[90px] capitalize">
                            {cand.type}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {item.filePath && (
          <div className="px-6 py-3 bg-[#141414] border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-400 truncate">
            <HardDrive className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
            <span className="truncate font-mono">{item.filePath}</span>
          </div>
        )}
      </div>
    </div>
  );
}

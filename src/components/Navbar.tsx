"use client";

import React, { useState, useEffect, useRef } from "react";
import { Profile } from "@/types/ownflix";
import { renderProfileIcon } from "./ProfileGate";
import {
  Search,
  X,
  HardDrive,
  ChevronDown,
  FolderSync,
  LogOut,
  PlusCircle,
  KeyRound,
  Lock,
  Activity,
  Users,
} from "lucide-react";

export type NavCategory = "HOME" | "SERIES" | "MOVIES" | "LOCAL" | "MY_LIST" | "PLAYLISTS";

interface NavbarProps {
  activeProfile: Profile;
  profiles: Profile[];
  activeCategory: NavCategory;
  onSelectCategory: (cat: NavCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSwitchProfile: (profile: Profile) => void;
  onManageProfiles: () => void;
  onOpenAccountSettings: () => void;
  onOpenAdmin: (tab?: "profiles" | "activity" | "folders" | "media") => void;
}

export default function Navbar({
  activeProfile,
  profiles,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onSwitchProfile,
  onManageProfiles,
  onOpenAccountSettings,
  onOpenAdmin,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const h = window.location.hostname.toLowerCase();
      setIsLocalhost(
        h === "localhost" ||
          h === "127.0.0.1" ||
          h === "::1" ||
          h === "[::1]"
      );
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const navItems: { id: NavCategory; label: string }[] = [
    { id: "HOME", label: "Home" },
    { id: "SERIES", label: "TV Shows" },
    { id: "MOVIES", label: "Movies" },
    { id: "LOCAL", label: "Local Disk" },
    { id: "MY_LIST", label: "My List" },
    { id: "PLAYLISTS", label: "Playlists" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 px-4 md:px-12 h-16 md:h-[68px] flex items-center justify-between select-none ${
        scrolled
          ? "bg-[#141414]/95 backdrop-blur-md shadow-lg"
          : "bg-gradient-to-b from-black/85 via-black/40 to-transparent"
      }`}
    >
      {/* Left: Brand & Nav Links */}
      <div className="flex items-center gap-6 md:gap-10">
        <button
          onClick={() => {
            onSelectCategory("HOME");
            onSearchChange("");
          }}
          className="text-[#2563EB] font-black text-2xl md:text-3xl tracking-tighter focus:outline-none hover:opacity-90 transition-opacity"
        >
          OWNFLIX+
        </button>

        <nav className="hidden md:flex items-center gap-5 text-sm">
          {navItems.map((item) => {
            const isActive = activeCategory === item.id && !searchQuery;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectCategory(item.id);
                  onSearchChange("");
                }}
                className={`transition-colors ${
                  isActive
                    ? "text-white font-semibold"
                    : "text-zinc-300 hover:text-zinc-100 font-normal"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Search, Library Manager, Profile Menu */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Expandable Netflix Search Box */}
        <div
          className={`flex items-center transition-all duration-200 ${
            searchOpen || searchQuery
              ? "bg-black/85 border border-white/80 px-2.5 py-1.5 w-48 md:w-64"
              : "w-8 justify-center"
          }`}
        >
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="text-white hover:text-zinc-300 shrink-0"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          {(searchOpen || searchQuery) && (
            <>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onBlur={() => {
                  if (!searchQuery) setSearchOpen(false);
                }}
                placeholder="Titles, people, genres"
                className="bg-transparent text-sm text-white placeholder-zinc-400 outline-none ml-2.5 w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange("");
                    searchInputRef.current?.focus();
                  }}
                  className="text-zinc-400 hover:text-white ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Localhost-Only Admin Settings Dashboard Button */}
        {isLocalhost && (
          <button
            onClick={() => onOpenAdmin("activity")}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded transition-colors"
            title="Admin Settings Dashboard (Localhost Only)"
          >
            <Activity className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Admin Dashboard</span>
          </button>
        )}

        {/* Profile Dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 focus:outline-none py-1"
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center shadow-md relative"
              style={{
                background: `linear-gradient(145deg, ${activeProfile.avatarColor}, #111111 150%)`,
              }}
            >
              {renderProfileIcon(
                activeProfile.avatarIcon,
                "w-4 h-4 text-white"
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-white transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full pt-2 w-60 z-50">
              <div className="bg-[#181818] border border-zinc-800 rounded shadow-2xl py-2 text-sm">
                <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Switch Profiles
                </div>
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSwitchProfile(p);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-zinc-800/70 transition-colors text-left ${
                      p.id === activeProfile.id
                        ? "text-white font-semibold"
                        : "text-zinc-300"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                      style={{
                        background: `linear-gradient(145deg, ${p.avatarColor}, #111111 150%)`,
                      }}
                    >
                      {renderProfileIcon(p.avatarIcon, "w-4 h-4 text-white")}
                    </div>
                    <span className="truncate flex-1">{p.name}</span>
                    {p.hasPassword && (
                      <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    )}
                    {p.isKids && (
                      <span className="text-[10px] bg-amber-400 text-black font-bold px-1 rounded">
                        KIDS
                      </span>
                    )}
                  </button>
                ))}

                <div className="border-t border-zinc-800 my-1.5" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenAccountSettings();
                  }}
                  className="w-full px-3 py-2 flex items-center gap-3 text-zinc-200 hover:text-white hover:bg-zinc-800/70 transition-colors font-medium"
                >
                  <KeyRound className="w-4 h-4 text-[#2563EB]" />
                  <span>Profile Password & Account</span>
                </button>

                {isLocalhost && (
                  <>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAdmin("profiles");
                      }}
                      className="w-full px-3 py-2 flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800/70 transition-colors"
                    >
                      <Users className="w-4 h-4 text-[#3B82F6]" />
                      <span>Manage Profiles (Admin)</span>
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAdmin("activity");
                      }}
                      className="w-full px-3 py-2 flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800/70 transition-colors"
                    >
                      <Activity className="w-4 h-4 text-[#3B82F6]" />
                      <span>Activity Logs (Admin)</span>
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAdmin("folders");
                      }}
                      className="w-full px-3 py-2 flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800/70 transition-colors"
                    >
                      <FolderSync className="w-4 h-4 text-zinc-400" />
                      <span>Storage Locations</span>
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAdmin("media");
                      }}
                      className="w-full px-3 py-2 flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800/70 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 text-zinc-400" />
                      <span>Edit Library & Posters</span>
                    </button>
                  </>
                )}

                <div className="border-t border-zinc-800 my-1.5" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onManageProfiles();
                  }}
                  className="w-full px-3 py-2 flex items-center gap-3 text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors text-xs justify-center font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import React, { useState } from "react";
import {
  SubtitleSettings,
  DEFAULT_SUBTITLE_SETTINGS,
  COLOR_PALETTE,
  BG_COLOR_PALETTE,
  OPACITY_OPTIONS,
  SubtitleFontSize,
  SubtitleFontFamily,
  SubtitleEdgeStyle,
  SubtitlePosition,
  getSubtitleTextStyle,
} from "@/types/subtitles";
import {
  Type,
  Palette,
  Layers,
  MoveVertical,
  RotateCcw,
  Check,
  X,
  Sliders,
} from "lucide-react";

interface SubtitleSettingsModalProps {
  settings: SubtitleSettings;
  onUpdateSettings: (newSettings: SubtitleSettings) => void;
  onClose: () => void;
}

export default function SubtitleSettingsModal({
  settings,
  onUpdateSettings,
  onClose,
}: SubtitleSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"text" | "background" | "position">(
    "text"
  );

  const update = (partial: Partial<SubtitleSettings>) => {
    onUpdateSettings({ ...settings, ...partial });
  };

  const handleReset = () => {
    onUpdateSettings({ ...DEFAULT_SUBTITLE_SETTINGS });
  };

  const previewTextStyle = getSubtitleTextStyle(settings);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#181818] border border-zinc-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-[#2563EB]" />
            <h3 className="font-bold text-lg text-white">Subtitle Appearance</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Cinema Preview */}
        <div className="px-6 pt-5 pb-3">
          <div className="text-xs uppercase font-bold tracking-wider text-zinc-400 mb-2">
            Live Preview
          </div>
          <div className="relative w-full h-36 sm:h-44 rounded-xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-black border border-zinc-700/60 shadow-inner flex flex-col justify-end items-center p-4">
            {/* Background simulated video scenery */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

            {/* Preview Subtitle Positioned Element */}
            <div
              className={`relative z-10 w-full text-center pointer-events-none transition-all duration-200 ${
                settings.position === "top"
                  ? "mt-2 mb-auto"
                  : settings.position === "middle"
                  ? "my-auto"
                  : "mb-2 mt-auto"
              }`}
            >
              <span
                style={previewTextStyle}
                className="inline-block whitespace-pre-line font-medium shadow-md transition-all duration-150"
              >
                [Dramatic orchestral swell]
                {"\n"}
                "Now you can customize subtitles exactly how you like them."
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 px-6 gap-2">
          <button
            onClick={() => setActiveTab("text")}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "text"
                ? "border-[#2563EB] text-[#3B82F6]"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Text & Font</span>
          </button>
          <button
            onClick={() => setActiveTab("background")}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "background"
                ? "border-[#2563EB] text-[#3B82F6]"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Background & Edges</span>
          </button>
          <button
            onClick={() => setActiveTab("position")}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "position"
                ? "border-[#2563EB] text-[#3B82F6]"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <MoveVertical className="w-4 h-4" />
            <span>Positioning</span>
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {activeTab === "text" && (
            <div className="space-y-5">
              {/* Text Color */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                  Text Color
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {COLOR_PALETTE.map((c) => {
                    const isSelected =
                      settings.textColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        onClick={() => update({ textColor: c.hex })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                          isSelected
                            ? "border-[#2563EB] bg-[#2563EB]/20 text-white shadow-sm"
                            : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-zinc-500"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/30 shadow-sm"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-1 text-[#3B82F6]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                  Font Size
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(
                    [
                      { id: "small", label: "Small" },
                      { id: "medium", label: "Medium (Default)" },
                      { id: "large", label: "Large" },
                      { id: "xlarge", label: "Extra Large" },
                    ] as const
                  ).map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => update({ fontSize: sz.id as SubtitleFontSize })}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                        settings.fontSize === sz.id
                          ? "border-[#2563EB] bg-[#2563EB] text-white shadow"
                          : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                  Font Family
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(
                    [
                      { id: "sans", label: "Sans-Serif", sample: "font-sans" },
                      { id: "serif", label: "Serif", sample: "font-serif" },
                      { id: "mono", label: "Monospace", sample: "font-mono" },
                      { id: "casual", label: "Casual", sample: "italic" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() =>
                        update({ fontFamily: f.id as SubtitleFontFamily })
                      }
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                        settings.fontFamily === f.id
                          ? "border-[#2563EB] bg-[#2563EB] text-white shadow"
                          : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      <span className={f.sample}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "background" && (
            <div className="space-y-5">
              {/* Background Opacity */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                  Background Opacity
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {OPACITY_OPTIONS.map((op) => (
                    <button
                      key={op}
                      onClick={() => update({ bgOpacity: op })}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all text-center ${
                        settings.bgOpacity === op
                          ? "border-[#2563EB] bg-[#2563EB] text-white shadow"
                          : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {op === 0 ? "Off (0%)" : `${op}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color */}
              {settings.bgOpacity > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                    Background Color
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    {BG_COLOR_PALETTE.map((bg) => {
                      const isSelected =
                        settings.bgColor.toLowerCase() === bg.hex.toLowerCase();
                      return (
                        <button
                          key={bg.hex}
                          onClick={() => update({ bgColor: bg.hex })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                            isSelected
                              ? "border-[#2563EB] bg-[#2563EB]/20 text-white"
                              : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-zinc-500"
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: bg.hex }}
                          />
                          <span>{bg.name}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 ml-1 text-[#3B82F6]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Text Edge Style / Shadow */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                  Character Edge Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: "dropShadow", label: "Drop Shadow (Default)" },
                      { id: "outline", label: "Uniform Outline" },
                      { id: "raised", label: "Raised" },
                      { id: "depressed", label: "Depressed" },
                      { id: "none", label: "None" },
                    ] as const
                  ).map((edge) => (
                    <button
                      key={edge.id}
                      onClick={() =>
                        update({ edgeStyle: edge.id as SubtitleEdgeStyle })
                      }
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                        settings.edgeStyle === edge.id
                          ? "border-[#2563EB] bg-[#2563EB] text-white shadow"
                          : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {edge.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "position" && (
            <div className="space-y-5">
              {/* Screen Position */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                  Screen Alignment
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { id: "bottom", label: "Bottom (Standard)" },
                      { id: "middle", label: "Center / Middle" },
                      { id: "top", label: "Top" },
                    ] as const
                  ).map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() =>
                        update({ position: pos.id as SubtitlePosition })
                      }
                      className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                        settings.position === pos.id
                          ? "border-[#2563EB] bg-[#2563EB] text-white shadow"
                          : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Offset Slider (only if bottom position) */}
              {settings.position === "bottom" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Bottom Margin Offset
                    </label>
                    <span className="text-xs font-mono font-bold text-[#3B82F6]">
                      {settings.bottomOffset}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="26"
                    step="1"
                    value={settings.bottomOffset}
                    onChange={(e) =>
                      update({ bottomOffset: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-[#2563EB] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                    <span>Lower (Closer to Edge)</span>
                    <span>Standard (12%)</span>
                    <span>Higher (Above Controls)</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/60">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm px-6 py-2 rounded-lg transition-colors shadow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

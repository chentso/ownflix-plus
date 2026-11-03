import React from "react";

export type SubtitleFontSize = "small" | "medium" | "large" | "xlarge";
export type SubtitleFontFamily = "sans" | "serif" | "mono" | "casual";
export type SubtitleEdgeStyle =
  | "none"
  | "dropShadow"
  | "outline"
  | "raised"
  | "depressed";
export type SubtitlePosition = "bottom" | "middle" | "top";

export interface SubtitleSettings {
  textColor: string;
  fontSize: SubtitleFontSize;
  fontFamily: SubtitleFontFamily;
  bgColor: string;
  bgOpacity: number; // 0, 25, 50, 75, 100
  edgeStyle: SubtitleEdgeStyle;
  position: SubtitlePosition;
  bottomOffset: number; // in percent (e.g. 8 to 28, default 12)
}

export const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  textColor: "#FFFFFF",
  fontSize: "medium",
  fontFamily: "sans",
  bgColor: "#000000",
  bgOpacity: 75,
  edgeStyle: "dropShadow",
  position: "bottom",
  bottomOffset: 12,
};

export const COLOR_PALETTE = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Yellow", hex: "#FACC15" },
  { name: "Green", hex: "#4ADE80" },
  { name: "Cyan", hex: "#22D3EE" },
  { name: "Red", hex: "#F87171" },
  { name: "Black", hex: "#000000" },
];

export const BG_COLOR_PALETTE = [
  { name: "Black", hex: "#000000" },
  { name: "Dark Slate", hex: "#1E293B" },
  { name: "Navy Blue", hex: "#0F172A" },
  { name: "Dark Gray", hex: "#27272A" },
];

export const OPACITY_OPTIONS = [0, 25, 50, 75, 100];

export function hexToRgba(hex: string, opacityPercent: number): string {
  if (opacityPercent <= 0) return "transparent";
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, opacityPercent / 100))})`;
}

export function getSubtitleTextStyle(
  settings: SubtitleSettings
): React.CSSProperties {
  const fontFamilies: Record<SubtitleFontFamily, string> = {
    sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    casual:
      '"Comic Sans MS", "Comic Sans", "Chalkboard SE", "Comic Neue", cursive, sans-serif',
  };

  const fontSizes: Record<SubtitleFontSize, string> = {
    small: "clamp(13px, 1.5vw, 17px)",
    medium: "clamp(18px, 2.2vw, 25px)",
    large: "clamp(24px, 3.0vw, 34px)",
    xlarge: "clamp(30px, 4.0vw, 46px)",
  };

  const textShadows: Record<SubtitleEdgeStyle, string> = {
    none: "none",
    dropShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.8)",
    outline:
      "-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 2px 4px rgba(0,0,0,0.8)",
    raised: "1px 1px 0 #000, 2px 2px 0 rgba(0,0,0,0.8)",
    depressed: "-1px -1px 0 #000, 1px 1px 0 rgba(255,255,255,0.3)",
  };

  return {
    color: settings.textColor,
    fontSize: fontSizes[settings.fontSize] || fontSizes.medium,
    fontFamily: fontFamilies[settings.fontFamily] || fontFamilies.sans,
    backgroundColor: hexToRgba(settings.bgColor, settings.bgOpacity),
    textShadow: textShadows[settings.edgeStyle] || textShadows.dropShadow,
    lineHeight: 1.35,
    borderRadius: settings.bgOpacity > 0 ? "0.375rem" : "0",
    padding: settings.bgOpacity > 0 ? "0.25rem 0.75rem" : "0.1rem 0.25rem",
  };
}

export function getSubtitleContainerStyle(
  settings: SubtitleSettings,
  controlsVisible: boolean
): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    left: "1rem",
    right: "1rem",
    textAlign: "center",
    zIndex: 25,
    pointerEvents: "none",
    transition: "bottom 0.25s ease-out, top 0.25s ease-out",
  };

  if (settings.position === "top") {
    return {
      ...base,
      top: "clamp(3.5rem, 8vh, 6rem)",
    };
  }

  if (settings.position === "middle") {
    return {
      ...base,
      top: "50%",
      transform: "translateY(-50%)",
    };
  }

  // Default "bottom"
  const defaultOffset = `${settings.bottomOffset || 12}%`;
  return {
    ...base,
    bottom: controlsVisible ? "clamp(7rem, 15vh, 9.5rem)" : defaultOffset,
  };
}
